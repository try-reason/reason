import ts2ast from '../utils/to-ts-ast.js'
import isPathFromReason from '../isPathFromReason.js'
import getTsTypes from '../utils/get-ts-types.js'
import ReasonError from '../../utils/reasonError.js'
import internalname from '../internalname.js';
import { toJsonSchema } from '../utils/to-json-schema.js'
import parseJSDoc from '../utils/jsdoc-parser.js'

function isDefaultSpecifier(specifier) {
  if (specifier.type === 'ImportDefaultSpecifier') return true
  if (specifier.imported.name === 'default') return true
  
  return false
}

// interface ExtractorInfo {
//   name: string;
//   type: string;
//   prompt?: string;
// }

export default function getPromptInfoFromThinkStream(code, filePath, isJs = false) {
  const codetypes = new Map();
  let imports

  let thinkname

  if (!isJs) {
    const ast = ts2ast(code)
    imports = getTsTypes(ast, codetypes, filePath, isJs)
  }

  function extractJsDocPlugin({ types: t }) {
    return {
      visitor: {
        ImportDeclaration(path) {
          for (let specifier of path.node.specifiers) {
            let i = {
              varname: specifier.local.name,
              orginalname: specifier.imported?.name ?? specifier.local.name,
              default: isDefaultSpecifier(specifier),
              node: path.node
            }
            
            if (isPathFromReason(path.node.source.value)) {
              if (i.orginalname === 'reasonStream') {
                specifier.imported.name = internalname + 'reasonStream';
          
                path.scope.rename(internalname + 'reasonStream', i.varname);
                thinkname = i.varname;
              }
            }
          }
        },
        CallExpression(path) {
          if (t.isIdentifier(path.node.callee, { name: thinkname }) && (path.node.arguments.length === 1 || path.node.arguments.length === 2)) {
            // if there is no <T> in the `think()` function, we just ignore & move on
            if (!path.node.typeParameters) return

            if (path.node.typeParameters.params.length !== 1) {
              throw new ReasonError(`The \`reasonStream\` function can only receive one generic.`, 53)
            }

            const param = path.node.typeParameters.params[0]

            let annotation = param

            if (param.type === 'TSTypeReference') {
              // this means that the type is a type alias (to a `type` or an `interface`)
              const name = param.typeName.name
              if (!codetypes.has(name) && !imports.has(name)) {
                throw new ReasonError(`Could not find type \`${name}\` of parameter \`${params[i].name}\`. All parameters need to have a defined type.`, 23);
              }

              if (!codetypes.has(name)) {
                throw new ReasonError(`You are trying to use the interface/type \`${name}\` as the generic for the \`reasonStream()\` call. But, sadly, RΞASON does not support importing types from other files yet. Please define the type in this file.\n\nThis will be coming in our next release.`, 554)
              }

              const type = codetypes.get(name)
              if (type.type !== "TSInterfaceDeclaration" && type.type !== "TSTypeAliasDeclaration") {
                throw new ReasonError(`You are trying to use the interface/type \`${name}\` as the generic for the \`reasonStream()\` call. But, sadly, RΞASON does not support importing types from other files yet. Please define the type in this file.\n\nThis will be coming in our next release.`, 555)
              }

              if (type.extends) {
                throw new ReasonError('We do not support extending types/interfaces as it does not work well with LLMs. Please remove the `extends` keyword from your type/interface.', 525)
              }

              if (type.type === "TSInterfaceDeclaration") {
                annotation = type.body
                annotation.type = 'TSTypeLiteral'
                annotation.members = annotation.body
              }
              else {
                // `type a = 'abc`
                annotation = type.typeAnnotation
              }
            }

            let schemaType = toJsonSchema(annotation)
            let prompts = []

            for (let member of annotation.members) {
              let desc = member.leadingComments?.[0]?.value ?? ''

              if (desc) {
                let jdoc = parseJSDoc(desc)
                desc = jdoc.description
              }

              let p = {
                name: member.key.name,
                type: JSON.stringify(schemaType.properties[member.key.name]),
                prompt: desc ?? null,
                required: schemaType.required.includes(member.key.name)
              }

              prompts.push(p)
            }

            let items = []

            for (let prompt of prompts) {
              items.push(t.objectExpression([
                t.objectProperty(t.identifier('name'), t.stringLiteral(prompt.name)),
                t.objectProperty(t.identifier('type'), t.stringLiteral(prompt.type)),
                t.objectProperty(t.identifier('prompt'), t.stringLiteral(prompt.prompt)),
                t.objectProperty(t.identifier('required'), t.booleanLiteral(prompt.required)),
              ]))
            }

            const arrayOfObjects = t.arrayExpression(items);

            if (path.node.arguments.length === 1) {
              path.node.arguments.push(t.nullLiteral())
            }

            path.node.arguments.push(arrayOfObjects)
          }
        }
      }
    }
  }
  
  return extractJsDocPlugin
}