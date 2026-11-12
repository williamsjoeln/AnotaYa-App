import fs from 'fs';
import path from 'path';
import os from 'os';

async function testUnauthenticatedRead() {
  const projectId = 'mibolsillo-app-ec';
  const uid = 'JDDn0cgz3TYVYbjRDegi7Mno6hB2';
  
  // Unauthenticated request to firestore
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/user_finances/${uid}`;
  const res = await fetch(url);
  console.log('Unauthenticated read status:', res.status);
  console.log('Response:', await res.json());
}

testUnauthenticatedRead();
