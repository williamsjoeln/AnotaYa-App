import fs from 'fs';
import path from 'path';
import os from 'os';

async function getUsers() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;

  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/mibolsillo-app-ec/accounts:batchGet`;
  // or query users
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/mibolsillo-app-ec/accounts:query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      returnUserInfo: true,
      expression: []
    })
  });
  console.log('Query result:', await res.json());
}

getUsers();
