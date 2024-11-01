import pkg from '@slack/bolt';
const { App } = pkg;
import dotenv from 'dotenv';

dotenv.config();

let instance = null;

class SlackReceiver {
  constructor() {
    if (instance) {
      return instance;
    }
    this.app = new App({
      token: process.env.SLACK_BOT_TOKEN,
      appToken: process.env.SLACK_APP_TOKEN,
      socketMode: true,
      retryConfig: {
        retries: 5,
        factor: 1.5,
        randomize: true,
      },
      clientOptions: {
        timeout: 60000, // 60 seconds
      },
    });
    this.channelSubscriptions = new Map();
    this.initialized = false;

    instance = this;
  }
  async initialize() {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = new Promise(async (resolve, reject) => {
      try {
        await this.app.start();
        console.log('⚡️ Slack app is running!');
        this.app.message(async ({ message, say }) => {
          const subscribers = this.channelSubscriptions.get(message.channel) || new Set();
          for (const callback of subscribers) {
            callback(message);
          }
        });
        this.initialized = true;
        resolve();
      } catch (error) {
        console.error('Error initializing Slack app:', error);
        reject(error);
      }
    });

    return this.initializationPromise;
  }
  async subscribeToChannel(channelId, callback) {
    if (!this.channelSubscriptions.has(channelId)) {
      this.channelSubscriptions.set(channelId, new Set());
    }
    this.channelSubscriptions.get(channelId).add(callback);
    console.log(`Subscribed to channel ${channelId}`);
  }
  async unsubscribeFromChannel(channelId, callback) {
    if (this.channelSubscriptions.has(channelId)) {
      const subscribers = this.channelSubscriptions.get(channelId);
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.channelSubscriptions.delete(channelId);
      }
      console.log(`Unsubscribed from channel ${channelId}`);
    }
  }
  async sendMessage(channel, text) {
    try {
      const result = await this.app.client.chat.postMessage({
        channel: channel,
        text: text
      });
      console.log('Message sent successfully');
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.data && error.data.error === 'channel_not_found') {
        throw new Error('Channel not found. Please check the channel ID.');
      }
      throw error;
    }
  }
}

export default function slackReceiver(config) {
  if (!instance) {
    instance = new SlackReceiver();
    if (config) {
      instance.app.token = config.token;
      instance.app.appToken = config.appToken;
    }
  }
  return instance;
}