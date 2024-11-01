import StreamEngine from "../stream/StreamEngine.js";
import dotenv from "dotenv";

dotenv.config();

class StreamController {
  constructor() {
    this.ai = new StreamEngine();
  }

  // Break typical controller pattern and use arrow functions to automatically bind 'this'
  healthCheck = (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.status(200).json({ status: "OK" });
  }
  startToolForgeStream = async (req, res) => {
    try {
      const { query, provider, model } = req.body;
      const files = req.files
      this.ai.startStream(
        req,
        res,
        query,
        files,
        provider,
        model,
        'false',
        null
      );
    } catch (error) {
      console.error("Error starting Tool Forge stream:", error);
      res.status(500).json({ error: "Failed to start Tool Forge stream" });
    }
  };
  cancelToolForgeStream = async (req, res) => {
    try {
      const { streamId } = req.body;
      await this.ai.cancelStream(streamId);
      res.status(200).json({
        message: `Tool Forge stream with ID ${streamId} has been cancelled.`,
      });
    } catch (error) {
      console.error("Error cancelling Tool Forge stream:", error);
      // Send a 200 status even if there's an error, as the stream cancellation might have succeeded
      res.status(200).json({ message: "Stream cancellation request processed", error: error.message });
    }
  };
  startChatStream = async (req, res) => {
    try {
      
      console.log(req.body);
      const { query, provider, model, isChat, messages } = req.body;
      
      // Parse the query JSON string
      const parsedQuery = JSON.parse(query);
      
      // Extract the user's current message from the parsed query
      const userMessage = parsedQuery["user-current-message"];
      // Parse the messages JSON string
      const parsedMessages = JSON.parse(messages);
      
      // Call the AI's startStream method with the correct parameters
      this.ai.startStream(
        req,
        res,
        userMessage,
        null,
        provider,
        model,
        isChat === 'true',
        parsedMessages
      );
    } catch (error) {
      console.error("Error starting chat stream:", error);
      res.status(500).json({ error: "Failed to start chat stream" });
    }
  };
  cancelChatStream = async (req, res) => {
    try {
      const { streamId } = req.body;
      await this.ai.cancelStream(streamId);
      res.status(200).json({
        message: `Chat stream with ID ${streamId} has been cancelled.`,
      });
    } catch (error) {
      console.error("Error cancelling chat stream:", error);
      // Send a 200 status even if there's an error, as the stream cancellation might have succeeded
      res.status(200).json({ message: "Stream cancellation request processed", error: error.message });
    }
  };
  generateTool = async (req, res) => {
    try {
      const templateOverview = req.body.templateOverview;
      const generatedTool = await this.ai.generateTool(templateOverview);
      res.json(generatedTool);
    } catch (error) {
      console.error("Error generating tool:", error);
      res.status(500).json({ error: "Failed to generate tool" });
    }
  };
  generateWorkflow = async (req, res) => {
    try {
      const workflowOverview = req.body.workflowOverview;
      const generatedWorkflow = await this.ai.generateWorkflow(workflowOverview);
      res.json(generatedWorkflow);
    } catch (error) {
      console.error("Error generating workflow:", error);
      res.status(500).json({ error: "Failed to generate workflow" });
    }
  };
}

console.log(`Stream Controller Started...`);

export default new StreamController();