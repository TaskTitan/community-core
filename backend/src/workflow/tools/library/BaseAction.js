class BaseAction {
  constructor(name) {
    this.name = name;
  }
  async execute(params, inputData, workflowEngine) {
    throw new Error("Execute method must be implemented by subclasses");
  }
  validateParams(params) {
    // Implement common parameter validation logic here
    return true;
  }
  formatOutput(output) {
    // Implement common output formatting logic here
    return output;
  }
}

export default BaseAction;