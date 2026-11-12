import fs from 'fs';
import path from 'path';
import os from 'os';

async function run() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;
  const projectId = 'mibolsillo-app-ec';

  // Check IDPs
  const idpUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/defaultSupportedIdpConfigs`;
  const res = await fetch(idpUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('IDP configs:', JSON.stringify(data, null, 2));

  // Check Inbound SAML / OAuth / Identity providers
  const oauthUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/oauthIdpConfigs`;
  const res2 = await fetch(oauthUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('OAuth IDP configs:', await res2.json());
}

run();
