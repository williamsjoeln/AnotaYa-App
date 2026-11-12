import fs from 'fs';
import path from 'path';
import os from 'os';

async function tryUpdateRedirectUri() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;
  const projectNumber = '797797104296';
  const clientId = '797797104296-tlt21sh24beptk6f5vkh0232hscf26rm.apps.googleusercontent.com';

  console.log('Testing GCP OAuth Client API...');
  // Identity Toolkit defaultSupportedIdpConfigs patch
  const patchIdpUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/mibolsillo-app-ec/defaultSupportedIdpConfigs/google.com?updateMask=clientId,clientSecret`;
  // Let's see if authorizedDomains is what Identity Toolkit uses
  const configUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/mibolsillo-app-ec/config`;
  const res = await fetch(configUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('Authorized domains:', data.authorizedDomains);
}

tryUpdateRedirectUri();
