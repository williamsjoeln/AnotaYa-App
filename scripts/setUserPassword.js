import fs from 'fs';
import path from 'path';
import os from 'os';

async function setPassword() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;
  const uid = 'JDDn0cgz3TYVYbjRDegi7Mno6hB2';
  const newPassword = 'Williams2026*';

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/mibolsillo-app-ec/accounts:update`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      localId: uid,
      password: newPassword,
      returnSecureToken: false
    })
  });

  const data = await res.json();
  console.log('Update result:', data);
}

setPassword();
