import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process'

const currentDirectory =  dirname(fileURLToPath(import.meta.url));
const playgroundPath = join(currentDirectory, '..', 'web');
console.log('rodado!!!!!', playgroundPath);
const command = spawn(`cd ${playgroundPath} && npm install --production`, { shell: true, stdio: 'inherit' })
console.log('rodado!!!!!', playgroundPath);