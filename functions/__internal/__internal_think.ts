import IContext from "../../observability/context.js";
import { Trace } from "../../observability/tracer";
import getChatCompletion, { getChatCompletionGen } from "../../services/getChatCompletion";
import type { OAIMessage, ThinkConfig } from "../../types/thinkConfig.d.ts";
import asyncLocalStorage from "../../utils/asyncLocalStorage";
import { StreamReturn } from "../think";
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

export async function* __internal_DO_NOT_USE_thinkStream<T = string>(input: string | OAIMessage[], config: ThinkConfig | null, extractor?: ExtractorInfo[]): AsyncGenerator<StreamReturn<T> | string, T> {
  const context = asyncLocalStorage.getStore() as IContext

  if (extractor) {
    const trace = new Trace(context, 'LLM call', 'extractor-llm-call')
    trace.startActiveSpan((span: any) => {})
    trace.addAttribute('llm.call.is_stream', true)

    const gen = extractorThinkStream(input, config, extractor, trace)
    let result = await gen.next()
    while (!result.done) {
      let { value } = result

      yield value as StreamReturn<T>

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
  while (!result.done) {
    let { value } = result;
    fullText += value
    yield { value: fullText, done: false, delta: value } as any;
    result = await gen.next();
  }
  yield { value: result.value, done: true, delta: '' } as any;

  const returnValue = result.value
  trace.addAttribute('llm.call.output', returnValue)
  trace.end()
  return returnValue as T
}