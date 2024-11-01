import express from "express";
import { authenticateToken } from "./Middleware.js";
import WorkflowController from '../controllers/WorkflowController.js';

// Set up new route
const WorkflowRoutes = express.Router();

// Define routes
WorkflowRoutes.get("/health", WorkflowController.healthCheck);
WorkflowRoutes.get("/", authenticateToken, WorkflowController.getAllWorkflows);
WorkflowRoutes.post("/save", authenticateToken, WorkflowController.saveWorkflow);
WorkflowRoutes.get("/:id", authenticateToken, WorkflowController.getWorkflowById);
WorkflowRoutes.put("/:id", authenticateToken, WorkflowController.updateWorkflow);
WorkflowRoutes.delete("/:id", authenticateToken, WorkflowController.deleteWorkflow);
WorkflowRoutes.put("/:id/name", authenticateToken, WorkflowController.renameWorkflow);
WorkflowRoutes.get("/:id/status", authenticateToken, WorkflowController.fetchWorkflowState);
WorkflowRoutes.post("/:id/start", authenticateToken, WorkflowController.activateWorkflow);
WorkflowRoutes.post("/:id/stop", authenticateToken, WorkflowController.deactivateWorkflow);

console.log(`Workflow Routes Started...`);

export default WorkflowRoutes;