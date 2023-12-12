import ReasonError from '../../utils/reasonError.js'
import getTsTypes from '../utils/get-ts-types.js';
import getImports from '../utils/get-imports.js';
import jsdocParser from "../utils/jsdoc-parser.js";
import ts2ast from '../utils/to-ts-ast.js';
import { jdoc2jsonSchema, toJsonSchema } from '../utils/to-json-schema.js'

export default function getPromptInfoFromAction(code, filePath, isJs = false) {
  const functions = new Map();
  const codetypes = new Map();
  let imports

  if (!isJs) {
    const ast = ts2ast(code)
    imports = getTsTypes(ast, codetypes, filePath, isJs)
  }

  // get types in file & imports
  // if type is not in file, check imports
  // if is not in imports, throw error

  function extractJsDocPlugin({ types: t }) {
    return {
      visitor: {
        ExportDefaultDeclaration(path) {
          let functionDeclaration;
    
          if (t.isIdentifier(path.node.declaration)) {
            const binding = path.scope.getBinding(path.node.declaration.name);
            if (!binding || !t.isFunctionDeclaration(binding.path.node)) throw new ReasonError('Inside an action file, the default export must be a function declaration.', 9);
            functionDeclaration = binding.path.node;
          } else if (t.isFunctionDeclaration(path.node.declaration)) {
            functionDeclaration = path.node.declaration;
          } else {
            throw new ReasonError('Inside an action file, the default export must be a function declaration.', 10)
          }

          // Find JSDoc comment directly above the function
          const leadingComments = functionDeclaration.leadingComments ?? path.node.leadingComments;
          if (!leadingComments || leadingComments.length === 0) return;
    
          const jsDocComment = leadingComments[leadingComments.length - 1];
          if (jsDocComment.type !== 'CommentBlock' || !jsDocComment.value.trim().startsWith('*')) return
    
          // Parse JSDoc into parts
          const jsdoc = jsdocParser(jsDocComment.value);
  
          let params = functions.get(functionDeclaration.id.name);

          if (!params) params = functionDeclaration.params

          let REASON_PROMPT_INFO = {
            type: 'action',
            name: functionDeclaration.id.name,
            prompt: jsdoc.description,
            parameters: []
          }
    
          // Extract parameters info
          for (let i = 0; i < jsdoc.parameters.length; i++) {
            let p = {
              name: jsdoc.parameters[i].name,
              type: '',
              prompt: jsdoc.parameters[i].description,
              required: jsdoc.parameters[i].required
            }

            if (jsdoc.parameters[i].name !== params[i].name) {
              throw new ReasonError(`Parameter name mismatch: ${jsdoc.parameters[i].name} !== ${params[i].name}\nThe function parameter name is different than the one in JSDoc. Always remember to use the name order of parameters in JSDoc and in your function definition.`, 11);
            }

            // TODO: test in js
            if (isJs) {
              // javascript (should use types from jsdoc types)
              if (!jsdoc.parameters[i].type) {
                throw new ReasonError(`Missing type for parameter ${jsdoc.parameters[i].name}. All parameters need to have a defined type.`, 20);
              }

              p.type = JSON.stringify(jdoc2jsonSchema(jsdoc.parameters[i].type))
            }
            
            else {
              // TYPESCRIPT (should use types from file itself)
              if (!params[i].typeAnnotation) {
                // this should never happen though
                throw new ReasonError(`Inside a Typescript file you have to for parameter ${params[i].name}. All parameters need to have a defined type.`, 21);
              }

              let annotation = params[i].typeAnnotation.typeAnnotation

              if (params[i].typeAnnotation.typeAnnotation.type === 'TSTypeReference') {
                // this means that the type is a type alias (to a `type` or an `interface`)
                const name = params[i].typeAnnotation.typeAnnotation.typeName.name
                if (!codetypes.has(name) && !imports.has(name)) {
                  throw new ReasonError(`Could not find type \`${name}\` of parameter \`${params[i].name}\`. All parameters need to have a defined type.`, 23);
                }

                if (!codetypes.has(name)) {
                  throw new ReasonError('Sadly, we do not support importing types from other files yet. Please define the type in this file.\n\nThis will be coming in our next release.', 24)
                }

                const type = codetypes.get(name)
                if (type.type !== "TSInterfaceDeclaration" && type.type !== "TSTypeAliasDeclaration") {
                  throw new ReasonError(`Sadly, we do not support importing types from other files yet. Please define the type in this file. (type was ${type.type})\n\nThis will be coming in our next release.`, 111)
                }

                if (type.extends) {
                  throw new ReasonError('We do not support extending types/interfaces as it does not work well with LLMs. Please remove the `extends` keyword from your type/interface.', 25)
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

              p.type = JSON.stringify(toJsonSchema(annotation))
            }

            let order
            for (let j = 0; j < functionDeclaration.params.length; j++) {
              if (functionDeclaration.params[j].name === p.name) {
                order = j
                break
              }
            }
            if (order === undefined) {
              throw new ReasonError(`Could not find parameter ${jsdoc.parameters[i].name} in function declaration of action \`${filePath}\`.`, 12);
            }
            p.order = order
  
    
            REASON_PROMPT_INFO.parameters.push(p)
          }
          // Construct the REASON__INTERNAL__INFO structure
          const info = t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier('REASON__INTERNAL__INFO'),
              t.objectExpression([
                t.objectProperty(t.identifier('type'), t.stringLiteral(REASON_PROMPT_INFO.type)),
                // t.objectProperty(t.identifier('handler'), t.identifier(REASON_PROMPT_INFO.name)),
                // t.objectProperty(t.identifier('config'), t.identifier(REASON_PROMPT_INFO.name)),
                // t.objectProperty(t.identifier('streamable'), t.identifier(REASON_PROMPT_INFO.name)),
                t.objectProperty(t.identifier('filepath'), t.stringLiteral(filePath)),
                t.objectProperty(t.identifier('name'), t.stringLiteral(REASON_PROMPT_INFO.name)),
                t.objectProperty(t.identifier('prompt'), t.stringLiteral(REASON_PROMPT_INFO.prompt)),
                t.objectProperty(t.identifier('parameters'), t.arrayExpression(REASON_PROMPT_INFO.parameters.map(param => 
                  t.objectExpression([
                    t.objectProperty(t.identifier('name'), t.stringLiteral(param.name)),
                    t.objectProperty(t.identifier('order'), t.numericLiteral(param.order)),
                    t.objectProperty(t.identifier('type'), t.stringLiteral(param.type)),
                    t.objectProperty(t.identifier('prompt'), t.stringLiteral(param.prompt)),
                    t.objectProperty(t.identifier('required'), t.booleanLiteral(param.required)),
                  ])
                ))),
              ])
            )
          ]);
    
          // Create the export declaration for REASON__INTERNAL__INFO
          const exportDeclaration = t.exportNamedDeclaration(
            null,  // No initialization, just declaring the export
            [t.exportSpecifier(t.identifier('REASON__INTERNAL__INFO'), t.identifier('REASON__INTERNAL__INFO'))]
          );

          // Insert the export declaration after the info variable
          path.insertAfter(exportDeclaration);
          
          const insertedPaths = path.insertAfter(info);
          if (insertedPaths && Array.isArray(insertedPaths) && insertedPaths.length) {
            insertedPaths[0].scope.registerDeclaration(insertedPaths[0]);
          }
        },
    
        FunctionDeclaration(path) {
          let params = []
          for (let p of path.node.params) {
            let param
            
            if (p.typeAnnotation) {
              param = {
                name: p.name,
                typeAnnotation: { ...p.typeAnnotation },
                optional: p.optional,
              }
            } else param = p
  
            params.push(param)
          }
          functions.set(path.node.id.name, params);
        },
      }
    }
  }
  
  return extractJsDocPlugin
}