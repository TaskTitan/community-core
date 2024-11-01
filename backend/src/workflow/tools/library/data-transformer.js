import BaseAction from './BaseAction.js';

class DataTransformer extends BaseAction {
  constructor() {
    super('data-transformer');
  }
  async execute(params, inputData, workflowEngine) {
    try {
      const result = this.applyTransformation(params.input, params.operation.toLowerCase(), params.arg1, params.arg2);
      return { result };
    } catch (error) {
      return { error: error.message };
    }
  }
  applyTransformation(data, operation, arg1, arg2) {
    switch (operation) {
      case 'parse':
        return JSON.parse(data);
      case 'stringify':
        return JSON.stringify(data);
      case 'trim':
        return data.trim();
      case 'uppercase':
        return data.toUpperCase();
      case 'lowercase':
        return data.toLowerCase();
      case 'capitalize':
        return data.charAt(0).toUpperCase() + data.slice(1);
      case 'replace':
        return data.replace(new RegExp(arg1, 'g'), arg2);
      case 'split':
        return data.split(arg1);
      case 'join':
        return Array.isArray(data) ? data.join(arg1) : data;
      case 'slice':
        return data.slice(parseInt(arg1), arg2 ? parseInt(arg2) : undefined);
      case 'substring':
        return data.substring(parseInt(arg1), arg2 ? parseInt(arg2) : undefined);
      case 'padstart':
        return data.padStart(parseInt(arg1), arg2);
      case 'padend':
        return data.padEnd(parseInt(arg1), arg2);
      case 'round':
        return Math.round(parseFloat(data));
      case 'floor':
        return Math.floor(parseFloat(data));
      case 'ceil':
        return Math.ceil(parseFloat(data));
      case 'tofixed':
        return parseFloat(data).toFixed(parseInt(arg1));
      default:
        throw new Error(`Unknown transformation operation: ${operation}`);
    }
  }
}

export default new DataTransformer();