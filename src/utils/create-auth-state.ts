import * as path from 'path';
import * as fs from 'fs';

export async function createAuthState(userId: string = '') {  
  let authPath = userId ? path.resolve(__dirname, '..', '..', 'auth_info', userId) : path.resolve(__dirname, '..', '..', 'auth_info');
  console.log('Local onde está o auth:', authPath);
  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }
  return authPath;
}