import { default as traverse } from '@babel/traverse'
import { default as nodepath } from 'path'
import fs from 'fs'

/*
{
  localfilename: nodepath.basename(filePath),
  localname: specifier.local.name,
  originalnme: specifier.imported.name,
  path: ipath,
  filepath: filePath,
  fullpath: nodepath.join(filePath, back, ipath),
  default: isDefaultSpecifier(specifier),
}
*/

function isDefaultSpecifier(specifier) {
  if (specifier.type === 'ImportDefaultSpecifier') return true
  if (specifier.imported.name === 'default') return true
  
  return false
}

export default function getImports(ast, imports, filePath, isJs) {
  traverse.default(ast, {
    ImportDeclaration(path) {
      let ipath = path.node.source.value;

      let back = ''
      if (ipath.startsWith('../')) {
        back = '..'
      }

      for (let specifier of path.node.specifiers) {
        let i = {
          localfilename: nodepath.basename(filePath),
          localname: specifier.local.name,
          originalnme: specifier.imported?.name ?? specifier.local.name,
          path: ipath,
          filepath: filePath,
          fullpath: nodepath.join(filePath, back, ipath),
          default: isDefaultSpecifier(specifier),
        }

        imports.set(i.localname, i)
      }

      let i = {
        name: '',
        path: '',
        default: false,
      }
    }
  })
}

export function import2file(i) {
  let ext = nodepath.extname(i.fullpath)

  if (Boolean(ext) === false) {
    ext = nodepath.extname(i.localfilename)
  }

  if (!fs.existsSync(i.fullpath + ext)) {
    throw new Error(`File not found: ${i.fullpath + ext}`)
  }

  return fs.readFileSync(i.fullpath + ext, 'utf8')
}