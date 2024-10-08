import * as path from 'path';
import * as fs from 'fs';

const getAuthPath = (userId: string) => path.resolve(__dirname, '..', '..', 'auth_info', userId);
export async function clearAuthState(userId: string) {
  const authPath = getAuthPath(userId);
  if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
  }
  return authPath;
}