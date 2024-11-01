import WorkflowModel from '../models/WorkflowModel.js';
import ProcessManager from '../workflow/ProcessManager.js';

class WorkflowController {
  healthCheck(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.status(200).json({ status: 'OK' });
  }
  async saveWorkflow(req, res) {
    try {
      const { workflow } = req.body;
      const userId = req.user.userId;

      // Check if the workflow exists and if the current user is the owner
      const existingWorkflow = await WorkflowModel.findOne(workflow.id);

      if (existingWorkflow && existingWorkflow.user_id !== userId) {
        // If the workflow exists but the current user is not the owner,
        // we'll use the ID provided by the frontend (which should be a new ID)
        console.log(`Creating new workflow with ID: ${workflow.id}`);
      } else if (existingWorkflow) {
        console.log(`Updating existing workflow with ID: ${workflow.id}`);
      } else if (workflow.id) {
        console.log(`Creating new workflow with ID: ${workflow.id}`);
      }

      const workflowData = JSON.stringify(workflow);
      const result = await WorkflowModel.createOrUpdate(workflow.id, workflowData, userId, workflow.isShareable);

      res.status(201).json({
        message: existingWorkflow ? 'Workflow updated' : 'New workflow created',
        workflowId: workflow.id,
      });
    } catch (error) {
      console.error('Error saving workflow:', error);
      res.status(500).json({ error: 'Failed to save workflow', details: error.message });
    }
  }
  async updateWorkflow(req, res) {
    try {
      const workflowData = JSON.stringify(req.body.workflow);
      const result = await WorkflowModel.update(req.params.id, workflowData, req.user.userId);
      res.json({
        message: result === 1 ? 'Workflow updated' : 'New workflow created',
        workflowId: req.params.id,
      });
    } catch (error) {
      console.error('Error updating workflow:', error);
      res.status(500).json({ error: 'Failed to update workflow', details: error.message });
    }
  }
  async getAllWorkflows(req, res) {
    try {
      const workflows = await WorkflowModel.findAllByUserId(req.user.userId);
      const mappedWorkflows = workflows.map((row) => ({
        id: row.id,
        workflow: JSON.parse(row.workflow_data),
        created_at: row.created_at,
        updated_at: row.updated_at,
        status: row.status,
      }));
      res.json({ workflows: mappedWorkflows });
    } catch (error) {
      console.error('Error retrieving workflows:', error);
      res.status(500).json({ error: 'Error retrieving workflows' });
    }
  }
  async getWorkflowById(req, res) {
    try {
      const workflow = await WorkflowModel.findOne(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      if (workflow.is_shareable || workflow.user_id === req.user.userId) {
        res.json({
          id: workflow.id,
          user_id: workflow.user_id,
          workflow: JSON.parse(workflow.workflow_data),
          created_at: workflow.created_at,
          updated_at: workflow.updated_at,
          is_shareable: Boolean(workflow.is_shareable),
        });
      } else {
        res.status(403).json({ error: 'You do not have permission to view this workflow' });
      }
    } catch (error) {
      console.error('Error retrieving workflow:', error);
      res.status(500).json({ error: 'Error retrieving workflow' });
    }
  }
  async renameWorkflow(req, res) {
    try {
      const workflow = await WorkflowModel.findOne(req.params.id, req.user.userId);
      if (!workflow) {
        const newWorkflow = { name: req.body.name, nodes: [], edges: [] };
        await WorkflowModel.create(req.params.id, JSON.stringify(newWorkflow), req.user.userId);
        res.json({
          message: 'New workflow created with name',
          id: req.params.id,
        });
      } else {
        const workflowData = JSON.parse(workflow.workflow_data);
        workflowData.name = req.body.name;
        await WorkflowModel.update(req.params.id, JSON.stringify(workflowData), req.user.userId);
        res.json({
          message: 'Workflow name updated successfully',
          id: req.params.id,
        });
      }
    } catch (error) {
      console.error('Error updating workflow name:', error);
      res.status(500).json({
        error: 'Failed to update workflow name',
        details: error.message,
      });
    }
  }
  async deleteWorkflow(req, res) {
    try {
      await ProcessManager.deactivateWorkflow(req.params.id);
      await WorkflowModel.delete(req.params.id, req.user.userId);
      res.json({ message: `Workflow ${req.params.id} deleted successfully.` });
    } catch (error) {
      console.error('Error deleting workflow:', error);
      res.status(500).json({ error: 'Failed to delete workflow', details: error.message });
    }
  }
  async fetchWorkflowState(req, res) {
    try {
      const status = await ProcessManager.fetchWorkflowState(req.params.id, req.user.userId);
      res.json(status);
    } catch (error) {
      console.error('Error retrieving workflow status:', error);
      res.status(500).json({ error: 'Error retrieving workflow status' });
    }
  }
  async activateWorkflow(req, res) {
    try {
      const workflow = await WorkflowModel.findOne(req.params.id, req.user.userId);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      const result = await ProcessManager.activateWorkflow(JSON.parse(workflow.workflow_data), req.user.userId);
      res.json(result);
    } catch (error) {
      console.error('Error starting workflow:', error);
      res.status(500).json({ error: 'Failed to start workflow', details: error.message });
    }
  }
  async deactivateWorkflow(req, res) {
    try {
      const result = await ProcessManager.deactivateWorkflow(req.params.id, req.user.userId);
      res.json(result);
    } catch (error) {
      console.error('Error stopping workflow:', error);
      res.status(500).json({ error: 'Failed to stop workflow', details: error.message });
    }
  }
}

console.log(`Workflow Controller Started...`);

export default new WorkflowController();
