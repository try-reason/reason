import parser from '@babel/parser'

export default function ts2ast(code) {
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript'],
  });

  return ast
}