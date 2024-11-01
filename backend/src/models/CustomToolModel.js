import db from '../database/index.js';

class CustomToolModel {
  static createOrUpdate(id, tool, userId) {
    return new Promise((resolve, reject) => {
      const { title, category, type, icon, description, parameters, outputs, isShareable } = tool;
      db.run(
        `INSERT OR REPLACE INTO custom_tools (id, title, category, type, icon, description, parameters, outputs, created_by, is_shareable, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [id, title, category, type, icon, description, JSON.stringify(parameters), JSON.stringify(outputs), userId, isShareable ? 1 : 0],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes, lastID: this.lastID });
        }
      );
    });
  }
  static findOne(id) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM custom_tools WHERE id = ?",
        [id],
        (err, tool) => {
          if (err) reject(err);
          else if (tool) resolve({
            ...tool,
            parameters: JSON.parse(tool.parameters),
            outputs: JSON.parse(tool.outputs),
            is_shareable: Boolean(tool.is_shareable)
          });
          else resolve(null);
        }
      );
    });
  }
  static findAllByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM custom_tools WHERE created_by = ? ORDER BY updated_at DESC",
        [userId],
        (err, tools) => {
          if (err) reject(err);
          else resolve(tools.map(tool => ({
            ...tool,
            parameters: JSON.parse(tool.parameters),
            outputs: JSON.parse(tool.outputs),
            is_shareable: Boolean(tool.is_shareable)
          })));
        }
      );
    });
  }
  static delete(id, userId) {
    return new Promise((resolve, reject) => {
      db.run(
        "DELETE FROM custom_tools WHERE id = ? AND created_by = ?",
        [id, userId],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }
}

export default CustomToolModel;