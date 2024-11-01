import db from '../database/index.js';

class UserModel {
  static getUserStats(userId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          (SELECT COUNT(*) FROM workflows WHERE user_id = ?) as totalWorkflows,
          (SELECT COUNT(*) FROM custom_tools WHERE created_by = ?) as totalCustomTools
        `,
        [userId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }
}

export default UserModel;
