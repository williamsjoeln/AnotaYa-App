import fs from 'fs';
import path from 'path';
import os from 'os';

async function getClient() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;
  const projectNumber = '797797104296';

  // Try checking with Google Cloud API
  const res = await fetch(`https://iam.googleapis.com/v1/projects/mibolsillo-app-ec/serviceAccounts`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('IAM status:', res.status);
}

getClient();
