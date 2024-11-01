import express from "express";
import { authenticateToken } from "./Middleware.js";
import StreamController from '../controllers/StreamController.js';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const StreamRoutes = express.Router();

StreamRoutes.get("/health", StreamController.healthCheck);
StreamRoutes.post("/start-tool-forge-stream", authenticateToken, upload.array('files'), StreamController.startToolForgeStream);
StreamRoutes.post("/cancel-tool-forge-stream", authenticateToken, StreamController.cancelToolForgeStream);
StreamRoutes.post("/start-chat-stream", authenticateToken, upload.array('files'), StreamController.startChatStream);
StreamRoutes.post("/cancel-chat-stream", authenticateToken, StreamController.cancelChatStream);
StreamRoutes.post("/generate-tool", authenticateToken, StreamController.generateTool);
StreamRoutes.post("/generate-workflow", authenticateToken, StreamController.generateWorkflow);

console.log(`Stream Routes Started...`);

export default StreamRoutes;