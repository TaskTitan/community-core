import BaseAction from "./BaseAction.js";

class Delay extends BaseAction {
  constructor() {
    super("delay");
  }
  async execute(params, inputData, workflowEngine) {
    this.validateParams(params);

    const duration = params.duration;
    const unit = params.unit;
    let delayMs;

    switch (unit) {
      case "milliseconds":
        delayMs = duration;
        break;
      case "seconds":
        delayMs = duration * 1000;
        break;
      case "minutes":
        delayMs = duration * 60000;
        break;
      case "hours":
        delayMs = duration * 3600000;
        break;
      default:
        throw new Error("Invalid time unit for delay");
    }

    const delayedUntil = new Date(Date.now() + delayMs).toISOString();
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return this.formatOutput({ delayedUntil });
  }
  validateParams(params) {
    if (!params.duration || !params.unit) {
      throw new Error("Duration and unit are required for delay");
    }
  }
}

export default new Delay();
