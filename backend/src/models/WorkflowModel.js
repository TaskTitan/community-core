import db from '../database/index.js';

class WorkflowModel {
  static createOrUpdate(id, workflowData, userId, isShareable) {
    return new Promise((resolve, reject) => {
      db.run('INSERT OR REPLACE INTO workflows (id, workflow_data, user_id, is_shareable, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)', 
        [id, workflowData, userId, isShareable ? 1 : 0], 
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }
  static update(id, workflowData, userId) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE workflows SET workflow_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', 
        [workflowData, id, userId], 
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }
  static delete(id, userId) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM workflows WHERE id = ? AND user_id = ?', [id, userId], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }
  static create(id, workflowData, userId) {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO workflows (id, workflow_data, user_id) VALUES (?, ?, ?)', 
        [id, workflowData, userId], 
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }
  static findAllByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM workflows WHERE user_id = ?', [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
  static findOne(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM workflows WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
  static updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE workflows SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) {
          console.error(`Error updating workflow status: ${err.message}`);
          reject(err);
        } else {
          console.log(`Workflow ${id} status updated to ${status}`);
          resolve(this.changes);
        }
      });
    });
  }
  static findByStatus(statuses) {
    return new Promise((resolve, reject) => {
      const placeholders = statuses.map(() => '?').join(',');
      db.all(
        `SELECT * FROM workflows WHERE status IN (${placeholders})`,
        statuses,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

export default WorkflowModel;