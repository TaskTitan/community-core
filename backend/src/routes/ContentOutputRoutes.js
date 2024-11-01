import express from 'express';
import ContentOutputController from '../controllers/ContentOutputController.js';
import { authenticateToken } from './Middleware.js';

// Set up new route
const ContentOutputRoutes = express.Router();

// Define routes
ContentOutputRoutes.get("/health", ContentOutputController.healthCheck);
ContentOutputRoutes.get("/", authenticateToken, ContentOutputController.getAllContentOutputs);
ContentOutputRoutes.post("/save", authenticateToken, ContentOutputController.saveOrUpdateContentOutput);
ContentOutputRoutes.get("/:id", authenticateToken, ContentOutputController.getContentOutput);
ContentOutputRoutes.put("/:id", authenticateToken, ContentOutputController.saveOrUpdateContentOutput);
ContentOutputRoutes.delete("/:id", authenticateToken, ContentOutputController.deleteContentOutput);

// Additional routes specific to content outputs
ContentOutputRoutes.get("/workflow/:workflowId", authenticateToken, ContentOutputController.getContentOutputsByWorkflow);
ContentOutputRoutes.get("/tool/:toolId", authenticateToken, ContentOutputController.getContentOutputsByTool);

console.log(`Content Output Routes Started...`);

export default ContentOutputRoutes;