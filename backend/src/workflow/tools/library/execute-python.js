import BaseAction from './BaseAction.js';
import { spawn } from 'child_process';

class ExecutePython extends BaseAction {
  constructor() {
    super('executePython');
    this.maxExecutionTime = 60000; // 60 seconds
  }

  async execute(params, inputData, workflowEngine) {
    this.validateParams(params);
  
    // Resolve parameters
    const resolvedParams = workflowEngine.parameterResolver.resolveParameters(params);
  
    console.log("Executing Python code:", resolvedParams.code);
  
    try {
      const result = await this.runPythonCode(resolvedParams.code, inputData, workflowEngine);
  
      return this.formatOutput({
        success: true,
        result: result.result,
        output: result.output,
        error: result.error,
      });
    } catch (error) {
      console.error("Error executing Python code:", error);
      return this.formatOutput({
        success: false,
        result: null,
        output: null,
        error: error.message,
      });
    }
  }

  async runPythonCode(userCode, inputData, workflowEngine) {
    return new Promise((resolve, reject) => {
      const wrappedCode = `
import json
import sys
from io import StringIO
import traceback

def main(workflow_input, workflow_context):
${userCode.split('\n').map(line => '    ' + line).join('\n')}
    
    # Ensure result is defined
    if 'result' not in locals():
        return {"error": "No result was defined in the user code"}
    return result

def run_user_code(workflow_input, workflow_context):
    output = StringIO()
    sys.stdout = output
    sys.stderr = output
    result = None
    error = None
    try:
        result = main(workflow_input, workflow_context)
    except Exception as e:
        error = str(e)
        traceback.print_exc(file=output)
    finally:
        sys.stdout = sys.__stdout__
        sys.stderr = sys.__stderr__
    return {'result': result, 'output': output.getvalue(), 'error': error}

input_data = json.loads(sys.stdin.read())
result = run_user_code(input_data['inputData'], input_data['workflowContext'])
print(json.dumps(result))
      `;

      const pythonProcess = spawn('python', ['-c', wrappedCode]);

      let stdout = '';
      let stderr = '';

      const timeout = setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Python script execution timed out'));
      }, this.maxExecutionTime);

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          console.error(`Python script exited with code ${code}`);
          console.error(`STDERR: ${stderr}`);
          console.error(`STDOUT: ${stdout}`);
          reject(new Error(`Python script exited with code ${code}\n${stderr}`));
        } else {
          try {
            const parsedOutput = JSON.parse(stdout);
            resolve(parsedOutput);
          } catch (error) {
            console.error(`Failed to parse Python script output: ${error.message}`);
            console.error(`Raw output: ${stdout}`);
            reject(new Error(`Failed to parse Python script output: ${error.message}\nOutput: ${stdout}`));
          }
        }
      });

      // Pass input data to Python script
      const inputJson = JSON.stringify({
        inputData,
        workflowContext: workflowEngine.DB,
      });
      pythonProcess.stdin.write(inputJson);
      pythonProcess.stdin.end();
    });
  }

  validateParams(params) {
    if (!params.code) {
      throw new Error('Code is required for Python execution');
    }
  }

  formatOutput(output) {
    return {
      ...output,
      outputs: output.result,
    };
  }
}

export default new ExecutePython();