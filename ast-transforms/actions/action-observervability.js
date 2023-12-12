import getBasePath from '../getBasePath.js';

function getActionObserverPath() {
  return `${getBasePath()}actions/actionObserver.js`;
}

const wrappedFunctionPath = getActionObserverPath();

const wrapWithActionObserver = ({ types: t }) => ({
  name: "wrap-default-export",
  visitor: {
    Program: {
      enter(path) {
        const importDeclaration = t.importDeclaration(
          [t.importDefaultSpecifier(t.identifier('actionObserver'))],
          t.stringLiteral(wrappedFunctionPath)
        );
        path.node.body.unshift(importDeclaration);
      }
    },
    ExportDefaultDeclaration(path) {
      let declaration = path.node.declaration;

      if (t.isIdentifier(path.node.declaration)) {
        const binding = path.scope.getBinding(path.node.declaration.name);
        if (!binding || !t.isFunctionDeclaration(binding.path.node)) throw new ReasonError('Inside an action file, the default export must be a function declaration.', 9);
        declaration = binding.path.node;
      } else if (t.isFunctionDeclaration(path.node.declaration)) {
        declaration = path.node.declaration;
      } else {
        throw new ReasonError('Inside an action file, the default export must be a function declaration.', 10)
      }
      
      // If the exported value is a FunctionDeclaration, convert it to a FunctionExpression
      if (t.isFunctionDeclaration(declaration)) {
        declaration = t.functionExpression(
          declaration.id,
          declaration.params,
          declaration.body,
          declaration.generator,
          declaration.async
        );
      }
      
      // If the exported value is now a FunctionExpression or an ArrowFunctionExpression, wrap it
      if (t.isFunctionExpression(declaration) || t.isArrowFunctionExpression(declaration)) {
        const fooIdentifier = t.identifier('actionObserver');
        const wrappedFunction = t.callExpression(fooIdentifier, [declaration]);
        path.node.declaration = wrappedFunction;
      }
    }
  }
});


export default wrapWithActionObserver