import ContentOutputModel from "../models/ContentOutputModel.js";
import generateUUID from '../utils/generateUUID.js'

class ContentOutputController {
  healthCheck(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.status(200).json({ status: "OK" });
  }
  async getAllContentOutputs(req, res) {
    try {
      const userId = req.user.userId;
      const outputs = await ContentOutputModel.findAllByUserId(userId);
      res.json({ outputs });
    } catch (error) {
      console.error("Error retrieving all content outputs:", error);
      res.status(500).json({ error: "Error retrieving all content outputs" });
    }
  }
  async getContentOutput(req, res) {
    try {
      const { id } = req.params;
      const output = await ContentOutputModel.findOne(id);

      if (!output) {
        return res.status(404).json({ error: "Content output not found" });
      }

      // Check if the content is shareable or if the user is the owner
      if (output.is_shareable || output.user_id === req.user.userId) {
        res.json(output);
      } else {
        res
          .status(403)
          .json({ error: "You do not have permission to view this content" });
      }
    } catch (error) {
      console.error("Error retrieving content output:", error);
      res.status(500).json({ error: "Error retrieving content output" });
    }
  }
  async saveOrUpdateContentOutput(req, res) {
    try {
      const { id, content, workflowId, toolId, isShareable } = req.body;
      const userId = req.user.userId;
  
      // Check if the output already exists
      const existingOutput = id ? await ContentOutputModel.findOne(id) : null;
      let isNewOutput = !existingOutput;
  
      let outputId;
      if (isNewOutput) {
        outputId = generateUUID(); // Generate a new UUID for the new output
      } else if (existingOutput.user_id !== userId) {
        // If the user is not the creator, create a new output with a new ID
        outputId = generateUUID();
        isNewOutput = true;
      } else {
        outputId = id; // Use the existing ID
      }
  
      await ContentOutputModel.createOrUpdate(
        outputId,
        userId,
        workflowId,
        toolId,
        content,
        isShareable
      );
  
      res.json({ 
        message: isNewOutput ? "New content output created" : "Content output updated",
        id: outputId 
      });
    } catch (error) {
      console.error("Error saving/updating content output:", error);
      res.status(500).json({ error: "Error saving/updating content output" });
    }
  }
  async getContentOutputsByWorkflow(req, res) {
    try {
      const { workflowId } = req.params;
      const userId = req.user.userId;
      const outputs = await ContentOutputModel.findByWorkflowId(
        workflowId,
        userId
      );
      res.json({ outputs });
    } catch (error) {
      console.error("Error retrieving content outputs:", error);
      res.status(500).json({ error: "Error retrieving content outputs" });
    }
  }
  async getContentOutputsByTool(req, res) {
    try {
      const { toolId } = req.params;
      const userId = req.user.userId;
      const outputs = await ContentOutputModel.findByToolId(toolId, userId);
      res.json({ outputs });
    } catch (error) {
      console.error("Error retrieving content outputs:", error);
      res.status(500).json({ error: "Error retrieving content outputs" });
    }
  }
  async deleteContentOutput(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const result = await ContentOutputModel.delete(id, userId);
      if (result === 0) {
        return res.status(404).json({ error: "Content output not found" });
      }
      res.json({ message: `Content output ${id} deleted successfully.` });
    } catch (error) {
      console.error("Error deleting content output:", error);
      res.status(500).json({
        error: "Failed to delete content output",
        details: error.message,
      });
    }
  }
}

console.log(`Content Output Controller Started...`);

export default new ContentOutputController();
