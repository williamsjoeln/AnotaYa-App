import fs from 'fs';
import path from 'path';
import os from 'os';

async function checkFirestoreData() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;
  const uid = 'JDDn0cgz3TYVYbjRDegi7Mno6hB2';
  const projectId = 'mibolsillo-app-ec';

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/user_finances/${uid}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await res.json();
  console.log('Firestore doc status:', res.status);
  console.log('Firestore doc data:', JSON.stringify(data, null, 2));
}

checkFirestoreData();
