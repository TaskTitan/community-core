import BaseAction from './BaseAction.js';
import axios from 'axios';

class CustomApiRequest extends BaseAction {
  constructor() {
    super('customApiRequest');
  }
  async execute(params) {
    this.validateParams(params);

    console.log('CustomApiRequest params:', JSON.stringify(params, null, 2));

    try {
      const { url, method, query, headers, body, authType, authToken, username, password } = params;

      // Remove angle brackets from URL if present
      const cleanUrl = url.startsWith('<') && url.endsWith('>') ? url.slice(1, -1) : url;

      const config = {
        url: cleanUrl,
        method: method.toLowerCase(),
        headers: typeof headers === 'string' ? JSON.parse(headers || '{}') : (headers || {}),
      };

      if (query) {
        const queryParams = new URLSearchParams(query);
        config.url += (config.url.includes('?') ? '&' : '?') + queryParams.toString();
      }

      if (method.toLowerCase() !== "get" && body) {
        try {
          config.data = typeof body === 'string' ? JSON.parse(body) : body;
        } catch (error) {
          console.error('Error parsing request body:', error);
          config.data = body;
        }
      }

      if (authType) {
        console.log('Auth configuration:', JSON.stringify({ authType, authToken, username, password }, null, 2));
        const authTypeLower = authType.toLowerCase();
        if (authTypeLower === "basic") {
          config.auth = {
            username,
            password,
          };
        } else if (authTypeLower === "bearer") {
          config.headers["Authorization"] = `Bearer ${authToken}`;
        } else if (authTypeLower === "webhook") {
          config.headers["x-webhook-token"] = authToken;
        }
      }

      console.log('Final request config:', JSON.stringify(config, null, 2));

      const response = await axios(config);

      return this.formatOutput({
        success: true,
        status: response.status,
        result: response.data,
        headers: response.headers,
        error: null,
      });
    } catch (error) {
      console.error("Error making custom API request:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      return this.formatOutput({
        success: false,
        status: error.response ? error.response.status : null,
        result: null,
        headers: null,
        error: error.message,
      });
    }
  }
  validateParams(params) {
    if (!params.url || !params.method) {
      throw new Error('URL and method are required for custom API requests');
    }
    if (params.authType) {
      const authTypeLower = params.authType.toLowerCase();
      if (authTypeLower === "basic" && (!params.username || !params.password)) {
        throw new Error('Username and password are required for Basic authentication');
      }
      if ((authTypeLower === "bearer" || authTypeLower === "webhook") && !params.authToken) {
        throw new Error('Auth token is required for Bearer or Webhook authentication');
      }
    }
  }
}

export default new CustomApiRequest();