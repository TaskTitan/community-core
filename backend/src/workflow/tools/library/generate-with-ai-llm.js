import BaseAction from './BaseAction.js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

class GenerateWithAiLlm extends BaseAction {
  constructor() {
    super('generateWithAiLlm');
    this.anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION,
    });
    this.togetherai = new OpenAI({
      apiKey: process.env.TOGETHERAI_API_KEY,
      baseURL: "https://api.together.xyz/v1",
    });
  }
  async execute(params, inputData, workflowEngine) {
    this.validateParams(params);
  
    try {
      let response;
      const prompt = params.prompt || params.instructions; // Accept either prompt or instructions
      switch (params.provider.toLowerCase()) {
        case 'anthropic':
          response = await this.generateWithAnthropic({ ...params, prompt });
          break;
        case 'openai':
          response = await this.generateWithOpenAI({ ...params, prompt });
          break;
        case 'togetherai':
          response = await this.generateWithTogetherAI({ ...params, prompt });
          break;
        default:
          throw new Error(`Unsupported provider: ${params.provider}`);
      }
  
      return this.formatOutput({
        generatedText: response.generatedText,
        tokenCount: response.tokenCount,
        error: null,
      });
    } catch (error) {
      console.error("Error generating AI response:", error);
      return this.formatOutput({
        generatedText: "",
        tokenCount: 0,
        error: error.message || "Unknown error occurred",
      });
    }
  }
  async generateWithAnthropic(params) {
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: params.prompt,
          },
        ],
      },
    ];

    if (params.image) {
      const imgObj = JSON.parse(params.image);
      messages[0].content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: imgObj.type,
          data: imgObj.data,
        },
      });
    }

    const msg = await this.anthropic.messages.create({
      model: params.model || "claude-3-5-sonnet-20240620",
      max_tokens: Number(params.maxTokens) || 4096,
      temperature: Number(params.temperature) || 0,
      messages: messages,
    });

    return {
      generatedText: msg.content[0].text,
      tokenCount: msg.usage.output_tokens,
    };
  }
  async generateWithOpenAI(params) {
    const messages = [
      { role: "user", content: params.prompt }
    ];

    const completion = await this.openai.chat.completions.create({
      model: params.model || "gpt-4o-mini",
      messages: messages,
      max_tokens: Number(params.maxTokens) || 4096,
      temperature: Number(params.temperature) || 0,
    });

    return {
      generatedText: completion.choices[0].message.content,
      tokenCount: completion.usage.total_tokens,
    };
  }
  async generateWithTogetherAI(params) {
    const messages = [
      { role: "user", content: params.prompt }
    ];

    const completion = await this.togetherai.chat.completions.create({
      model: params.model || "mistralai/Mixtral-8x7B-Instruct-v0.1",
      messages: messages,
      max_tokens: Number(params.maxTokens) || 4096,
      temperature: Number(params.temperature) || 0,
    });

    return {
      generatedText: completion.choices[0].message.content,
      tokenCount: completion.usage.total_tokens,
    };
  }
  validateParams(params) {
    if (!params.prompt && !params.instructions) {
      throw new Error('Prompt or instructions are required for AI LLM generation');
    }
    if (!params.provider) {
      throw new Error('Provider is required for AI LLM generation');
    }
  }
}

export default new GenerateWithAiLlm();