import BaseAction from './BaseAction.js';

class RandomNumber extends BaseAction {
  constructor() {
    super('random-number');
  }
  async execute(params, inputData, workflowEngine) {
    this.validateParams(params);

    const min = parseInt(params.min);
    const max = parseInt(params.max);
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    return { randomNumber };
  }
  validateParams(params) {
    if (!params.min || !params.max) {
      throw new Error('Both min and max parameters are required');
    }
    if (parseInt(params.min) >= parseInt(params.max)) {
      throw new Error('Min must be less than max');
    }
  }
}

export default new RandomNumber();