// loader.mjs
import * as esmLoader from '@swc-node/register/esm';
import fs from 'fs';
import { URL, fileURLToPath } from 'url';
import path from 'path';
import transformAction from '../ast-transforms/actions/actions.js';
import agentTransform from '../ast-transforms/agents/agent-transform.js';
import ReasonError from '../utils/reasonError.js';
import ActionError from '../ast-transforms/actions/actionError.js';
import AgentError from '../ast-transforms/agents/agentError.js';
import isPathFromReason from '../ast-transforms/isPathFromReason.js';
import thinkTransform from '../ast-transforms/think/think-transform.js';
import ThinkError from '../ast-transforms/think/thinkError.js';

function isWindows() {
    return process.platform === 'win32'
}

const semver = process.version;
const [major, minor, patch] = semver.slice(1).split('.').map(Number);

if (major < 18) {
  console.error('RΞASON requires Node.js v18 or higher.');
  process.exit(1);
}

const TS_LOADER_DEFAULT_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts'];
export async function load(url, context, defaultLoad) {
    if (context.format === 'builtin') {
        return defaultLoad(url, context, defaultLoad);
    }
    let newUrl = url;
    if (newUrl.endsWith('.mjs') && TS_LOADER_DEFAULT_EXTENSIONS.some((ext) => newUrl.indexOf(ext) >= 0)) {
        newUrl = newUrl.replace('.mjs', '');
    }
    const filePath = fileURLToPath(new URL(newUrl));
    const code = await fs.promises.readFile(filePath, 'utf-8');
    if (!newUrl.includes('ast-transforms') && !newUrl.includes('node_modules') && newUrl.includes('/actions/')) {
        try {
            const newCode = await transformAction(code, filePath);
            return {
                format: context.format,
                source: newCode,
                shortCircuit: true,
            };
        }
        catch (err) {
            if (err instanceof ReasonError) {
                throw new ActionError(`The following error happened while trying to process the action ${path.basename(filePath)}: ${err.message}`, err.code, {
                    filePath,
                    code,
                    stack: err.stack,
                });
            }
            throw new ActionError(`An unknown error has happened while trying to process the action ${path.basename(filePath)}, please get in contact.`, 12, {
                filePath,
                code,
                stack: err.stack,
            });
        }
    }
    else if (!newUrl.includes('ast-transforms') && !newUrl.includes('node_modules') && newUrl.includes('/agents/')) {
        try {
            const newCode = await agentTransform(code, filePath);
            return {
                format: context.format,
                source: newCode,
                shortCircuit: true,
            };
        }
        catch (err) {
            if (err instanceof ReasonError) {
                throw new AgentError(`The following error happened while trying to process the agent ${path.basename(filePath)}: ${err.message}`, err.code, {
                    filePath,
                    code,
                    stack: err.stack,
                });
            }
            throw new AgentError(`An unknown error has happened while trying to process the agent ${path.basename(filePath)}, please get in contact.`, 12, {
                filePath,
                code,
                stack: err.stack,
            });
        }
    }
    else {
        if (isPathFromReason(code) && code.includes('reason')) {
            // can potentially use `think`
            try {
                const newCode = await thinkTransform(code, filePath);
                return {
                    format: context.format,
                    source: newCode,
                    shortCircuit: true,
                };
            }
            catch (err) {
                console.log(err)
                if (err instanceof ReasonError) {
                    throw new ThinkError(`The following error happened while trying to process the \`reason\` call in ${path.basename(filePath)}: ${err.message}`, err.code, {
                        filePath,
                        code,
                        stack: err.stack,
                    });
                }
                throw new ThinkError(`An unknown error has happened while trying to process the \`reason\` call in ${path.basename(filePath)}, please get in contact.`, 12, {
                    filePath,
                    code,
                    err,
                    stack: err.stack,
                });
            }
        }
    }
    return esmLoader.load(url, context, defaultLoad);
}
export async function resolve(specifier, context, nextResolve) {
    // if (specifier.toLowerCase().startsWith('c:\\')) {
    //     specifier = 'file:///' + specifier.replaceAll('\\', '/')
    // }

    if (isWindows() && specifier.lastIndexOf('file:/') > 1) {
        // const idx = specifier.lastIndexOf('file:/')
        // specifier = specifier.slice(0, idx) + specifier.slice(idx + 'file:/'.length)
        specifier = 'file:///' + specifier.split('file:/')[2]
    }

    if (context.parentURL?.indexOf('node_modules/tryreason') !== -1 && path.extname(specifier) === '' && specifier[0] === '.') {
        specifier = specifier + '.js';
    }
    return esmLoader.resolve(specifier, context, nextResolve);
}
