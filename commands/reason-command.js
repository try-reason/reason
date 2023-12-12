#!/usr/bin/env node
import {spawn} from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join, resolve, sep } from 'path';
import open from 'open'
import fs from 'fs'
import c from 'ansi-colors'

const semver = process.version;
const [major, minor, patch] = semver.slice(1).split('.').map(Number);

if (major < 18) {
  console.error('RΞASON requires Node.js v18 or higher.');
  process.exit(1);
}

const currentDirectory =  dirname(fileURLToPath(import.meta.url));
const distPath = join(currentDirectory, '..', 'dist');
const webPath = join(currentDirectory, '..', 'web');

let loaderPath = join(distPath, 'compiler', 'ts-dev-mode-loader.js')
if (isWindows()) {
  loaderPath = 'file:///' + loaderPath
}

let serverPath = join(distPath, 'server', 'index.js')
if (isWindows()) {
  serverPath = 'file:///' + serverPath
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Please provide a command.');
  process.exit(1);
}
let command;
let webCommand


function isWindows() {
  return process.platform === 'win32'
}

function exportEnv(key, value) {
  return isWindows() ? `set ${key}=${value}` : `export ${key}="${value}"`
}

let port = 1704
let webPort = 1710
let shouldRunWeb = true
function setup() {
  if (args.findIndex(arg => arg === '--no-playground') !== -1) {
    shouldRunWeb = false
  }

  if (args.findIndex(arg => arg === '--playground-port') !== -1) {
    try {
      webPort = parseInt(args[args.findIndex(arg => arg === '--playground-port') + 1])
    } catch {
      console.error('Invalid port number for the Web Playground:', args[args.findIndex(arg => arg === '--playground-port') + 1])
      console.error('Will be using default port:', webPort)
    }
  }

  if (args.findIndex(arg => arg === '--port') !== -1) {
    try {
      port = parseInt(args[args.findIndex(arg => arg === '--port') + 1])
    } catch {
      console.error('Invalid port number:', args[args.findIndex(arg => arg === '--port') + 1])
      console.error('Will be using default port:', port)
    }
  }
}

function getStartupFile() {
  if (fs.existsSync('custom-setup.js')) return 'custom-setup.js'
  if (fs.existsSync('custom-setup.ts')) return 'custom-setup.ts'
  return null
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

setup()

let isWebReady = false
let isServerReady = false
function openWeb() {
  if (isWebReady && isServerReady) {
    open(`http://localhost:${webPort}`)
  }
}

switch (args[0]) {
  case 'dev':
    command = spawn(`${exportEnv('REASON_ENV', "dev")} && nodemon --quiet -e js,ts --ignore node_modules --watch . --no-warnings --loader ${loaderPath} ${serverPath} --port ${port}`, { shell: true, stdio: 'pipe' });
    command.stdout.on('data', async (data) => {
      process.stdout.write(data);
      if (data.includes(' Server is ready at port ')) {
        isServerReady = true
        openWeb()
      }
    })

    command.stderr.on('data', (data) => {
      process.stderr.write(data);
    })
    
    let startupFile = getStartupFile()
    if (startupFile) {
      const startup = spawn(`${exportEnv('REASON_ENV', "dev")} && nodemon -e js,ts --ignore node_modules --watch . --no-warnings --loader ${loaderPath} ${startupFile}`, { shell: true, stdio: 'inherit' });
      startup.on('spawn', () => {
        console.log(`RΞASON — Running ${startupFile}...`)
      })
      startup.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
      });
    }
    
    if (!shouldRunWeb) break;

    webCommand = spawn(`cd ${webPath} && npx next start -p ${webPort}`, { shell: true, stdio: 'pipe' })
    webCommand.stderr.on('data', (data) => {
      data = data.toString()
      if (data.includes('ExperimentalWarning')) return
      console.log('[!] An error has happened in RΞASON Playground.\nError:', data);
    })

    webCommand.stdout.on('data', async (data) => {
      data = data.toString()
      if (data.includes('✓ Ready')) {
        isWebReady = true
        console.log(`${c.gray.bold('RΞASON Playground')} — Started at http://localhost:${webPort}`)
        openWeb()
      }
    })
    break;

  case 'dev:debug':
    command = spawn(`${exportEnv('REASON_INTERNAL_DEBUG', 'true')} && ${exportEnv('REASON_ENV', "dev")} && nodemon -e js,ts --ignore node_modules --watch . --no-warnings --loader ${loaderPath} ${serverPath} --port ${port}`, { shell: true, stdio: 'inherit' });

    let startupFie = getStartupFile()
    if (startupFie) {
      const startup = spawn(`${exportEnv('REASON_INTERNAL_DEBUG', 'true')} && ${exportEnv('REASON_ENV', "dev")} && nodemon -e js,ts --ignore node_modules --watch src --no-warnings --loader ${loaderPath} ${startupFie}`, { shell: true, stdio: 'inherit' });
      startup.on('spawn', () => {
        console.log(`RΞASON — Running ${startupFie}...`)
      })
      startup.on('close', (code) => {
        console.log(`RΞASON — \`${startupFie}\` process exited with code ${code}`);
      });
    }

    if (!shouldRunWeb) break;

    webCommand = spawn(`cd ${webPath} && npx next start -p ${webPort}`, { shell: true, stdio: 'pipe' })
    webCommand.stdout.on('data', async (data) => {
      process.stdout.write(data);
      if (data.includes('✓ Ready')) {
        await sleep(3_000)
        console.log(`RΞASON Playground — Started at http://localhost:${webPort}`)
      }
    })

    webCommand.stderr.on('data', (data) => {
      data = data.toString()
      console.log('[!] An error has happened in RΞASON Playground.\nError:', data);
    })
    break;

  default:
    console.error('Unknown command:', args[0]);
    process.exit(1);
}
