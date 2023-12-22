import ReasonError from '../../utils/reasonError.js'
import internalname from '../internalname.js';
import isPathFromReason from '../isPathFromReason.js';
import jsdocParser from "../utils/jsdoc-parser.js";

function isDefaultSpecifier(specifier) {
  if (specifier.type === 'ImportDefaultSpecifier') return true
  if (specifier.imported.name === 'default') return true

  return false
}

export default function getPromptInfoFromAgent(code, filePath, state, isJs = false) {
  let agentcallname;

  const imports = new Map()

  const actionsPrompt = []

  let agentdesc;
  let agentname;

  function extractJsDocPlugin({ types: t }) {
    function importPromptInfoFromAction(names, path) {
      for (let name of names) {
        let node = imports.get(name)?.node

        if (!node) throw new ReasonError(`Could not find the action ${name} that you are exporting in the \`actions\` variable in the agent ${filePath}\nMake sure you are importing it correctly.`, 43)

        const namedImportAlias = `${name}__REASON_PROMPT_INFO`;

        const namedSpecifier = t.importSpecifier(
          t.identifier(namedImportAlias),
          t.identifier('REASON__INTERNAL__INFO')
        );

        node.specifiers.push(namedSpecifier);

        actionsPrompt.push(t.identifier(namedImportAlias))

        imports.set(name, {
          ...imports.get(name),
          promptVar: namedImportAlias
        })
      }

      // Create the global variable declaration for the array
      const arrayDeclaration = t.assignmentExpression("=", t.identifier("REASON__INTERNAL__PROMPT_INFOS"), t.arrayExpression(actionsPrompt))
      path.insertAfter(arrayDeclaration);
      state.hasCreatedActionArray = true;

      // const parentProgram = path.findParent((path) => path.isProgram());

      // // Add the declaration at the top of the program
      // parentProgram.unshiftContainer("body", arrayDeclaration);

      return
    }

    return {
      visitor: {
        ImportDeclaration(path) {
          if (!state.definedActionVariable) {
            const arrayDeclaration = t.variableDeclaration("let", [
              t.variableDeclarator(
                t.identifier("REASON__INTERNAL__PROMPT_INFOS"),
                t.arrayExpression([])
              )
            ]);
            state.definedActionVariable = true
            path.insertAfter(arrayDeclaration)
          }
          
          for (let specifier of path.node.specifiers) {
            let i = {
              varname: specifier.local.name,
              orginalname: specifier.imported?.name ?? specifier.local.name,
              default: isDefaultSpecifier(specifier),
              node: path.node
            }

            imports.set(i.varname, i)

            if (isPathFromReason(path.node.source.value)) {
              if (i.orginalname === 'useAgent') {
                specifier.imported.name = internalname + 'useAgent';

                path.scope.rename(internalname + 'useAgent', i.varname);
                agentcallname = i.varname;
              }
            }
          }
        },
        ExportNamedDeclaration(path) {
          // Handle direct declarations
          if (path.node.declaration && t.isVariableDeclaration(path.node.declaration)) {
            const declarations = path.node.declaration.declarations;

            for (const declarator of declarations) {
              if (declarator.id.name === 'actions') {
                if (t.isArrayExpression(declarator.init)) {
                  const varNames = declarator.init.elements.map(el => el.name);
                  importPromptInfoFromAction(varNames, path);
                } else throw new ReasonError('Inside your agent the exported variable `actions` must be an array of containing only actions — and here you exported a `actions` not as an array.', 37)
              }
            }
          }

          else {
            // Handle indirect named exports
            const specifiers = path.node.specifiers || [];
            for (const specifier of specifiers) {
              if (specifier.exported.name === 'actions' && t.isExportSpecifier(specifier)) {
                const binding = path.scope.getBinding(specifier.local.name);
                if (binding) {
                  if (t.isArrayExpression(binding.path.node.init)) {
                    const varNames = binding.path.node.init.elements.map(el => el.name);
                    importPromptInfoFromAction(varNames, path);
                  } else throw new ReasonError('Inside your agent the exported variable `actions` must be an array of containing only actions — and here you exported a `actions` not as an array.', 37)
                }
              }
            }
          }

        },

        ExportDefaultDeclaration(path) {
          let functionDeclaration;

          if (t.isIdentifier(path.node.declaration)) {
            const binding = path.scope.getBinding(path.node.declaration.name);
            if (!binding || !t.isFunctionDeclaration(binding.path.node)) throw new ReasonError('Inside an agent file, the default export must be a function declaration.', 9);
            functionDeclaration = binding.path.node;
          } else if (t.isFunctionDeclaration(path.node.declaration)) {
            functionDeclaration = path.node.declaration;
          } else {
            throw new ReasonError('Inside an action file, the default export must be a function declaration.', 10)
          }

          // Find JSDoc comment directly above the function
          const leadingComments = functionDeclaration.leadingComments ?? path.node.leadingComments;
          if (!leadingComments || leadingComments.length === 0) throw new ReasonError(`All .ts/.js files inside the \`/agents\` directory are agents and agents must have a JSDoc comment directly above their default function declaration — and in ${filePath} there was none.`, 9281, { functionDeclaration, filePath });

          const jsDocComment = leadingComments[leadingComments.length - 1];
          if (jsDocComment.type !== 'CommentBlock' || !jsDocComment.value.trim().startsWith('*')) return

          // Parse JSDoc into parts
          const jsdoc = jsdocParser(jsDocComment.value);

          const nameNode = t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier('REASON__INTERNAL__AGENT_NAME'),
              t.stringLiteral(functionDeclaration.id.name)
            )
          ])
          path.insertAfter(nameNode)

          const descNode = t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier('REASON__INTERNAL__AGENT_DESCRIPTION'),
              t.stringLiteral(jsdoc.description)
            )
          ])
          path.insertAfter(descNode)
        },

        CallExpression(path) {
          if (t.isIdentifier(path.node.callee, { name: agentcallname }) && path.node.arguments.length <= 1) {
            if (state.hasFoundAgentCall) {
              throw new ReasonError(`Found more than one \`useAgent()\` call inside the agent ${path.basename(filePath)} in ${filePath}.`, 40)
            }

            // Insert new arguments
            let agentinfo = {
              type: 'agent',
              name: agentname,
              filepath: filePath,
              prompt: agentdesc,
            }
            const props = [
              t.objectProperty(t.identifier("type"), t.stringLiteral(agentinfo.type)),
              // t.objectProperty(t.identifier("name"), t.stringLiteral(agentinfo.name)),
              t.objectProperty(t.identifier("name"), t.identifier("REASON__INTERNAL__AGENT_NAME")),
              t.objectProperty(t.identifier("filepath"), t.stringLiteral(agentinfo.filepath)),
              t.objectProperty(t.identifier("prompt"), t.identifier("REASON__INTERNAL__AGENT_DESCRIPTION")),
              // t.objectProperty(t.identifier("prompt"), t.stringLiteral(agentinfo.prompt)),
            ]
            path.node.arguments.unshift(t.objectExpression(props), t.identifier("REASON__INTERNAL__PROMPT_INFOS"));
            state.hasFoundAgentCall = true
          }
        }
      }
    }
  }

  return extractJsDocPlugin
}