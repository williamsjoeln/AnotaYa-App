import fs from 'fs';
import path from 'path';
import os from 'os';

async function run() {
  try {
    const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
    if (!fs.existsSync(configPath)) {
      console.error('firebase-tools.json not found');
      return;
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const token = config.tokens?.access_token;
    if (!token) {
      console.error('No access token in firebase-tools.json');
      return;
    }

    const projectId = 'mibolsillo-app-ec';
    const getUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;

    console.log('Fetching config from Identity Toolkit...');
    const getRes = await fetch(getUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await getRes.json();
    console.log('Current authorized domains:', data.authorizedDomains);

    const domains = new Set(data.authorizedDomains || [
      'localhost',
      `${projectId}.firebaseapp.com`,
      `${projectId}.web.app`
    ]);

    domains.add('mibolsillo-ec.web.app');
    domains.add('mibolsillo-ec.firebaseapp.com');
    domains.add('mibolsillo-app-ec.web.app');
    domains.add('mibolsillo-app-ec.firebaseapp.com');

    const updatedDomains = Array.from(domains);
    console.log('New authorized domains to set:', updatedDomains);

    const patchUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=authorizedDomains`;
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        authorizedDomains: updatedDomains
      })
    });

    const patchData = await patchRes.json();
    console.log('Patch result:', patchData);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
