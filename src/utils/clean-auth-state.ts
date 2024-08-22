import * as path from 'path';
import * as fs from 'fs';

export async function clearAuthState() {
  const authPath = path.resolve(__dirname, '..', '..', 'auth_info');
  console.log('local onde esta o auth', authPath)
  if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
  }
  return authPath;
}