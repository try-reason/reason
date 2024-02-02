import IContext from "../../observability/context.js";
import { Trace } from "../../observability/tracer";
import getChatCompletion, { getChatCompletionGen } from "../../services/getChatCompletion";
import type { OAIMessage, ThinkConfig } from "../../types/thinkConfig.d.ts";
import asyncLocalStorage from "../../utils/asyncLocalStorage";
import stream from "../stream.js";
import { ReasonStreamReturn } from "../think";
import extractorThink, { extractorThinkStream } from "./think-extractor";

interface ExtractorInfo {
  name: string;
  type: string;
  required: boolean;
  prompt?: string;
}

export { ExtractorInfo }

export default async function __internal_DO_NOT_USE_think<T = string>(input: string | OAIMessage[], config: ThinkConfig | null, extractor?: ExtractorInfo[]): Promise<T> {
  const context = asyncLocalStorage.getStore() as IContext

  if (extractor) {
    const trace = new Trace(context, 'LLM call', 'extractor-llm-call')
    return trace.startActiveSpan(async (span: any) => {
      const res = await extractorThink(input, config, extractor, trace)
      trace.end()
      return res
    })
  }

  let messages: OAIMessage[] = []

  if (typeof input === 'string') {
    messages.push({
      role: 'user',
      content: input,
    })
  } else messages = input

  config = config ?? {}

  const trace = new Trace(context, 'LLM call', 'normal-llm-call')

  return trace.startActiveSpan(async (span: any) => {
    let res = await getChatCompletion(messages as any, config as any, trace)
    trace.end()
    return res.content as T
  })
}

export async function* __internal_DO_NOT_USE_thinkStream<T = string>(input: string | OAIMessage[], config: ThinkConfig | null, extractor?: ExtractorInfo[]): AsyncGenerator<ReasonStreamReturn<T> | string, T> {
  const context = asyncLocalStorage.getStore() as IContext

  if (extractor) {
    const trace = new Trace(context, 'LLM call', 'extractor-llm-call')
    trace.startActiveSpan((span: any) => {})
    trace.addAttribute('llm.call.is_stream', true)

    const gen = extractorThinkStream(input, config, extractor, trace)
    let result = await gen.next()
    while (!result.done) {
      let { value } = result

      yield value as ReasonStreamReturn<T>

      result = await gen.next()
    }

    const returnValue = result.value
    trace.end()
    return returnValue as T
  }

  let messages: OAIMessage[] = []

  if (typeof input === 'string') {
    messages.push({
      role: 'user',
      content: input,
    })
  }

  if (Array.isArray(input)) {
    messages = input
  }
  
  let model
  if (config?.model) {
    model = config.model
    delete config.model
    delete config.validation_strategy
  }
  
  let autoStream = false
  if (config?.autoStream) {
    autoStream = config.autoStream
    delete config.autoStream
  }

  let llmconfig = {
    model,
    config: {
      ...config,
    }
  }

  const trace = new Trace(context, 'LLM call', 'normal-llm-call')
  trace.startActiveSpan((span: any) => {})
  trace.addAttribute('llm.call.is_stream', true)
  const gen = getChatCompletionGen(messages as any, llmconfig as any, trace)
  let result = await gen.next()
  let fullText = '';

  let val: any = { value: '', done: false, delta: '' }
  let completionDone = false

  const getcompletion = async () => {
    while (!result.done) {
      let { value } = result;

      if (typeof(value) !== 'string') {
        result = await gen.next();
        continue
      }

      fullText += value
      val = { value: fullText, done: false, delta: value };
      result = await gen.next();

      if (autoStream) {
        stream(val)
      }
    }
    completionDone = true
    
    val = { value: result.value, done: true, delta: '' };
    if (autoStream) {
      stream(val)
    }

    trace.addAttribute('llm.call.output', val.value)
    trace.end()
  }

  const promises = [getcompletion()]

  while (!completionDone) {
    yield val
    
    /* the reason this is needed is to make sure the user `for await (... of reasonStream()) {}`
      does not starve the event loop — blocking all I/O.
      
      by waiting for a promise that resolves in the next `timers` phase of the event loop
      we make sure all I/O is processed before this loop runs again. */
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  yield val

  
  if (autoStream) {
    await Promise.all(promises)
  }

  return val as T
}