import { Client, GatewayIntentBits } from "discord.js";
import EventEmitter from "events";
import dotenv from "dotenv";

dotenv.config();

class DiscordReceiver extends EventEmitter {
  constructor() {
    super();
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
  }
  async initialize() {
    if (!process.env.DISCORD_BOT_TOKEN) {
      throw new Error(
        "DISCORD_BOT_TOKEN is not set in the environment variables"
      );
    }

    await this.client.login(process.env.DISCORD_BOT_TOKEN);
    console.log("Discord bot is ready");

    this.client.on("messageCreate", (message) => {
      if (!message.author.bot) {
        this.emit("message", {
          content: message.content,
          author: message.author.username,
          channelId: message.channel.id,
          guildId: message.guild?.id,
          timestamp: message.createdTimestamp,
        });
      }
    });
  }
  async subscribeToChannel(channelId, callback) {
    this.on("message", (messageData) => {
      if (messageData.channelId === channelId) {
        callback(messageData);
      }
    });
  }
}

export default DiscordReceiver;
