import { EventEmitter } from "events";
import db from "../database/index.js";
import ProcessWorker from "./ProcessWorker.js";
import WorkflowModel from "../models/WorkflowModel.js";
import EmailReceiver from "./tools/triggers/EmailReceiver.js";
import WebhookReceiver from "./tools/triggers/WebhookReceiver.js";

class ProcessManager extends EventEmitter {
  constructor(numWorkers = 4, webhookPort = 3001) {
    super();
    this.queue = [];
    this.workers = new Array(numWorkers)
      .fill(null)
      .map(() => new ProcessWorker(this));
    this.activeWorkflows = new Map();
    this.pendingWorkflows = new Set();
    this.enqueuingWorkflows = new Set();
    this.EmailReceiver = new EmailReceiver(this);
    this.WebhookReceiver = new WebhookReceiver(this, webhookPort);
  }

  // PUBLIC METHODS
  async activateWorkflow(workflow, userId, triggerData) {
    const workflowId = workflow.id;

    if (this._isWorkflowInQueueOrActive(workflowId)) {
      console.log(
        `Workflow ${workflowId} is already queued, active, pending, or being enqueued`
      );
      return {
        error: "Workflow is already queued or running",
        workflowId: workflowId,
      };
    }

    try {
      this.queue.push({ workflow, userId, triggerData });
      console.log(
        `Workflow ${workflowId} scheduled to queue for execution. Queue length: ${this.queue.length}`
      );
      await this._updateWorkflowStatus(workflowId, "queued");
      this.emit("workAdded");
      this.assignWorkToWorkers();
      return {
        message: "Workflow queued for execution",
        workflowId: workflowId,
      };
    } catch (error) {
      console.error(`Error enqueueing workflow ${workflowId}:`, error);
      return { error: "Failed to enqueue workflow", workflowId: workflowId };
    }
  }
  async deactivateWorkflow(workflowId, userId) {
    console.log(`Attempting to stop workflow ${workflowId}`);
    let message = "";

    this.pendingWorkflows.delete(workflowId);
    this.enqueuingWorkflows.delete(workflowId);

    const queueIndex = this.queue.findIndex(
      (job) => job.workflow.id === workflowId
    );
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
      message += "Workflow removed from queue. ";
    }

    const workflowEngine = this.activeWorkflows.get(workflowId);
    if (workflowEngine) {
      await workflowEngine.stopWorkflowListeners();
      this.activeWorkflows.delete(workflowId);
      this.WebhookReceiver.unregisterWebhook(this.workflowId);
      message += "Active workflow stopped. ";
    }

    for (const worker of this.workers) {
      if (worker.currentWorkflow && worker.currentWorkflow.id === workflowId) {
        await worker.stopCurrentProcessing();
        message += "Worker stopped processing workflow. ";
      }
    }

    await this._updateWorkflowStatus(workflowId, "stopped");

    const isStillActive = this._isWorkflowInQueueOrActive(workflowId);

    this.emit("workflowStatusUpdate", workflowId, {
      status: isStillActive ? "running" : "stopped",
      isActive: isStillActive,
      queueLength: this.queue.length,
      activeWorkflowsCount: this.activeWorkflows.size,
      workersCount: this.workers.length,
      busyWorkersCount: this.workers.filter((w) => w.isBusy).length,
    });

    console.log(`Workflow ${workflowId} stop process completed: ${message}`);

    return {
      message: message.trim() || "Workflow not found in any active processes",
      isActive: isStillActive,
    };
  }
  async fetchWorkflowState(workflowId, userId) {
    const workflowEngine = this.activeWorkflows.get(workflowId);
    if (workflowEngine) {
      return {
        status: "running",
        outputs: workflowEngine.outputs || {},
        errors: workflowEngine.errors || {},
        currentNodeId: workflowEngine.currentNodeId,
        activeEdges: Array.from(workflowEngine.activeEdges || []),
        queueLength: this.queue.length,
        activeWorkflowsCount: this.activeWorkflows.size,
        workersCount: this.workers.length,
        busyWorkersCount: this.workers.filter((w) => w.isBusy).length,
      };
    } else if (this.queue.some((job) => job.workflow.id === workflowId)) {
      return {
        status: "queued",
        queueLength: this.queue.length,
        activeWorkflowsCount: this.activeWorkflows.size,
        workersCount: this.workers.length,
        busyWorkersCount: this.workers.filter((w) => w.isBusy).length,
      };
    } else {
      return new Promise((resolve, reject) => {
        db.get(
          "SELECT status FROM workflows WHERE id = ? AND user_id = ?",
          [workflowId, userId],
          (err, row) => {
            if (err) reject(err);
            else if (!row) resolve({ status: "Not Found" });
            else
              resolve({
                status: row.status === "running" ? "stopped" : row.status,
                queueLength: this.queue.length,
                activeWorkflowsCount: this.activeWorkflows.size,
                workersCount: this.workers.length,
                busyWorkersCount: this.workers.filter((w) => w.isBusy).length,
              });
          }
        );
      });
    }
  }
  async restartActiveWorkflows() {
    try {
      console.log("Restarting active workflows...");
      const activeWorkflows = await WorkflowModel.findByStatus(['listening', 'running']);
      
      for (const workflowData of activeWorkflows) {
        const workflow = JSON.parse(workflowData.workflow_data);
        workflow.id = workflowData.id;
        
        console.log(`Restarting workflow: ${workflow.id}`);
        await this.activateWorkflow(workflow, workflowData.user_id);
      }
      
      console.log(`Restarted ${activeWorkflows.length} workflows`);
    } catch (error) {
      console.error("Error restarting active workflows:", error);
    }
  }
  assignWorkToWorkers() {
    console.log(`Processing queue. Queue length: ${this.queue.length}`);
    this.workers.forEach((worker, index) => {
      if (!worker.isBusy && this.queue.length > 0) {
        const job = this.queue.shift();
        console.log(`Worker ${index} processing workflow ${job.workflow.id}`);
        worker.handleWorkflowTrigger(job, this.activeWorkflows);
      } else if (worker.isBusy) {
        console.log(`Worker ${index} is busy`);
      } else {
        console.log(`Worker ${index} is idle. No jobs in queue.`);
      }
    });
  }
  releaseResources() {
    this.EmailReceiver.cleanupIMAP();
    this.WebhookReceiver.shutdown();
  }

  // PRIVATE METHODS
  async _updateWorkflowStatus(workflowId, status) {
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE workflows SET status = ? WHERE id = ?",
        [status, workflowId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
  _isWorkflowInQueueOrActive(workflowId) {
    return (
      this.queue.some((job) => job.workflow.id === workflowId) ||
      (this.activeWorkflows.has(workflowId) &&
        this.activeWorkflows.get(workflowId).isRunning)
    );
  }
}

export default new ProcessManager;