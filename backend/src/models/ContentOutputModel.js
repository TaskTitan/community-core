import db from '../database/index.js';

class ContentOutputModel {
  static createOrUpdate(id, userId, workflowId, toolId, content, isShareable) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO content_outputs (id, user_id, workflow_id, tool_id, content, is_shareable, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [id, userId, workflowId || null, toolId || null, content, isShareable ? 1 : 0],
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
        "SELECT * FROM content_outputs WHERE id = ?",
        [id],
        (err, output) => {
          if (err) reject(err);
          else resolve(output);
        }
      );
    });
  }
  static findAllByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM content_outputs WHERE user_id = ? ORDER BY updated_at DESC",
        [userId],
        (err, outputs) => {
          if (err) reject(err);
          else resolve(outputs);
        }
      );
    });
  }
  static delete(id, userId) {
    return new Promise((resolve, reject) => {
      db.run(
        "DELETE FROM content_outputs WHERE id = ? AND user_id = ?",
        [id, userId],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }
  static findByWorkflowId(workflowId, userId) {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM content_outputs WHERE workflow_id = ? AND user_id = ? ORDER BY updated_at DESC",
        [workflowId, userId],
        (err, outputs) => {
          if (err) reject(err);
          else resolve(outputs);
        }
      );
    });
  }
  static findByToolId(toolId, userId) {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM content_outputs WHERE tool_id = ? AND user_id = ? ORDER BY updated_at DESC",
        [toolId, userId],
        (err, outputs) => {
          if (err) reject(err);
          else resolve(outputs);
        }
      );
    });
  }
}

export default ContentOutputModel;