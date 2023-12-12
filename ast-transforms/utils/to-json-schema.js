import ReasonError from '../../utils/reasonError.js'
import ts2ast from './to-ts-ast.js'
import parseJSDoc from './jsdoc-parser.js'


const NOT_ALLOWED_TYPES = [
  'TSAnyKeyword',
  'TSUnknownKeyword',
  'TSVoidKeyword',
  'TSNullKeyword',
  'TSNeverKeyword',
  'TSUndefinedKeyword',
  'TSThisType',
]

const astTypes2tsTypes = {
  'TSAnyKeyword': 'any',
  'TSUnknownKeyword': 'unknown',
  'TSVoidKeyword': 'void',
  'TSNullKeyword': 'null',
  'TSNeverKeyword': 'never',
  'TSUndefinedKeyword': 'undefined',
  'TSThisType': 'this',

  'TSStringKeyword': 'string',
  'TSNumberKeyword': 'number',
  'TSBooleanKeyword': 'boolean',
}

function getDesc(annotation) {
    let desc = annotation.leadingComments?.[0]?.value ?? '';
    if (desc) {
        let jdoc = parseJSDoc(desc);
        desc = jdoc.description;
        return { description: desc }
    }
    return {}
}

function handleStringType(annotation) {
  return {
    type: 'string'
  }
}

function handleNumberType(annotation) {
  return {
    type: 'number'
  }
}

function handleBooleanType(annotation) {
  return {
    type: 'boolean'
  }
}

function handleUnionType(annotation) {
  const r = {
    enum: []
  }

  for (let type of annotation.types) {
    if (type.type !== 'TSLiteralType') {
      // TODO: link doc
      throw new ReasonError('You can only use literal types in a TypeScript union.\n\nFor example `type union = "foo" | "bar" | 10` is valid.\nBut `type union = string | number` is not.\n\nFor more information see link doc', 9)
    }

    r.enum.push(type.literal.value)
  }

  return r
}

function handleArrayType(annotation) {
  let r = {
    type: 'array',
    items: {

    }
  }

  if (!annotation.elementType?.type) {
    throw new ReasonError(`element type is not an object: ${annotation}`, 13)
  }

  r.items = toJsonSchema(annotation.elementType)
  return r
}

function handleParatensisType(annotation) {
  return toJsonSchema(annotation.typeAnnotation)
}

function handleObjectType(annotation) {
  const r = {
    type: 'object',
    properties: {},
    required: []
  }

  for (let member of annotation.members) {
    let m = {}

    if (member.type !== 'TSPropertySignature') {
      throw new ReasonError(`Member type ${member.type} not yet supported.`, 15)
    }

    if (!member.optional) {
      r.required.push(member.key.name)
    }
    const memberSchema = {
      ...getDesc(member),
      ...toJsonSchema(member.typeAnnotation.typeAnnotation)
    }
    r.properties[member.key.name] = memberSchema
  }

  return r
}

function handleTupleType(annotation) {
  const r = {
    type: 'array',
    prefixItems: [

    ]
  }

  for (let type of annotation.elementTypes) {
    r.prefixItems.push(toJsonSchema(type))
  }

  return r
}

export function toJsonSchema(annotation) {
  const schemaType = {}

  if (NOT_ALLOWED_TYPES.includes(annotation.type)) {
    // TODO: link doc
    throw new ReasonError(`You cannot use ${astTypes2tsTypes[annotation.type]} type as a LLM parameter. Check our documentation for more information.`, 7)
  }

  switch(annotation.type) {
    case 'TSStringKeyword': {
      return handleStringType(annotation)
    }

    case 'TSNumberKeyword': {
      return handleNumberType(annotation)
    }

    case 'TSBooleanKeyword': {
      return handleBooleanType(annotation)
    }

    case 'TSUnionType': {
      return handleUnionType(annotation)
    }

    case 'TSArrayType': {
      return handleArrayType(annotation)
    }

    case 'TSTypeLiteral': {
      return handleObjectType(annotation)
    }

    case 'TSParenthesizedType': {
      return handleParatensisType(annotation)
    }

    case 'TSTupleType': {
      return handleTupleType(annotation)
    }

    case 'TSLiteralType': {
      throw new ReasonError('Literal type are disallowed as it doesn\'t make sense to use them in a LLM call.\nA literal type is `type literal = "foo"`, `type literal = 17`, etc.\n\nLiteral types are only allowed in union types — e.g. `type Foo = "foo" | "bar"`', 16)
    }

    // TODO: add support
    case 'TSTypeReference': {
      throw new ReasonError('Sadly, we currently do not support utility types — such as `Omit<>`, `Partial<>`, etc. We do plan on adding support on our next release.', 17)
    }

    default: {
      throw new ReasonError(`Type ${annotation.type} not yet supported.`, 8)
    }
  }
}

export function jdoc2jsonSchema(jdoctype) {
  const code = `function inacio(mattos: ${jdoctype}) {}`
  const ast = ts2ast(code)

  const typeAnnotation = ast.program.body[0].params[0].typeAnnotation.typeAnnotation

  return toJsonSchema(typeAnnotation)
}
