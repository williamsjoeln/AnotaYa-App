import fs from 'fs';
import path from 'path';
import os from 'os';

async function checkOAuthClient() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;
  const projectId = 'mibolsillo-app-ec';

  // Check OAuth client in Google Cloud Console
  // Client ID: 797797104296-tlt21sh24beptk6f5vkh0232hscf26rm.apps.googleusercontent.com
  const clientId = '797797104296-tlt21sh24beptk6f5vkh0232hscf26rm';
  
  // Try fetching oauth client details via Cloud Resource Manager or credentials API
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=...`;
  console.log('Testing access token validity...');
  const res = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
  console.log('Token info scopes:', await res.json());
}

checkOAuthClient();
