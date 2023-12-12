import path from 'path'
import fs from 'fs'
import ServerError from './serverError';

let entrypointsPath: string
if (fs.existsSync(path.join(process.cwd(), 'src', 'entrypoints'))) entrypointsPath = path.join(process.cwd(), 'src', 'entrypoints')
else if (fs.existsSync(path.join(process.cwd(), 'entrypoints'))) entrypointsPath = path.join(process.cwd(), 'entrypoints')
else {
  throw new ServerError(`Could not find your entrypoints folder.\nTried: ${path.join(process.cwd(), 'src', 'entrypoints')} and ${path.join(process.cwd(), 'entrypoints')}`, 9916)
}

const paths: Record<string, boolean> = {}

interface IDirNode {
  name: string
  ext: null;
  isFile: false
  isDirectory: true
  serverpath: string
  systempath: string
  children: IDirNode[]
}

interface IFileNode {
  name: string
  ext: string;
  isFile: true
  isDirectory: false
  serverpath: string
  systempath: string
}

type INode = IDirNode | IFileNode

const VALID_EXTENSIONS = ['ts', 'js']

function getNodes(systempath: string, serverpath: string): INode[] {
  let files = fs.readdirSync(systempath, { withFileTypes: true })

  let nodes: INode[] = []
  for (const file of files) {
    if (!file.isFile() && !file.isDirectory()) continue

    let name = file.name
    let ext = null
    if (file.isFile()) {
      const extension = path.extname(name)
      name = name.replace(extension, '')
      ext = extension.replace('.', '')

      if (VALID_EXTENSIONS.includes(ext) === false) {
        continue
      }
    }

    const node = {
      name,
      ext,
      isFile: file.isFile(),
      isDirectory: file.isDirectory(),
      serverpath: `${serverpath}/${name}`,
      systempath: path.join(systempath, file.name),
    } as INode

    nodes.push(node)
  }

  return nodes
}

interface IEntrypoint {
  prettyName: string;
  method: string
  serverPath: string;
  handler: Function;
}

export { IEntrypoint }

async function getEntrypoints(): Promise<IEntrypoint[]> {
  const entrypoints: IEntrypoint[] = []
  
  let nodes = getNodes(entrypointsPath, '')

  let node
  // dfs
  while (nodes.length >= 1) {
    node = nodes.pop()
    if (!node) break

    assertName(node.name)

    // handler [param] files/folders
    if (node.name[0] === '[') {
      const closingBracketIndex = node.name.indexOf(']')
      const insideBrackets = node.name.slice(1, closingBracketIndex)
      node.serverpath = node.serverpath.replace(`[${insideBrackets}]`, `:${insideBrackets}`)
    }

    if (node.isDirectory) {
      let subnodes = getNodes(node.systempath, node.serverpath)
      nodes.push(...subnodes)
      continue
    }

    // handle index files
    if (node.name === 'index') {
      node.serverpath = node.serverpath.replace('/index', '')
      
      if (node.serverpath === '') {
        node.serverpath = '/'
      }
    }


    // check for duplicate entrypoint path
    if (paths[node.serverpath]) {
      throw new ServerError(`Duplicate entrypoint name ${node.serverpath} — you cannot have two entrypoints with the same path.`, 1, {
        node,
        paths,
        entrypoints
      })
    }

    paths[node.serverpath] = true

    const entrypointCode = await import(node.systempath)
    const handler = entrypointCode.default
    const methods = []
    if (typeof handler === 'function') methods.push({name: 'POST', fn: handler})
    if (typeof entrypointCode.GET === 'function') methods.push({name: 'GET', fn: entrypointCode.GET})
    if (typeof entrypointCode.POST === 'function' && typeof handler !== 'function') methods.push({name: 'POST', fn: entrypointCode.POST})
    if (typeof entrypointCode.PUT === 'function') methods.push({name: 'PUT', fn: entrypointCode.PUT})
    if (typeof entrypointCode.DELETE === 'function') methods.push({name: 'DELETE', fn: entrypointCode.DELETE})

    if (methods.length === 0) {
      throw new ServerError(`Entrypoint ${node.serverpath} does not export an entrypoint function.`, 2, {
        node,
        entrypoints
      })
    }
    const prettyName = node.name.replace('-', ' ')
    for (const method of methods) {
      let entrypoint: IEntrypoint = {
        handler: method.fn,
        method: method.name,
        prettyName,
        serverPath: node.serverpath,
      }
  
      entrypoints.push(entrypoint)
    }
  }

  return entrypoints
}

// a name is only valid if it has letters and dashes
// everything else is invalid
function assertName(name: string): boolean {
  if (name[0] === '[') {
    const closingBracketIndex = name.indexOf(']')
    
    if (closingBracketIndex === -1 || closingBracketIndex !== name.length - 1) {
      throw new ServerError(`Invalid entrypoint name for ${name}.\nEntrypoint names that start with '[' must end with ']'`, 3, { name })
    }

    const insideBrackets = name.slice(1, closingBracketIndex)
    return /^[a-z-]+$/.test(insideBrackets)
  }

  if (name[0] === '-') {
    throw new ServerError(`Invalid entrypoint name for ${name}.\nEntrypoint names cannot start with '-'`, 4, { name })
  }

  if (/^[a-z-]+$/.test(name) === false) {
    throw new ServerError(`Invalid entrypoint name for ${name}.\nEntrypoint names can only contain lowercase letters and dashes — or be wrapped in square brackets.`, 5, { name })
  }

  return true
}

export { getEntrypoints }