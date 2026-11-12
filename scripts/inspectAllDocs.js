import fs from 'fs';
import path from 'path';
import os from 'os';

async function inspectFirestore() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;
  const projectId = 'mibolsillo-app-ec';

  // List all documents in user_finances
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/user_finances`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await res.json();
  console.log('user_finances documents:');
  if (data.documents) {
    for (const doc of data.documents) {
      console.log('Doc name:', doc.name);
      console.log('Accounts in doc:', JSON.stringify(doc.fields?.accounts, null, 2));
      console.log('Updated at:', doc.fields?.updatedAt);
    }
  } else {
    console.log('No documents or data:', data);
  }

  // Also check users collection
  const urlUsers = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users`;
  const resUsers = await fetch(urlUsers, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('users docs:', await resUsers.json());
}

inspectFirestore();
