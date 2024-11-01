// *** USER CONFIGURATIONS ***
// ***************************

// EMAIL DOMAIN TO USE FOR SENDING / RECEIVING
export const IMAP_EMAIL_DOMAIN = {
  BASE_DOMAIN: "yourdomain.com", // CHANGE THIS TO YOUR EMAIL DOMAIN!
};

// ADD LLM PROVIDERS / MODELS TO FRONT END 
export const AI_PROVIDERS_CONFIG = {
  providers: ["OpenAI", "Anthropic", "TogetherAI"],
  modelsByProvider: {
    OpenAI: ["gpt-4o-mini", "gpt-4o"],
    Anthropic: ["claude-3-haiku-20240307", "claude-3-5-sonnet-20240620"],
    TogetherAI: [
      "mistralai/Mixtral-8x22B-Instruct-v0.1",
      "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    ],
  },
};

// *** DEFAULT SERVER CONFIGURATION ***
// ************************************

// default url configuration
export const API_CONFIG = {
  BASE_URL: "http://localhost:3333", // local backend url
  WEBHOOK_URL: "http://localhost:3001", // local webhook url
  REMOTE_URL: "https://api.tasktitan.ai", // remote url for sharing
};