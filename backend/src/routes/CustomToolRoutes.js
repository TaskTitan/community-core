import express from 'express';
import CustomToolController from '../controllers/CustomToolController.js';
import { authenticateToken } from './Middleware.js';

// Set up new route
const CustomToolRoutes = express.Router();

// Define routes
CustomToolRoutes.get("/health", CustomToolController.healthCheck);
CustomToolRoutes.get("/", authenticateToken, CustomToolController.getAllCustomTools);
CustomToolRoutes.post("/save", authenticateToken, CustomToolController.saveOrUpdateCustomTool);
CustomToolRoutes.get("/:id", authenticateToken, CustomToolController.getCustomTool);
CustomToolRoutes.put("/:id", authenticateToken, CustomToolController.saveOrUpdateCustomTool);
CustomToolRoutes.delete("/:id", authenticateToken, CustomToolController.deleteCustomTool);

console.log(`Custom Tool Routes Started...`);

export default CustomToolRoutes;