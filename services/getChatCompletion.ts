import fs from 'fs'
import isDebug from '../utils/isDebug';
import { openaiConfig as oaiConfig } from '../configs/openai'
import type IContext from '../observability/context.d.ts';
import { Trace } from '../observability/tracer';
import type { Message } from '../types/iagent.d.ts';
import asyncLocalStorage from '../utils/asyncLocalStorage';
import ReasonError from '../utils/reasonError.js';
import c from 'ansi-colors'
import OAIChatModels from '../types/oai-chat-models';
import anyscaleGetChatCompletion from './anyscale/getChatCompletion';
import { getChatCompletionGen as anyscaleGetChatCompletionGen } from './anyscale/getChatCompletion';
import oaiGetChatCompletion from './openai/getChatCompletion';
import { getChatCompletionGen as oaiGetChatCompletionGen } from './openai/getChatCompletion';

interface OAIFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    required: string[];
    properties: Record<string, any>;
  }
}

export { OAIFunction }

interface OAIOptions {
  max_tokens: number;
  temperature: number;
  top_p: number;
  presence_penalty: number;
  frequency_penalty: number;
  stop: string[];
  
  function_call: {
    name: string;
  };
  functions: OAIFunction[];
}

type OAIChatPrompt = Message

interface ChatResponseText {
  role: 'assistant';
  content: string;
}
interface ChatResponseFunction {
  role: 'assistant';
  content: null;
  tool_calls: {
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    }
  }[]
}

interface Options {
  model?: OAIChatModels;
  key?: string;
  config?: Partial<OAIOptions>;
}

type OAIChatResponse = ChatResponseText | ChatResponseFunction

export default async function getChatCompletion(prompt: OAIChatPrompt[], { model, key, config }: Options, trace: Trace): Promise<OAIChatResponse> {
  const anyscaleModels = ['mistralai/Mistral-7B-Instruct-v0.1', 'mistralai/Mixtral-8x7B-Instruct-v0.1']

  let fn

  if (anyscaleModels.includes(model || '')) {
    fn = anyscaleGetChatCompletion
  } else {
    fn = oaiGetChatCompletion
  }

  return await fn(prompt, { model, key, config }, trace)
}

interface OAIStreamedResponseText {
  role: 'assistant';
  content: null;
  tool_calls: {
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    }
  }[]
}

interface OAIStreamedResponseFunction {
  role: 'assistant';
  content: string;
}

interface OAIStreamedResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: [{
    index: number;
    finish_reason: string | null;
    delta: OAIStreamedResponseFunction | OAIStreamedResponseText;
  }]
}

function obfuscateKey(key: string) {
  let obfuscatedKey = key.slice(0, 7)
  for (let i = 4; i < key.length - 2; i++) {
    obfuscatedKey += '*'
  }
  obfuscatedKey += key.slice(-2)
  return obfuscatedKey
}

async function* getChatCompletionGenRAW(prompt: OAIChatPrompt[], { model, key, config }: Options, trace: Trace): AsyncGenerator<OAIStreamedResponse> {
  const oaiKey = key ?? oaiConfig.key
  const modelToUse = model ?? oaiConfig.defaultModel

  if (oaiKey === '<your-openai-key>') {
    console.error(`${c.bold.red('ERROR')} — You need to set your OpenAI key in \`.reason.config.js\`.`)
    throw new ReasonError('You need to set your OpenAI key in the `.reason.config.js` file.', 492)
  }

  const context = asyncLocalStorage.getStore() as IContext
  trace.addAttribute('llm.call', {
    config,
    messages: prompt,
    model: modelToUse,
    is_stream: true,
    open_ai_key: obfuscateKey(oaiKey),
  })

  const body = {
    ...config,
    model: modelToUse,
    messages: prompt,
    stream: true
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${oaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (res.status !== 200) {
    throw new ReasonError(`OpenAI returned ${res.status} ${res.statusText}. Here\'s the full response: ${JSON.stringify({ status: res.status, body: await res.json() }, null, 2)}`, 472, body)
  }
  

  const stream = res.body
  if (!stream) throw new Error('No stream')
  const reader = stream.getReader()

  let chunks = []
  let all = ''
  let fullText = ''
  let buffer = ''

  let result = await reader.read()
  while (!result.done) {
    const { done, value } = result

    if (context.stop) {
      if (context.hasErrored) {
        throw new ReasonError('The entrypoint threw an error. Stopping the stream.', 1704)
      }
      reader.releaseLock()
      return
    }

    if (done) {
      return fullText
    }

    const text = new TextDecoder("utf-8").decode(value)
    all += text
    if (isDebug) {
      chunks.push(text);
  }
    buffer += text
    let buffers = buffer.split('data: {')
    for (let buf of buffers) {
      if (buf === '') continue;
      buffer = ''
      buf = '{' + buf
      try {
        const data = JSON.parse(buf.replace('data: ', ''))
        yield data
      } catch {
        buffer = `data: ${buf}`
        break
      }
    }

    if (text.endsWith('\n')) {
      buffer = '' 
    }

    result = await reader.read()
  }

  if (isDebug) {
    fs.writeFileSync('oai-stream-response-raw.txt', all);
    fs.writeFileSync('oai-stream-response-raw-chunks.json', JSON.stringify(chunks, null, 2));
  }

  return
}

async function* getChatCompletionGen(prompt: OAIChatPrompt[], { model, key, config }: Options, trace: Trace) {
  const anyscaleModels = ['mistralai/Mistral-7B-Instruct-v0.1', 'mistralai/Mixtral-8x7B-Instruct-v0.1']

  let gen

  // run anyscale
  if (anyscaleModels.includes(model || '')) {
    gen = anyscaleGetChatCompletionGen(prompt, { model, key, config }, trace)
  }
  
  // OAI
  else {
    gen = oaiGetChatCompletionGen(prompt, { model, key, config }, trace)
  }

  let result = await gen.next()
  while (!result.done) {
    yield result.value
    result = await gen.next()
  }

  return result.value as any
}

export { getChatCompletionGen, getChatCompletionGenRAW }

export type { OAIChatPrompt, OAIChatModels, OAIOptions, ChatResponseFunction }