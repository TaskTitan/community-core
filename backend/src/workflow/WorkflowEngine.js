import EventEmitter from "events";
import dotenv from "dotenv";
import WorkflowModel from "../models/WorkflowModel.js";
import ToolConfig from "./tools/ToolConfig.js";
import NodeExecutor from "./NodeExecutor.js";
import EdgeEvaluator from "./EdgeEvaluator.js";
import ParameterResolver from "./ParameterResolver.js";

dotenv.config();

class WorkflowEngine extends EventEmitter {
  constructor(workflow, workflowId, userId) {
    super();
    this.workflow = workflow;
    this.workflowId = workflowId;
    this.userId = userId;
    this.receivers = {};
    this.isListening = false;
    this.stopRequested = false;
    this.triggerQueue = [];
    this.outputs = {};
    this.errors = {};
    this.currentTriggerData = null;
    this.sheetsReceiver = null;
    this.triggerListeners = new Map();
    this.timerIntervals = new Map();
    this.activeEdges = new Set();
    this.nodeExecutionCounts = new Map();
    this.edgeIterations = new Map();
    this.globalMaxIterations = 100;
    this.nodeNameToId = new Map();
    this.DB = {};
    this._initializeNodeNameMapping();
    this.nodeExecutor = new NodeExecutor(this);
    this.edgeEvaluator = new EdgeEvaluator(this);
    this.parameterResolver = new ParameterResolver(this);
  }

  // PUBLIC METHODS
  async setupWorkflowListeners() {
    if (!this.workflow?.nodes) {
      throw new Error(`Invalid workflow data for workflow ${this.workflowId}`);
    }
    await this._setupTriggerListeners();
    this.isListening = true;
    console.log(`Workflow ${this.workflowId} is now listening for events`);
  }
  async processWorkflowTrigger(triggerData) {
    console.log(`Received trigger for workflow ${this.workflowId}`);
    this.triggerQueue.push(triggerData);
    if (!this.isRunning) {
      await this._handleTriggerQueue();
    }
  }
  async stopWorkflowListeners() {
    this.stopRequested = true;
    this.isListening = false;
    for (const receiver of Object.values(this.receivers)) {
      if (receiver.unsubscribe) {
        await receiver.unsubscribe();
      }
      if (receiver.stop) {
        await receiver.stop();
      }
    }
    for (const timerId of this.timerIntervals.values()) {
      clearInterval(timerId);
    }
    this.timerIntervals.clear();
  }

  // PRIVATE METHODS
  async _setupTriggerListeners() {
    const triggerNodes = this.workflow.nodes.filter(
      (node) => node.category === "trigger"
    );

    for (const node of triggerNodes) {
      const triggerConfig = ToolConfig.triggers[node.type];
      if (triggerConfig && triggerConfig.setup) {
        await triggerConfig.setup(this, node);
      } else {
        console.warn(`No setup function found for trigger type: ${node.type}`);
      }
    }
  }
  async _executeWorkflow(triggerData) {
    console.log(
      `Executing workflow ${this.workflowId} with trigger data:`,
      JSON.stringify(triggerData)
    );

    await this._updateWorkflowStatus("running");

    this.outputs = {};
    this.errors = {};
    this.currentTriggerData = triggerData;
    this.activeEdges.clear();

    const nodeMap = new Map(this.workflow.nodes.map((node) => [node.id, node]));
    const edgeMap = new Map();

    for (const edge of this.workflow.edges) {
      if (!edgeMap.has(edge.start.id)) {
        edgeMap.set(edge.start.id, []);
      }
      edgeMap.get(edge.start.id).push(edge);
    }

    const startNodes = this.workflow.nodes.filter((node) => {
      if (node.category !== "trigger") return false;

      const triggerConfig = ToolConfig.triggers[node.type];
      return triggerConfig && triggerConfig.validate(triggerData, node);
    });

    if (startNodes.length === 0) {
      throw new Error("No matching trigger node found for the incoming data");
    }

    for (const startNode of startNodes) {
      console.log(
        `Starting workflow execution with node: ${startNode.id} (${startNode.text})`
      );

      // Use triggerData as the initial input for the start node
      const startNodeResult = await this.nodeExecutor.executeNode(
        startNode,
        triggerData
      );
      if (startNodeResult.error) {
        this._updateNodeError(startNode.id, startNodeResult.error);
      }

      let currentNodeData = startNodeResult;
      const executionQueue = [startNode.id];

      this.nodeExecutionCounts.clear();
      this.edgeIterations.clear();

      while (executionQueue.length > 0) {
        const nodeId = executionQueue.shift();
        const node = nodeMap.get(nodeId);
        console.log(`Executing node: ${node.id} (${node.text})`);

        const nodeResult = await this.nodeExecutor.executeNode(
          node,
          currentNodeData
        );
        if (nodeResult.error) {
          this._updateNodeError(node.id, nodeResult.error);
        }
        currentNodeData = nodeResult;

        const edges = edgeMap.get(nodeId) || [];
        for (const edge of edges) {
          const edgeIterations = this.edgeIterations.get(edge.id) || 0;
          console.log(`EDGE ITERATIONS: ${edgeIterations}`);

          const resolvedMaxIterations = edge.maxIterations
            ? this.parameterResolver.resolveTemplate(edge.maxIterations)
            : "Infinity";
          const edgeMaxIterations =
            resolvedMaxIterations === "Infinity"
              ? Infinity
              : parseInt(resolvedMaxIterations) || Infinity;

          console.log(`EDGE MAX ITERATIONS: ${edgeMaxIterations}`);
          if (
            edgeMaxIterations !== Infinity &&
            edgeIterations >= edgeMaxIterations
          ) {
            console.warn(
              `Max iterations (${edgeMaxIterations}) reached for edge ${edge.id}. Skipping.`
            );
            continue;
          }

          if (this.edgeEvaluator.evaluateEdgeCondition(edge, currentNodeData)) {
            executionQueue.push(edge.end.id);
            this.activeEdges.add(edge.id);
            this.edgeIterations.set(edge.id, edgeIterations + 1);
          }
        }

        if (
          this.edgeIterations.size > 0 &&
          Math.max(...this.edgeIterations.values()) > this.globalMaxIterations
        ) {
          console.warn(
            `Global max iterations (${this.globalMaxIterations}) reached. Stopping execution.`
          );
          break;
        }
      }
    }

    if (Object.keys(this.errors).length > 0) {
      this.emit("workflowError", this.errors);
      await this._updateWorkflowStatus("error");
    } else {
      await this._updateWorkflowStatus("listening");
    }

    console.log(`Workflow ${this.workflowId} execution completed`);
    return { outputs: this.outputs, errors: this.errors };
  }
  async _handleTriggerQueue() {
    if (this.isRunning || this.triggerQueue.length === 0) return;

    this.isRunning = true;
    while (this.triggerQueue.length > 0 && !this.stopRequested) {
      const triggerData = this.triggerQueue.shift();
      try {
        await this._executeWorkflow(triggerData);
      } catch (error) {
        console.error(
          `Error processing trigger for workflow ${this.workflowId}:`,
          error
        );
        this.emit("workflowError", { globalError: error.message });
      }
    }
    this.isRunning = false;

    if (this.triggerQueue.length > 0) {
      setImmediate(() => this._handleTriggerQueue());
    }
  }
  async _updateWorkflowStatus(status) {
    try {
      await WorkflowModel.updateStatus(this.workflowId, status);
    } catch (error) {
      console.error(`Error updating workflow status: ${error.message}`);
      throw error;
    }
  }
  _initializeNodeNameMapping() {
    this.workflow.nodes.forEach((node) => {
      this.nodeNameToId.set(
        node.text.toLowerCase().replace(/\s+/g, ""),
        node.id
      );
    });
  }
  _updateNodeError(nodeId, error) {
    this.errors[nodeId] = error;
  }
}

export default WorkflowEngine;
