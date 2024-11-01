import db from '../index.js';
import fs from 'fs/promises';

async function dumpWorkflows() {
  return new Promise((resolve, reject) => {
    db.all('SELECT workflow_data FROM workflows', async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      const output = rows.map(row => row.workflow_data).join('\n');

      try {
        await fs.writeFile('workflows_dump.txt', output);
        console.log('Workflows dumped to workflows_dump.txt');
        resolve();
      } catch (writeErr) {
        reject(writeErr);
      }
    });
  });
}

dumpWorkflows().catch(console.error);