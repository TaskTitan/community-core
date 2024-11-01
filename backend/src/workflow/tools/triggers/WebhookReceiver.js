import express from "express";
import bodyParser from "body-parser";

class WebhookReceiver {
  constructor(processManager, port = 3001) {
    this.processManager = processManager;
    this.app = express();
    this.app.use(bodyParser.json());
    this.webhooks = new Map();
    this.server = null;
    this.port = port;

    this._initializeServer();
  }

  // PUBLIC METHODS
  registerWebhook(
    workflowId,
    method,
    authType,
    authToken,
    username,
    password
  ) {
    this.webhooks.set(workflowId, {
      method,
      authType,
      authToken,
      username,
      password,
      workflowId,
    });
    return `${process.env.WEBHOOK_URL}/webhook/${workflowId}`; // IF USING LOCAL SYSTEM
    // return `${process.env.REMOTE_URL}/webhook/${workflowId}`; // IF USING REMOTE SYSTEM
  }
  unregisterWebhook(workflowId) {
    this.webhooks.delete(workflowId);
  }
  async handleWebhook(req, res) {
    const { workflowId } = req.params;
    const webhook = this.webhooks.get(workflowId);
  
    let body = req.body;
  
    // Add this block to parse the body if it's a string
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (error) {
        console.error('Error parsing webhook body:', error);
      }
    }
  
    console.log("Received webhook request:", {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: body,
    });

    if (!webhook) {
      console.error(`Webhook not found for ID: ${workflowId}`);
      return res.status(404).json({ error: "Webhook not found" });
    }

    if (webhook.method && req.method !== webhook.method) {
      console.error(
        `Method not allowed: ${req.method} for webhook ${workflowId}`
      );
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (webhook.authType && webhook.authType.toLowerCase() !== "none") {
      const authTypeLower = webhook.authType.toLowerCase();
      if (authTypeLower === "basic") {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Basic ")) {
          return res.status(401).json({ error: "Unauthorized" });
        }
        const base64Credentials = authHeader.split(" ")[1];
        const credentials = Buffer.from(base64Credentials, "base64").toString(
          "ascii"
        );
        const [username, password] = credentials.split(":");
        if (username !== webhook.username || password !== webhook.password) {
          return res.status(401).json({ error: "Unauthorized" });
        }
      } else if (authTypeLower === "bearer" || authTypeLower === "webhook") {
        const providedToken =
          req.headers["authorization"] || req.headers["x-webhook-token"];
        if (!providedToken || providedToken !== `Bearer ${webhook.authToken}`) {
          return res.status(401).json({ error: "Unauthorized" });
        }
      }
    }

    const triggerData = {
      type: "webhook",
      method: req.method,
      headers: req.headers,
      body: body,
      query: req.query,
      params: req.params,
    };

    try {
      const result = await this._triggerWorkflowByWebhook(
        webhook.workflowId,
        triggerData
      );
      if (result.success) {
        res
          .status(200)
          .json({ message: "Webhook received and processed successfully" });
      } else {
        res.status(202).json({ message: result.message });
      }
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  shutdown() {
    if (this.server) {
      this.server.close();
    }
  }

  // PRIVATE METHODS
  async _triggerWorkflowByWebhook(workflowId, triggerData) {
    const activeEngine = this.processManager.activeWorkflows.get(workflowId);
    if (activeEngine && (activeEngine.isListening || activeEngine.isRunning)) {
      console.log(`Workflow ${workflowId} triggered by webhook`);
      await activeEngine.processWorkflowTrigger(triggerData);
      return { success: true };
    } else if (!activeEngine) {
      console.log(`Workflow ${workflowId} not found in active workflows. Ignoring webhook trigger.`);
      return { success: false, message: 'Workflow not found in active workflows' };
    } else {
      console.log(`Workflow ${workflowId} is not in listening state. Ignoring webhook trigger.`);
      return { success: false, message: 'Workflow is not in listening state' };
    }
  }
  _initializeServer() {
    this.app.all("/webhook/:workflowId", this.handleWebhook.bind(this));

    this.server = this.app.listen(this.port, () => {
      console.log(`Webhook server listening on port ${this.port}`);
    });

    this.server.on("error", (error) => {
      console.error(`Error starting webhook server: ${error.message}`);
    });
  }
}

export default WebhookReceiver;