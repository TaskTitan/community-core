import { EventEmitter } from "events";
import dotenv from "dotenv";
import SimpleIMAP from "../../utils/SimpleIMAP.js";

dotenv.config();

class emailReceiver extends EventEmitter {
  constructor(processManager) {
    super();
    this.processManager = processManager;
    this.imap = null;
    this._setupSimpleIMAP();
  }

  // PUBLIC METHODS
  cleanupIMAP() {
    if (typeof this.cleanupIMAP === "function") {
      this.cleanupIMAP();
    }
  }

  // PRIVATE METHODS
  async _triggerWorkflowByEmail(workflowId, email) {
    try {
      const activeEngine = this.processManager.activeWorkflows.get(workflowId);
      if (activeEngine && (activeEngine.isListening || activeEngine.isRunning)) {
        // Log the triggering email address
        const triggerEmail = `workflow-${workflowId}@bizop.media`;
        console.log(
          `Workflow ${workflowId} triggered by email sent to: ${triggerEmail}`
        );

        const triggerData = {
          type: "email",
          from: email.from.text,
          to: email.to.text,
          subject: email.subject,
          body: email.text.trim(),
          html: email.html,
          attachments: email.attachments
        };
        await activeEngine.processWorkflowTrigger(triggerData);
      } else if (!activeEngine) {
        console.log(
          `Workflow ${workflowId} not found in active workflows. Ignoring email trigger.`
        );
      } else {
        console.log(
          `Workflow ${workflowId} is not in listening state. Ignoring email trigger.`
        );
      }
    } catch (error) {
      console.error(`Error triggering workflow ${workflowId} by email:`, error);
    }
  }
  _setupSimpleIMAP() {
    const imapConfig = {
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASS,
      host: process.env.IMAP_HOST,
      port: process.env.IMAP_PORT,
      tls: true,
      keepalive: {
        interval: 10000, // 10 seconds
        idleInterval: 300000, // 5 minutes
        forceNoop: true,
      },
    };

    let reconnectTimeout;
    const FORCE_RECONNECT_INTERVAL = 14 * 60 * 1000; // 14 minutes

    const connectIMAP = () => {
      if (this.imap) {
        this.imap.removeAllListeners();
        this.imap.destroy();
      }

      this.imap = new SimpleIMAP(imapConfig);

      this.imap
        .connect()
        .then(() => {
          console.log("IMAP connected successfully");
          this.imap.watchMailbox("INBOX", (numNewMsgs, email) => {
            console.log(`Processing email ${numNewMsgs} of ${numNewMsgs}`);
            console.log("\nEmail Details:");
            console.log(`From: ${email.from ? email.from.text : "Unknown"}`);
            console.log(`To: ${email.to ? email.to.text : "Unknown"}`);
            console.log(`Subject: ${email.subject || "No Subject"}`);
            console.log(
              `Body: ${email.text.trim() || "No plain text content"}`
            );
            console.log(`HTML: ${email.html.trim() || "No HTML content"}`);
            console.log("------------------------");

            // Check if the email is for a workflow
            const workflowId = this._parseWorkflowIdFromEmail(email.to.text);
            if (workflowId) {
              this._triggerWorkflowByEmail(workflowId, email);
            }
          });

          // Schedule the next forced reconnection
          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(() => {
            console.log("Forcing IMAP reconnection...");
            connectIMAP();
          }, FORCE_RECONNECT_INTERVAL);
        })
        .catch((error) => {
          console.error("Error connecting to IMAP:", error);
          // Attempt to reconnect immediately
          clearTimeout(reconnectTimeout);
          connectIMAP();
        });

      // Handle disconnection
      this.imap.on("end", () => {
        console.log("IMAP connection ended. Attempting to reconnect...");
        clearTimeout(reconnectTimeout);
        connectIMAP();
      });
    };

    // Initial connection
    connectIMAP();

    // Cleanup function (call this when shutting down the server)
    this.cleanupIMAP = () => {
      clearTimeout(reconnectTimeout);
      if (this.imap) {
        this.imap.removeAllListeners();
        this.imap.destroy();
      }
    };
  }
  _parseWorkflowIdFromEmail(emailAddress) {
    const match = emailAddress.match(/workflow-([a-f0-9-]+)@bizop\.media/i);
    return match ? match[1] : null;
  }
}

export default emailReceiver;