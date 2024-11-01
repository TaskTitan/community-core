import EventEmitter from "events";
import ProcessManager from "../ProcessManager.js";
import SlackReceiver from "./triggers/SlackReceiver.js";
import SheetsReceiver from "./triggers/SheetsReceiver.js";
import DiscordReceiver from "./triggers/DiscordReceiver.js";
import dotenv from "dotenv";

dotenv.config();

export default {
  triggers: {
    "receive-email": {
      setup: async (engine) => {
        engine.receivers.email = new EventEmitter();
        engine.receivers.email.on("email", (emailData) => {
          engine.processWorkflowTrigger(emailData);
        });
      },
      validate: (triggerData) =>
        "subject" in triggerData && "from" in triggerData,
      process: (inputData) => ({
        from: inputData.from,
        to: inputData.to,
        subject: inputData.subject,
        body: inputData.body,
        html: inputData.html,
        attachments: inputData.attachments,
      }),
    },
    "receive-slack-message": {
      setup: async (engine) => {
        engine.receivers.slack = SlackReceiver();
        await engine.receivers.slack.initialize();
        const slackTriggerNode = engine.workflow.nodes.find(
          (node) => node.type === "receive-slack-message"
        );
        if (
          slackTriggerNode &&
          slackTriggerNode.parameters &&
          slackTriggerNode.parameters.channelId
        ) {
          await engine.receivers.slack.subscribeToChannel(
            slackTriggerNode.parameters.channelId,
            (messageData) => {
              engine.processWorkflowTrigger(messageData);
            }
          );
        } else {
          throw new Error("Slack trigger node is missing channelId parameter");
        }
      },
      validate: (triggerData) => "text" in triggerData && "user" in triggerData,
      process: (inputData) => ({
        ...inputData,
        timestamp: inputData.ts,
        response: { ...inputData.outputs },
      }),
    },
    "google-sheets-new-row": {
      setup: async (engine, node) => {
        if (
          !node.parameters ||
          !node.parameters.spreadsheetId ||
          !node.parameters.sheetName
        ) {
          throw new Error(
            "Google Sheets trigger node is missing required parameters"
          );
        }

        engine.receivers.sheets = new SheetsReceiver({
          spreadsheetId: node.parameters.spreadsheetId,
          sheetName: node.parameters.sheetName,
        });

        engine.receivers.sheets.on("newRow", (data) => {
          engine.processWorkflowTrigger(data);
        });

        await engine.receivers.sheets.start();
      },
      validate: (triggerData) => "newRow" in triggerData,
      process: (inputData) => ({
        newRow: inputData.newRow,
      }),
    },
    "trigger-timer": {
      setup: async (engine, node) => {
        if (!node.parameters || !node.parameters.schedule) {
          throw new Error("Timer trigger node is missing schedule parameter");
        }

        const parseSchedule = (schedule) => {
          switch (schedule) {
            case "Every Minute":
              return 60 * 1000;
            case "Every 5 Minutes":
              return 5 * 60 * 1000;
            case "Every 15 Minutes":
              return 15 * 60 * 1000;
            case "Every 30 Minutes":
              return 30 * 60 * 1000;
            case "Hourly":
              return 60 * 60 * 1000;
            case "Daily":
              return 24 * 60 * 60 * 1000;
            case "Weekly":
              return 7 * 24 * 60 * 60 * 1000;
            case "Monthly":
              return 30 * 24 * 60 * 60 * 1000;
            default:
              throw new Error(`Invalid schedule: ${schedule}`);
          }
        };

        const intervalMs = parseSchedule(node.parameters.schedule);
        const timerId = setInterval(() => {
          engine.processWorkflowTrigger({
            type: "timer",
            nodeId: node.id,
            timestamp: new Date().toISOString(),
          });
        }, intervalMs);

        engine.timerIntervals.set(node.id, timerId);
        console.log(
          `Timer trigger set up for node ${node.id} with schedule ${node.parameters.schedule}`
        );
      },
      validate: (triggerData, node) =>
        triggerData.type === "timer" && triggerData.nodeId === node.id,
      process: (inputData) => ({
        timestamp: inputData.timestamp,
      }),
    },
    "webhook-listener": {
      setup: async (engine, node) => {
        try {
          const { method, authType, authToken, username, password } =
            node.parameters;
          const webhookUrl = ProcessManager.WebhookReceiver.registerWebhook(
            engine.workflowId,
            method,
            authType,
            authToken,
            username,
            password
          );
          console.log(
            `Webhook registered for workflow ${engine.workflowId}: ${webhookUrl}`
          );
        } catch (error) {
          console.error(`Error setting up webhook listener: ${error.message}`);
          engine._updateNodeError(node.id, error.message);
          await engine._updateWorkflowStatus("error");
          engine.emit("workflowError", {
            globalError: error.message,
            nodeErrors: engine.errors,
          });
        }
      },
      validate: (triggerData) => triggerData.type === "webhook",
      process: (inputData) => ({
        method: inputData.method,
        headers: inputData.headers,
        body: inputData.body,
        query: inputData.query,
        params: inputData.params,
      }),
    },
    "receive-discord-message": {
      setup: async (engine, node) => {
        if (!node.parameters || !node.parameters.channelId) {
          throw new Error(
            "Discord trigger node is missing required parameters"
          );
        }

        engine.receivers.discord = new DiscordReceiver();
        await engine.receivers.discord.initialize();

        await engine.receivers.discord.subscribeToChannel(
          node.parameters.channelId,
          (messageData) => {
            engine.processWorkflowTrigger(messageData);
          }
        );
      },
      validate: (triggerData) =>
        "content" in triggerData && "author" in triggerData,
      process: (inputData) => ({
        content: inputData.content,
        author: inputData.author,
        channelId: inputData.channelId,
        guildId: inputData.guildId,
        timestamp: inputData.timestamp,
        response: inputData,
      }),
    },
  }
};
