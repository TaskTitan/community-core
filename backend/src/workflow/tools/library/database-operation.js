import BaseAction from "./BaseAction.js";
import db from "../../../database/index.js";

class DatabaseOperation extends BaseAction {
  constructor() {
    super("database-operation");
  }
  async execute(params, inputData, workflowEngine) {
    try {
      this.validateParams(params);

      console.log(params);

      const { operation, tableName, columns, values, condition } = params;
      const userId = workflowEngine.userId; // Assume this method exists to get the current user's ID

      let result;

      switch (operation.toUpperCase()) {
        case "SELECT":
          result = await this.select(userId, tableName, columns, condition);
          return { success: true, result };

        case "INSERT":
          result = await this.insert(userId, tableName, columns, values);
          return { success: true, affectedRows: result.changes };

        case "UPDATE":
          result = await this.update(
            userId,
            tableName,
            columns,
            values,
            condition
          );
          return { success: true, affectedRows: result.affectedRows };

        case "DELETE":
          result = await this.delete(userId, tableName, condition, values);
          return { success: true, affectedRows: result.affectedRows };

        default:
          throw new Error("Invalid operation");
      }
    } catch (error) {
      console.error("Error in DatabaseOperation:", error);
      return { success: false, error: error.message };
    }
  }
  validateParams(params) {
    const { operation, tableName } = params;
    if (!operation || !tableName) {
      throw new Error("Operation and tableName are required parameters");
    }
  }
  async select(userId, tableName, columns, condition) {
    try {
      let sql;
      let params = [userId, tableName];
      let whereClause = "";
      let orderByClause = "";

      if (columns === "*") {
        // If '*' is specified, select all columns
        sql = `SELECT * FROM user_data WHERE user_id = ? AND table_name = ?`;
      } else {
        // Otherwise, select specific columns from the data JSON
        const columnArray = columns.split(",").map((col) => col.trim());
        const columnSelects = columnArray
          .map((col) => `json_extract(data, '$.${col}') as ${col}`)
          .join(", ");
        sql = `SELECT id, user_id, table_name, ${columnSelects}, created_at, updated_at FROM user_data WHERE user_id = ? AND table_name = ?`;
      }

      if (condition) {
        // Split condition into WHERE and ORDER BY parts
        const parts = condition.split(/\b(ORDER BY|LIMIT|OFFSET)\b/i);
        whereClause = parts[0].trim();
        orderByClause = parts.slice(1).join(" ").trim();

        if (whereClause) {
          sql += ` AND (${whereClause})`;
        }
      }

      if (orderByClause) {
        // Automatically convert created_at and updated_at to datetime in ORDER BY clause
        orderByClause = orderByClause.replace(
          /\b(created_at|updated_at)\b/gi,
          "datetime($1)"
        );
        sql += ` ${orderByClause}`;
      }

      console.log("Final SQL query:", sql); // For debugging

      const results = await this.runSelectQuery(sql, params);

      // If '*' was selected, parse the JSON data
      if (columns === "*") {
        return results.map((row) => ({
          ...row,
          data: JSON.parse(row.data),
        }));
      } else {
        // For specific columns, only return the requested columns
        const columnArray = columns.split(",").map((col) => col.trim());
        return results.map((row) => {
          const filteredRow = {};
          columnArray.forEach((col) => {
            filteredRow[col] = row[col];
          });
          return filteredRow;
        });
      }
    } catch (error) {
      console.error("Error in select operation:", error);
      throw error;
    }
  }
  runSelectQuery(sql, params) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
  runModifyQuery(sql, params) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }
  async insert(userId, tableName, columns, values) {
    try {
      const columnArray = columns.split(",").map((col) => col.trim());
      const valueArray = values.split(",").map((val) => val.trim());

      if (columnArray.length !== valueArray.length) {
        throw new Error("Number of columns does not match number of values");
      }

      const data = {};
      for (let i = 0; i < columnArray.length; i++) {
        if (
          valueArray[i] !== "true" &&
          valueArray[i] !== "false" &&
          valueArray[i] !== "null" &&
          isNaN(valueArray[i])
        ) {
          data[columnArray[i]] = valueArray[i];
        } else {
          data[columnArray[i]] = JSON.parse(valueArray[i]);
        }
      }

      const sql = `INSERT INTO user_data (id, user_id, table_name, data) VALUES (?, ?, ?, ?)`;
      const params = [this.generateId(), userId, tableName, JSON.stringify(data)];

      console.log("Insert SQL query:", sql);  // For debugging
      console.log("Insert params:", params);  // For debugging

      const result = await this.runModifyQuery(sql, params);
      return { success: true, affectedRows: result.changes, insertId: params[0] };
    } catch (error) {
      console.error("Error in insert operation:", error);
      throw error;
    }
  }
  async update(userId, tableName, columns, values, condition) {
    try {
      const columnArray = columns.split(",").map((col) => col.trim());
      const valueArray = values.split(",").map((val) => val.trim());

      if (columnArray.length !== valueArray.length) {
        throw new Error("Number of columns does not match number of values");
      }

      const updateData = {};
      for (let i = 0; i < columnArray.length; i++) {
        if (
          valueArray[i] !== "true" &&
          valueArray[i] !== "false" &&
          valueArray[i] !== "null" &&
          isNaN(valueArray[i])
        ) {
          updateData[columnArray[i]] = valueArray[i];
        } else {
          updateData[columnArray[i]] = JSON.parse(valueArray[i]);
        }
      }

      let sql = `UPDATE user_data SET data = json_patch(data, ?), updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND table_name = ?`;
      let params = [JSON.stringify(updateData), userId, tableName];

      if (condition) {
        // Use parameterized query for the id condition
        const [conditionColumn, conditionValue] = condition.split('=').map(part => part.trim());
        sql += ` AND ${conditionColumn} = ?`;
        params.push(conditionValue);
      }

      console.log("Update SQL query:", sql);  // For debugging
      console.log("Update params:", params);  // For debugging

      const result = await this.runModifyQuery(sql, params);
      return { affectedRows: result.changes };
    } catch (error) {
      console.error("Error in update operation:", error);
      throw error;
    }
  }
  async delete(userId, tableName, condition, values) {
    try {
      let sql = `DELETE FROM user_data WHERE user_id = ? AND table_name = ?`;
      let params = [userId, tableName];

      if (condition) {
        // Use the id column directly, not json_extract
        const adjustedCondition = condition.replace(/\bid\s*=\s*\?/, "id = ?");
        sql += ` AND (${adjustedCondition})`;
        
        if (values) {
          params.push(values);
        }
      }

      console.log("Delete SQL query:", sql);  // For debugging
      console.log("Delete params:", params);  // For debugging

      const result = await this.runModifyQuery(sql, params);
      return { affectedRows: result.changes };
    } catch (error) {
      console.error("Error in delete operation:", error);
      throw error;
    }
  }
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default new DatabaseOperation();
