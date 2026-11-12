import fs from 'fs';
import path from 'path';
import os from 'os';

async function enablePasswordAuth() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;
  const projectId = 'mibolsillo-app-ec';

  // Check current config
  const getUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;
  const getRes = await fetch(getUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await getRes.json();
  console.log('Current signIn config:', data.signIn);

  // Enable Email/Password in Identity Toolkit
  const patchUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=signIn.email`;
  const patchRes = await fetch(patchUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      signIn: {
        email: {
          enabled: true,
          passwordRequired: true
        }
      }
    })
  });
  console.log('Patch result:', await patchRes.json());
}

enablePasswordAuth();
