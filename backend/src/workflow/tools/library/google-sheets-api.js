import BaseAction from "./BaseAction.js";
import { google } from "googleapis";

class GoogleSheetsOperation extends BaseAction {
  constructor() {
    super("googleSheetsOperation");
  }
  async execute(params, inputData, workflowEngine) {
    this.validateParams(params);

    try {
      const clientEmail = process.env.GOOGLESHEETS_CLIENT_EMAIL;
      const privateKey = process.env.GOOGLESHEETS_PRIVATE_KEY.replace(/\\n/g, '\n');

      if (!clientEmail || !privateKey) {
        throw new Error("Google credentials not found in environment variables");
      }

      const jwtClient = new google.auth.JWT(
        clientEmail,
        null,
        privateKey,
        ["https://www.googleapis.com/auth/spreadsheets"]
      );

      await jwtClient.authorize();
      const sheets = google.sheets({ version: "v4", auth: jwtClient });

      const resolvedSpreadsheetId =
        workflowEngine.parameterResolver.resolveTemplate(params.spreadsheetId);
      const resolvedRange = workflowEngine.parameterResolver.resolveTemplate(
        params.range
      );

      const processValues = (values) => {
        if (typeof values === "string") {
          // Remove outer brackets if present
          const trimmedValues = values.trim().replace(/^\[|\]$/g, "");
      
          // Split the string into multiple elements
          const elements = trimmedValues.split(/,(?![^{]*})/);
      
          // Resolve each element
          return elements.map(element => 
            workflowEngine.parameterResolver.resolveTemplate(element.trim())
          );
        } else if (Array.isArray(values)) {
          // Handle array input
          return values.map(value =>
            workflowEngine.parameterResolver.resolveTemplate(value)
          );
        } else {
          throw new Error("Invalid values format");
        }
      };

      switch (params.operation) {
        case "Read":
          const readResult = await sheets.spreadsheets.values.get({
            spreadsheetId: resolvedSpreadsheetId,
            range: resolvedRange,
          });
          return this.formatOutput({
            success: true,
            result: readResult.data.values,
            error: null,
          });
        case "Write":
        case "Append":
          const processedValues = processValues(params.values);
          const valueRange = {
            values: [processedValues], // Wrap processedValues in an array to ensure it's treated as a single row
          };

          let result;
          if (params.operation === "Write") {
            result = await sheets.spreadsheets.values.update({
              spreadsheetId: resolvedSpreadsheetId,
              range: resolvedRange,
              valueInputOption: "RAW",
              resource: valueRange,
            });
          } else {
            result = await sheets.spreadsheets.values.append({
              spreadsheetId: resolvedSpreadsheetId,
              range: resolvedRange,
              valueInputOption: "RAW",
              insertDataOption: "INSERT_ROWS",
              resource: valueRange,
            });
          }
          return this.formatOutput({
            success: true,
            result: result.data,
            error: null,
          });
        case "Clear":
          const clearResult = await sheets.spreadsheets.values.clear({
            spreadsheetId: resolvedSpreadsheetId,
            range: resolvedRange,
          });
          return this.formatOutput({
            success: true,
            result: clearResult.data,
            error: null,
          });
        default:
          throw new Error(`Unknown operation: ${params.operation}`);
      }
    } catch (error) {
      console.error("Error performing Google Sheets operation:", error);
      return this.formatOutput({
        success: false,
        result: null,
        error: error.message,
      });
    }
  }
  validateParams(params) {
    if (!params.operation || !params.spreadsheetId || !params.range) {
      throw new Error(
        "Operation, spreadsheetId, and range are required for Google Sheets operations"
      );
    }
  }
}

export default new GoogleSheetsOperation();