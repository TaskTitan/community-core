class ParameterResolver {
  constructor(workflowEngine) {
    this.workflowEngine = workflowEngine;
  }
  resolveParameters(params) {
    const resolved = {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") {
        if (key === 'code') {
          // For JavaScript code, we need to escape backticks and handle multi-line strings
          resolved[key] = this.resolveJavaScriptCode(value);
        } else {
          // For other string parameters, use the existing template resolution
          resolved[key] = this.resolveTemplate(value);
        }
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  }
  resolveTemplate(template) {
    console.log('Resolving template:', template);
    console.log('Current trigger data:', JSON.stringify(this.workflowEngine.currentTriggerData));
    
    const templateString = String(template);
  
    return templateString.replace(/{{(.*?)}}/g, (match, p1) => {
      const parts = p1.trim().split('.');
      const nodeName = parts.shift();
      let value;
  
      if (nodeName.toLowerCase() === 'trigger') {
        value = this.workflowEngine.currentTriggerData;
      } else {
        const nodeId = this.workflowEngine.nodeNameToId.get(nodeName.toLowerCase());
        value = this.workflowEngine.outputs[nodeId];
      }
  
      for (const part of parts) {
        if (value && typeof value === 'object') {
          // Handle array access
          if (part.includes('[') && part.includes(']')) {
            const [arrayName, indexStr] = part.split('[');
            const index = parseInt(indexStr.replace(']', ''), 10);
            value = value[arrayName] ? value[arrayName][index] : undefined;
          } else {
            value = value[part];
          }
        } else if (typeof value === 'string') {
          // Try to parse the string as JSON
          try {
            const parsedValue = JSON.parse(value);
            value = parsedValue[part];
          } catch (e) {
            console.warn(`Warning: Failed to parse JSON string: ${value}`);
            return undefined;
          }
        } else {
          console.warn(`Warning: Unable to resolve template ${match}`);
          return undefined;
        }
      }
  
      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        return JSON.stringify(value);
      }

      return value !== undefined ? value : undefined;
    });
  }
  resolveJavaScriptCode(code) {
    return code.replace(/{{(.*?)}}/g, (match, p1) => {
      const parts = p1.trim().split('.');
      const nodeName = parts.shift();
      let value;

      if (nodeName.toLowerCase() === 'trigger') {
        value = this.workflowEngine.currentNodeData.trigger;
      } else {
        const nodeId = this.workflowEngine.nodeNameToId.get(nodeName.toLowerCase());
        value = this.workflowEngine.outputs[nodeId];
      }

      for (const part of parts) {
        if (value && typeof value === 'object') {
          // Handle array access
          if (part.includes('[') && part.includes(']')) {
            const [arrayName, indexStr] = part.split('[');
            const index = parseInt(indexStr.replace(']', ''), 10);
            value = value[arrayName][index];
          } else {
            value = value[part];
          }
        } else {
          console.warn(`Warning: Unable to resolve template ${match}`);
          return 'null';
        }
      }

      if (typeof value === 'string') {
        // If it's a string, return it wrapped in quotes
        return JSON.stringify(value);
      } else if (typeof value === 'object' && value !== null) {
        // If it's an object, stringify it
        return JSON.stringify(value);
      } else {
        // For other types (number, boolean, null, undefined)
        return value !== undefined ? String(value) : 'null';
      }
    });
  }
}

export default ParameterResolver;