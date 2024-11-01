import BaseAction from './BaseAction.js';
import SlackReceiver from '../triggers/SlackReceiver.js';

class SendSlackMessage extends BaseAction {
  constructor() {
    super('sendSlackMessage');
  }

  async execute(params, inputData, workflowEngine) {
    try {
      if (!workflowEngine.receivers.slack) {
        // Initialize Slack receiver if it doesn't exist
        workflowEngine.receivers.slack = SlackReceiver();
        await workflowEngine.receivers.slack.initialize();
      }
      const result = await workflowEngine.receivers.slack.sendMessage(
        params.channelId,
        params.message
      );
      return this.formatOutput({
        success: true,
        timestamp: result.ts,
        error: null,
      });
    } catch (error) {
      console.error("Error sending Slack message:", error);
      return this.formatOutput({
        success: false,
        timestamp: null,
        error: error.message,
      });
    }
  }
}

export default new SendSlackMessage();