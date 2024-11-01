import express from "express";
import { authenticateToken, sessionMiddleware } from './Middleware.js';
import UserController from '../controllers/UserController.js';

// Set up new route
const UserRoutes = express.Router();

// Set up middleware
UserRoutes.use(sessionMiddleware);

// Define routes
UserRoutes.get("/health", UserController.healthCheck);
UserRoutes.get("/user-stats", authenticateToken, UserController.getUserStats);

console.log(`User Routes Started...`);

export default UserRoutes;