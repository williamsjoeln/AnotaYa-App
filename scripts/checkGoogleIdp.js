import fs from 'fs';
import path from 'path';
import os from 'os';

async function checkRedirectUris() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;
  const projectNumber = '797797104296';

  // Check Identity Toolkit IDP config for google.com
  const idpUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/mibolsillo-app-ec/defaultSupportedIdpConfigs/google.com`;
  const res = await fetch(idpUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('google.com IDP config:', data);
}

checkRedirectUris();
