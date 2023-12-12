import getImports, { import2file } from './get-imports.js'
import { default as traverse } from '@babel/traverse'

export default function getTsTypes(ast, typesMap, filePath, isJs) {
  getTypesInFile(ast, typesMap)
  
  const imports = new Map()
  getImports(ast, imports, filePath, isJs)

  return imports
}

function getTypesInFile(ast, map) {
  traverse.default(ast, {
    TSTypeAliasDeclaration(path) {
      map.set(path.node.id.name, path.node)
    },
    TSInterfaceDeclaration(path) {
      map.set(path.node.id.name, path.node)
    },
  })
}