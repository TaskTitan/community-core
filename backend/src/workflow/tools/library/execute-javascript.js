import BaseAction from './BaseAction.js';
import { VM } from 'vm2';
import fetch from 'node-fetch';
import { Blob } from 'node:buffer';
import { TextEncoder, TextDecoder } from 'util';

class ExecuteJavaScript extends BaseAction {
  constructor() {
    super('executeJavaScript');
  }
  async execute(params, inputData, workflowEngine) {
    this.validateParams(params);
  
    console.log("Executing JavaScript code:", params.code);
    try {
      const vm = new VM({
        timeout: 60000, // 60 seconds timeout
        sandbox: {
          console: {
            log: (...args) => console.log('Script log:', ...args),
            error: (...args) => console.error('Script error:', ...args),
          },
          context: {
            ...workflowEngine.DB,
            resolveTemplate: (template) => workflowEngine.parameterResolver.resolveTemplate(template),
          },
          inputData,
          fetch: fetch,
          btoa: (data) => Buffer.from(data).toString('base64'),
          atob: (data) => Buffer.from(data, 'base64').toString(),
          Blob: Blob,
          TextEncoder: TextEncoder,
          TextDecoder: TextDecoder,
          FileReader: class FileReader {
            constructor() {
              this.onload = null;
              this.onerror = null;
            }
            readAsDataURL(blob) {
              blob.arrayBuffer().then(buffer => {
                const base64 = Buffer.from(buffer).toString('base64');
                const mimetype = blob.type || 'application/octet-stream';
                this.result = `data:${mimetype};base64,${base64}`;
                if (this.onload) this.onload();
              }).catch(error => {
                if (this.onerror) this.onerror(error);
              });
            }
          },
          setTimeout: setTimeout,
          clearTimeout: clearTimeout,
          setInterval: setInterval,
          clearInterval: clearInterval,
          Buffer: Buffer,
          URL: URL,
          URLSearchParams: URLSearchParams,
          Uint8Array: Uint8Array,
          ArrayBuffer: ArrayBuffer,
          eval: eval,
        },
      });
  
      const wrappedCode = `
        (async () => {
          ${params.code}
        })()
      `;
  
      const result = await vm.run(wrappedCode);
  
      return this.formatOutput({
        success: true,
        result: result,
        error: null,
      });
    } catch (error) {
      console.error("Error executing JavaScript code:", error);
      return this.formatOutput({
        success: false,
        result: null,
        error: error.message,
      });
    }
  }
  validateParams(params) {
    if (!params.code) {
      throw new Error('Code is required for JavaScript execution');
    }
  }
  formatOutput(output) {
    return {
      ...output,
      outputs: output.result,
    };
  }
}

export default new ExecuteJavaScript();