import Ajv from "ajv"
import { ChatResponseFunction, OAIFunction } from "../services/getChatCompletion"
import ReasonError from "./reasonError.js"
import isDebug from "./isDebug"

interface ReasonActionInfo {
  name: string
  prompt: string
  parameters: {
    name: string
    type: string
    required: boolean
    prompt?: string
  }[]
}

export { ReasonActionInfo }

export default function action2OAIfunction(action: ReasonActionInfo): OAIFunction {
  let properties: OAIFunction['parameters']['properties'] = {}
  let required: OAIFunction['parameters']['required'] = []

  let fn: OAIFunction = {
    name: action.name,
    description: action.prompt,
    parameters: {
      type: 'object',
      required: [],
      properties: {}
    }
  }

  for (let param of action.parameters) {
    const name = param.name

    if (param.required) required.push(name)

    if (properties[name]) throw new ReasonError(`During a typed \`reason<Type>()\` call you defined the same property \`${name}\` more than once. This is not allowed.`, 201)

    properties[name] = JSON.parse(param.type)
    if (param.prompt) properties[name].description = param.prompt
  }

  fn.parameters.properties = properties
  fn.parameters.required = required

  return fn
}
// [
//   {
//     name: 'classification',
//     type: '{"enum":["videogame-related","news","social-media"]}',
//     prompt: 'the webpage classification. you should classify to one the categories as close as possible',
//     required: true
//   }
// ]
const AAjv = Ajv as any
const ajv = new AAjv();

function removeAllNullProperties(obj: Record<string, any>) {
    for (let key of Object.keys(obj)) {
        if (obj[key] === null)
            delete obj[key];
        if (typeof obj[key] === 'object')
            removeAllNullProperties(obj[key]);
    }
    return obj;
}

export function validateOAIfunction(completion: ChatResponseFunction, actions: ReasonActionInfo[]): any {
  const fn = actions.find(action => action.name === completion.function_call.name);
  
  if (!fn) throw new ReasonError(`OpenAI returned a function that does not exist in the functions they were passed.`, 602);
  
  const parsedArguments = JSON.parse(completion.function_call.arguments);

  try {
    removeAllNullProperties(parsedArguments)
  } catch(err: any) {
    if (isDebug) {
      console.error('Error occurred while removing null properties (Err code: 8281)')
      console.error(err)
    }
  }
  
  for (let parameter of fn.parameters) {
    if (parameter.required && !(parameter.name in parsedArguments)) {
      throw new ReasonError(`The parameter \`${parameter.name}\` was not returned from the LLM but you marked it as required.`, 603);
    }

    // Validate against JSON Schema type
    const isValid = ajv.validate(JSON.parse(parameter.type), parsedArguments[parameter.name]);
    
    if (isDebug) {
      console.log('parameter from code');
      console.log(parameter);
      console.log('parameter from oai');
      console.log(parsedArguments[parameter.name]);
    }
    
    if (!isValid) {
      throw new ReasonError(`You specified the parameter \`${parameter.name}\` to be of type ${parameter.type} but the LLM returned "${parsedArguments[parameter.name]}".`, 604, { parameter: parameter.name, type: parameter.type, value: parsedArguments[parameter.name] });
    }
  }

  return true;
}
