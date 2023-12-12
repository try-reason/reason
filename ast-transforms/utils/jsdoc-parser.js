function initialParse(str) {
  let lines = str.split('\n')

  let description = ''
  let descdone = false
  let parameters = []

  for (let line of lines) {
    line = line.replace('*', '')
    if (line.trim().startsWith('@param')) {
      descdone = true
      parameters.push('')
    }

    if (descdone) {
      parameters[parameters.length - 1] += line + '\n'
    }

    if (!descdone) {
      description += line.trim() + '\n'
    }
  }

  description = description.trim()
  for (let i = 0; i < parameters.length; i++) parameters[i] = parameters[i].trim()

  return { description, parameters}
}

function parseParameter(parameter) {
  let parsed = {
    name: '',
    required: true,
  }

  parameter = parameter.replace('@param ', '').trim()

  if (parameter.startsWith('{')) {
    let type = parameter.split('}')[0].replace('{', '').trim()
    parameter = parameter.replace(`{${type}}`, '').trim()
    parsed.type = type

    if (type.endsWith('?')) {
      parsed.required = false
      parsed.type = type.replace('?', '')
    }
  }

  if (parameter.startsWith('[')) {
    parsed.required = false
    let name = parameter.split(']')[0].replace('[', '').trim()
    parameter = parameter.replace(`[${name}]`, '').trim()
    parsed.name = name
  } else {
    let space = parameter.indexOf(' ')
    if (space === -1) {
      // if theres no description, the name is the whole thing
      parsed.name = parameter
      parsed.description = ''
      return parsed
    }
    let name = parameter.substring(0, space)
    parsed.name = name
    parameter = parameter.substring(space).trim()
  }

  if (parameter.length > 0) {
    if (parameter.startsWith('-')) {
      parameter.replace('-', '').trim()
    }

    parsed.description = parameter
  }

  return parsed
}

function finalParse(tree) {
  let jsdoc = {
    description: tree.description,
    parameters: []
  }

  for (let parameter of tree.parameters) {
    jsdoc.parameters.push(parseParameter(parameter))
  }

  return jsdoc
}

export default function parseJSDoc(str) {
  return finalParse(initialParse(str))
}