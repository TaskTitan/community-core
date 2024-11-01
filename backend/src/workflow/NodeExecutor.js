import ToolConfig from "./tools/ToolConfig.js";
import GenerateWithAiLlm from "./tools/library/generate-with-ai-llm.js";

class NodeExecutor {
  constructor(workflowEngine) {
    this.workflowEngine = workflowEngine;
  }
  async executeNode(node, inputData) {
    console.log(`Executing node: ${node.id} ${node.type} (${node.text})`);
    let output;

    try {
      // IF TRIGGER USE TOOL CONFIG
      if (node.category === "trigger") {
        const triggerConfig = ToolConfig.triggers[node.type];
        if (triggerConfig && triggerConfig.process) {
          output = triggerConfig.process(inputData);
        } else {
          throw new Error(`Invalid trigger type: ${node.type}`);
        }
      } 
      // IF CUSTOM TOOL USE CUSTOM TOOL
      else if (node.category === "custom") {
        // Handle custom tool
        output = await this.executeCustomTool(node, inputData);
      } 
      // ELSE USE TOOLS IN TOOL LIBRARY
      else {
        const actionModule = await import(`./tools/library/${node.type}.js`);
        const action = actionModule.default;

        if (!action || typeof action.execute !== "function") {
          throw new Error(`Invalid action for node type: ${node.type}`);
        }

        let resolvedParams;
        if (node.type === "google-sheets-api") {
          const { values, ...otherParams } = node.parameters;
          resolvedParams = {
            ...this.workflowEngine.parameterResolver.resolveParameters(
              otherParams
            ),
            values,
          };
        } else {
          resolvedParams =
            this.workflowEngine.parameterResolver.resolveParameters(
              node.parameters
            );
        }

        output = await action.execute(
          resolvedParams,
          inputData,
          this.workflowEngine
        );
      }

      if (output.error) {
        throw new Error(output.error);
      }

      this.workflowEngine.outputs[node.id] = output;
      console.log(`Node ${node.id} output:`, output);
      return { ...output, error: null };
    } catch (error) {
      console.error(`Error executing node ${node.id}:`, error);
      this.workflowEngine.outputs[node.id] = {
        generatedText: null,
        tokenCount: null,
        error: error.message,
      };
      this.workflowEngine.errors[node.id] = error.message;
      return {
        generatedText: null,
        tokenCount: null,
        error: error.message,
      };
    }
  }
  async executeCustomTool(node, inputData) {
    const { parameters } = node;

    // Resolve all parameters using ParameterResolver
    const resolvedParams =
      this.workflowEngine.parameterResolver.resolveParameters(parameters);

    let prompt = resolvedParams["instructions"] || "";

    // Add all custom fields to the prompt
    prompt += "\n\nParameters:";
    for (const [key, value] of Object.entries(resolvedParams)) {
      if (
        key !== "instructions" &&
        key !== "provider" &&
        key !== "model" &&
        key !== "maxTokens" &&
        key !== "temperature" &&
        key !== "image"
      ) {
        // Handle document objects specially
        if (key === "Document" && typeof value === "object") {
          prompt += `\n${key}:\nFilename: ${value.filename}\nText: ${value.text}`;
        } else {
          prompt += `\n${key}: ${value}`;
        }
      }
    }

    try {
      const result = await GenerateWithAiLlm.execute(
        {
          prompt: prompt,
          provider: resolvedParams["provider"],
          model: resolvedParams["model"],
          maxTokens: resolvedParams["maxTokens"],
          temperature: resolvedParams["temperature"],
          image: resolvedParams["image"],
        },
        inputData,
        this.workflowEngine
      );

      return {
        generatedText: result.generatedText,
        tokenCount: result.tokenCount || 0,
        error: null,
      };
    } catch (error) {
      return {
        generatedText: null,
        tokenCount: 0,
        error: `Error executing custom tool: ${error.message}`,
      };
    }
  }
}

export default NodeExecutor;
