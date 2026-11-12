import fs from 'fs';
import path from 'path';
import os from 'os';

async function testAuthDomain() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;

  // Let's check Identity Platform authorized domains
  const getUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/mibolsillo-app-ec/config`;
  const res = await fetch(getUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('authorizedDomains:', data.authorizedDomains);
}

testAuthDomain();
