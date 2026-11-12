import fs from 'fs';
import path from 'path';
import os from 'os';

async function testLogin() {
  const apiKey = "AIzaSyDXu_l-IWLMAKPKEY-AKolUSlybOtoAiuA";
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'williamsnavarrete64@gmail.com',
      password: 'Williams2026*',
      returnSecureToken: true
    })
  });
  const data = await res.json();
  console.log('Login test result:', data.localId === 'JDDn0cgz3TYVYbjRDegi7Mno6hB2' ? 'SUCCESS! Matches Google UID!' : data);
}

testLogin();
