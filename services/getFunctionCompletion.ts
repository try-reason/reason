import fs from 'fs'
import { OAIChatModels, OAIChatPrompt, OAIOptions, getChatCompletionGenRAW } from './getChatCompletion';
import { ReasonActionInfo } from '../utils/oai-function';
import { StreamReturn } from '../functions/think';
import ReasonError from '../utils/reasonError.js';
import completeJSON, { findIncompleteKeys } from '../utils/complete-json';
import StreamableObject from '../functions/__internal/StremableObject';
import { Trace } from '../observability/tracer';
import isDebug from '../utils/isDebug';

interface Options {
  model?: OAIChatModels;
  key?: string;
  config: Omit<Partial<OAIOptions>, 'functions'> & { functions: OAIOptions['functions'] };
}

export { Options as LLMConfig }

interface FunctionReturn {
  type: 'function';
  name: string;
  arguments: StreamReturn<Record<string, any>>;
}

interface FunctionReturnFinal {
  type: 'function';
  name: string;
  arguments: Record<string, any>;
}

interface TextReturn {
  type: 'text';
  content: string;
}

interface TextFunctionReturn {
  type: 'text+function';
  text: string;
  action: FunctionReturnFinal
}

function getActionFromJsonSchema(schema: any) {
  if (schema.type === 'object') return new StreamableObject(getActionFromJsonSchemaObject(schema), false);
  else if (schema.type === 'array') return new StreamableObject(getActionFromJsonSchemaArray(schema), false);
  else return new StreamableObject(null, false);
}

// new
function getActionFromJsonSchemaArray(schema: any) {
  return []
}
function getActionFromJsonSchemaObject(schema: Record<string, any>) {
  let params = schema.properties

  let action: Record<string, any> = {}

  for (const key of Object.keys(params)) {
    action[key] = getActionFromJsonSchema(params[key])
  }

  return action
}

function buildStremableArray(fnname: string, actions: ReasonActionInfo[], path: string[]) {
  const action = actions.find(action => action.name === fnname);
  if (!action) {
      throw new ReasonError(`LLM returned a function call for a function/action that does not exist. It tried calling \`${fnname}\`.`, 20902, { fnname, actions, path });
  }

  const param = action.parameters.find(param => param.name === path[0]);

  if (!param) {
      throw new ReasonError(`Error while decoding the LLM output of array type.`, 20913, { fnname, actions, path });
  }

  const type = JSON.parse(param.type);
  if (type.type !== 'array') {
      throw new ReasonError(`Error while decoding the LLM output of array type. Expected "array" but got "${type.type}"`, 20914, { fnname, actions, path, param });
  }

  let arrayType = type.items;
  let i = 1
  while (i < path.length) {
      if (path[i].startsWith('[') && path[i].endsWith(']')) {
          i++
          continue
      }

      if (arrayType.type === 'array') {
          arrayType = arrayType.items
          continue
      }
      if (arrayType.type === 'object') {
          arrayType = arrayType.properties[path[i]]
          i++
          continue
      }
      i++
  }

  if (arrayType.items) arrayType = arrayType.items

  const streamable = getActionFromJsonSchema(arrayType);

  return streamable
}

function path2value(obj: any, parts: string[], suffix?: string) {
  try {
      for (let i = 0; i < parts.length; i++) {
          let part = parts[i];
          if (typeof obj !== 'object') {
              throw new ReasonError(`Error while decoding LLM return. Expected object or array but got ${typeof obj} in path ${parts}`, 20950, { obj, parts });
          }
          if (obj === null)
              return null;
          if (part.startsWith('[') && part.endsWith(']')) {
              if (obj === null)
                  return null;
              if (!Array.isArray(obj)) {
                  throw new ReasonError(`Error while decoding LLM return. Expected array but got ${typeof obj} in path ${parts}`, 20951, { obj, parts });
              }
              // array
              const index = parseInt(part.slice(1, -1));
              if (obj.length <= index) {
                  return null;
              }
              if (suffix && i !== parts.length - 1) {
                  obj = obj[index][suffix];
                  continue;
              }
              obj = obj[index];
          }
          else {
              // object
              if (Array.isArray(obj)) {
                  throw new ReasonError(`Error while decoding LLM return. Expected \`object\` but got \`array\` in path \`${parts}\``, 20952, { obj, parts, part });
              }
              if (obj.hasOwnProperty(part) === false) {
                  return null;
              }
              if (suffix && i !== parts.length - 1) {
                  obj = obj[part][suffix];
                  continue;
              }
              obj = obj[part];
          }
      }
      return obj;
  }
  catch (err) {
      if (err instanceof ReasonError) {
          throw err;
      }
      else {
          throw new ReasonError(`Error while decoding LLM return.`, 20957, { obj, parts });
      }
  }
}


function constructFunctionReturn(fnname: string, actions: ReasonActionInfo[]): FunctionReturn {
  let streamable: FunctionReturn = {
    type: 'function',
    name: '',
    arguments: {}
  }

  let action = actions.find(action => action.name === fnname)
  if (!action) {
    throw new ReasonError(`LLM returned a function call for a function/action that does not exist. It tried calling \`${fnname}\`.`, 902, { fnname, actions })
  }

  streamable.name = fnname

  for (let param of action.parameters) {
    streamable.arguments[param.name] = {
      value: null,
      done: false
    }
    streamable.arguments[param.name] = new StreamableObject(null, false)
    if (JSON.parse(param.type).type === 'object' || JSON.parse(param.type).type === 'array') {
      streamable.arguments[param.name] = getActionFromJsonSchema(JSON.parse(param.type));
    }
  }

  return streamable
}

function makeAllDone(streamable: FunctionReturn['arguments']) {
  let hasNull = false;

  if (typeof streamable === 'object' && !Array.isArray(streamable)) {
      for (let key of Object.keys(streamable)) {
          if (streamable[key] instanceof StreamableObject) {
              if (streamable[key].value === null) {
                  hasNull = true;
                  continue;
              }
              streamable[key].done = true;
              if (makeAllDone(streamable[key].value)) {
                  streamable[key].done = false;
                  hasNull = true;
              }
          }
      }
  }
  else if (Array.isArray(streamable)) {
      for (let i = 0; i < streamable.length; i++) {
          if (streamable[i] instanceof StreamableObject) {
              if (streamable[i].value === null) {
                  hasNull = true;
                  continue;
              }
              streamable[i].done = true;
              if (makeAllDone(streamable[i].value)) {
                  streamable[i].done = false;
                  hasNull = true;
              }
          }
      }
  }

  return hasNull
}

function handleStreamable(json: string, streamable: FunctionReturn, actions: ReasonActionInfo[]) {
  try {
    // console.log();
    // console.log(`raw data json: \`\`\`${json}\`\`\``);
    // console.log();
    
    let data = JSON.parse(completeJSON(json))
    let keys = findIncompleteKeys(json)

    // console.log();
    // console.log(`completedJSON: \`${completeJSON(json)}\``);
    // console.log(`incomplete keys: \`${keys}\``);

    let stack: string[][] = Object.keys(data).map(k => [k])
    while (stack.length > 0) {
      let key = stack.pop()!
      // console.log('key', key);
      let value = path2value(data, key);
      // console.log(`data obj value: "${JSON.stringify(value)}"`);
      if (typeof value === 'object' && Array.isArray(value) === false) {
        stack.push(...Object.keys(value).map(k => [...key, k]))
      } else {
        try {
          const streamValue = path2value(streamable.arguments, key, 'value');
          // console.log('streamValue', streamValue);
          // console.log('streamable', streamable.arguments);

          if (Array.isArray(value)) { // new
            // build streamble array ([{ done: bool, value: Streamable<T> }])
            while (streamValue.value.length < value.length) {
                const arrVal = buildStremableArray(streamable.name, actions, key);
                streamValue.value.push(arrVal)
            }

            // fill streamable array with actual values
            for (let i = 0; i < value.length; i++) { 
              if (typeof(value[i]) !== 'object') {
                streamValue.value[i].value = value[i];
                continue;
              }

              const keys = Object.keys(value[i]);
              const keysWithIndex = keys.map(k => [...key, `[${i}]`, k]);
              stack.push(...keysWithIndex);
            }
            continue
        }
          
          if (streamValue) {
            // console.log('streamValue', streamValue);
            
            streamValue.value = value
            streamValue.done = true
          }
        } catch (e) {
          // console.log('error', e);
        }
      }
    }

    // console.log('incomplete keys', keys);

    makeAllDone(streamable.arguments)

    for (let key of keys) {
      const streamValue = path2value(streamable.arguments, key.split('.'), 'value');
      if (streamValue) {
        streamValue.done = false
      }
    }
    
    // deepMerge(streamable.arguments, data)
  } catch {

  }
} 

export { FunctionReturn }

export default async function* getFunctionCompletionGen(prompt: OAIChatPrompt[], actions: ReasonActionInfo[], { model, key, config }: Options, trace: Trace): AsyncGenerator<FunctionReturn | TextReturn, FunctionReturnFinal | TextReturn | TextFunctionReturn> {
  let streamable: FunctionReturn = {
    type: 'function',
    name: '',
    arguments: {}
  }

  let text = ''

  const gen = getChatCompletionGenRAW(prompt, { model, key, config }, trace)
  let result = await gen.next()
  let jsons = []
  let json = ''
  while (!result.done) {
    let { value } = result

    jsons.push(value)

    // if no `function_call` in the OpenAI streamed response: its either a text return or a stop
    if (!('function_call' in value.choices[0].delta)) {
      if (value.choices[0].finish_reason === 'stop' || value.choices[0].finish_reason === 'function_call' || value.choices[0].finish_reason === 'content_filter') break

      if (typeof(value.choices[0].delta.content) !== 'string') {
        if (isDebug) fs.writeFileSync('oai-json-FULL-response.json', JSON.stringify(json, null, 2))
        if (isDebug) fs.writeFileSync('oai-jsons-response.json', JSON.stringify(jsons, null, 2))
        throw new Error('Invalid response from OpenAI API — no function call returned and no text content returned as well.')
      }

      // its text return
      text += value.choices[0].delta.content
      yield { type: 'text', content: text }

      result = await gen.next()
      continue
      // console.log('value', value);
    }

    let fn = value.choices[0].delta.function_call
    
    if (fn.name && streamable.name === '') {
      streamable = constructFunctionReturn(fn.name, actions)
    }
    
    if (fn.arguments) {
      json += fn.arguments
    }

    // console.log('-------------');
    // console.time('handleStreamable')
    handleStreamable(json, streamable, actions)
    // console.timeEnd('handleStreamable')
    // console.log();
    // console.log(`json: \`${json}\``);
    // console.log('streamable', streamable);
    // console.log('-------------');
    // console.log();

    yield streamable
    result = await gen.next()
  }

  if (isDebug) fs.writeFileSync('oai-jsons-response.json', JSON.stringify(jsons, null, 2))

  if (text !== '') {
    if (streamable.name !== '') {
      // was a text & function return
      const finalResult = { type: 'text+function', text: text, action: { type: 'function', name: streamable.name, arguments: JSON.parse(completeJSON(json)) } }
      trace.addAttribute('llm.call.output', finalResult)
      return finalResult as any
    }

    // was text return
    const finalResult = { type: 'text', content: text }
    trace.addAttribute('llm.call.output', finalResult)
    return finalResult as any
  }

  handleStreamable(json, streamable, actions)
  yield streamable

  if (isDebug) fs.writeFileSync('oai-json-FULL-response.json', JSON.stringify(json, null, 2))
  if (isDebug) fs.writeFileSync('oai-jsons-response.json', JSON.stringify(jsons, null, 2))

  const finalResult = { name: streamable.name, type: 'function', arguments: JSON.parse(completeJSON(json)) }
  trace.addAttribute('llm.call.output', finalResult)
  return finalResult as any
}