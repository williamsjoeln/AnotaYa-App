import fs from 'fs';
import path from 'path';
import os from 'os';

async function getOAuthClient() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;
  const projectNumber = '797797104296';

  // Try gcp clients api
  const url = `https://iam.googleapis.com/v1/projects/mibolsillo-app-ec`;
  const res = await fetch(`https://cloudresourcemanager.googleapis.com/v1/projects/mibolsillo-app-ec`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Project status:', await res.json());
}

getOAuthClient();
