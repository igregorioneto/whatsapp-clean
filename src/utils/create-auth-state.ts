  import * as path from 'path';
  import * as fs from 'fs';

  export async function createAuthState() {
    const authPath = path.resolve(__dirname, '..', '..','auth_info');
    if (!fs.existsSync(authPath)) {
      fs.mkdirSync(authPath, { recursive: true });
    }
    return authPath;
  }