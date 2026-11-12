import fs from 'fs';
import path from 'path';
import os from 'os';

async function updateOAuthClient() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;
  const projectNumber = '797797104296';
  const clientId = '797797104296-tlt21sh24beptk6f5vkh0232hscf26rm.apps.googleusercontent.com';

  // Check if we can access the GCP credentials API
  // https://cloud.google.com/api-keys/docs/reference/rest
  const res = await fetch(`https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Credentials status:', res.status);
}

updateOAuthClient();
