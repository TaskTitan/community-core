import { Client, GatewayIntentBits } from "discord.js";
import BaseAction from "./BaseAction.js";
import dotenv from "dotenv";

dotenv.config();

class SendDiscordMessage extends BaseAction {
  constructor() {
    super("send-discord-message");
    this.client = new Client({
        intents: [GatewayIntentBits.Guilds]
    });
  }
  async execute(params, inputData) {
    if (!process.env.DISCORD_BOT_TOKEN) {
      throw new Error(
        "DISCORD_BOT_TOKEN is not set in the environment variables"
      );
    }

    try {
      await this.client.login(process.env.DISCORD_BOT_TOKEN);
      const channel = await this.client.channels.fetch(params.channelId);
      const message = await channel.send(params.message);

      return {
        success: true,
        messageId: message.id,
        timestamp: message.createdTimestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    } finally {
      this.client.destroy();
    }
  }
}

export default new SendDiscordMessage();
