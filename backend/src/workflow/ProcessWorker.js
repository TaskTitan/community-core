import { EventEmitter } from "events";
import WorkflowEngine from "./WorkflowEngine.js";
import WorkflowModel from "../models/WorkflowModel.js";

class ProcessWorker extends EventEmitter {
  constructor(processManager) {
    super();
    this.processManager = processManager;
    this.isBusy = false;
    this.currentWorkflow = null;
  }
  
  // PUBLIC METHODS
  async handleWorkflowTrigger(job, activeWorkflows) {
    const { workflow, userId, triggerData } = job;
    this.isBusy = true;
    this.currentWorkflow = workflow;
  
    console.log(`Worker starting to process workflow ${workflow.id}`);
  
    let engine;
    try {
      console.log(`Starting initialization of workflow ${workflow.id}`);
  
      // Initialize Workflow Engine Listeners for this workflow
      engine = new WorkflowEngine(workflow, workflow.id, userId);

      // Set up error listener
      engine.on('workflowError', async (errors) => {
        console.error(`Errors in workflow ${workflow.id}:`, errors);
        await this._updateWorkflowStatusAndEmit(workflow.id, "error", false, activeWorkflows);
      });

      //  Set up workflow listeners
      await engine.setupWorkflowListeners();
      console.log(`Workflow ${workflow.id} listeners initialized`);
  
      // Add the engine to activeWorkflows
      activeWorkflows.set(workflow.id, engine);
  
      if (Object.keys(engine.errors).length > 0) {
        this.emit("workflowError", this.errors);
        await this._updateWorkflowStatus("error");
      } else {
        await this._updateWorkflowStatusAndEmit(workflow.id, "listening", false, activeWorkflows);
      }
  
      if (triggerData) {
        // If triggerData exists, process the workflow
        console.log(`Processing initial trigger for workflow ${workflow.id}`);
        await engine.processWorkflowTrigger(triggerData);
      }
  
    } catch (error) {
      await this._handleWorkflowError(workflow.id, error, activeWorkflows);
    } finally {
      this.isBusy = false;
      this.currentWorkflow = null;
      this.processManager.emit("workComplete");
      this.processManager.assignWorkToWorkers();
    }
  }
  async stopCurrentProcessing() {
    if (this.currentWorkflow) {
      const workflowId = this.currentWorkflow.id;
      console.log(`Stopping current workflow: ${workflowId}`);
      // Implement the logic to stop the current workflow
      // This might involve calling a method on the WorkflowEngine instance
      const engine = this.processManager.activeWorkflows.get(workflowId);
      if (engine) {
        await engine.stopWorkflowListeners();
      }
      this.isBusy = false;
      this.currentWorkflow = null;
      console.log(`Workflow ${workflowId} stopped`);
    }
  }

  // PRIVATE METHODS
  async _handleWorkflowError(workflowId, error, activeWorkflows) {
    console.error(`Error in workflow ${workflowId}:`, error);
    await this._updateWorkflowStatusAndEmit(
      workflowId,
      "error",
      false,
      activeWorkflows
    );
  }
  async _updateWorkflowStatusAndEmit(
    workflowId,
    status,
    isActive,
    activeWorkflows
  ) {
    console.log(`Updating and emitting status for workflow ${workflowId}: ${status}`);
    await this._updateWorkflowStatus(workflowId, status);

    if (status === "running") {
      activeWorkflows.set(workflowId, this.currentWorkflow);
    }

    this.processManager.emit("workflowStatusUpdate", workflowId, {
      status,
      isActive,
      queueLength: this.processManager.queue.length,
      activeWorkflowsCount: activeWorkflows.size,
      workersCount: this.processManager.workers.length,
      busyWorkersCount: this.processManager.workers.filter((w) => w.isBusy)
        .length,
    });
    console.log(`Status update emitted for workflow ${workflowId}`);
  }
  async _updateWorkflowStatus(workflowId, status) {
    try {
      console.log(`Updating workflow ${workflowId} status to ${status}`);
      const result = await WorkflowModel.updateStatus(workflowId, status);
      console.log(`Workflow status update result:`, result);
      if (!result) {
        console.warn(`No workflow found with id ${workflowId}`);
      }
    } catch (error) {
      console.error(`Error updating workflow status: ${error.message}`);
      throw error;
    }
  }
}

export default ProcessWorker;