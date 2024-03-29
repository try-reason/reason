import ThinkError from "../../ast-transforms/think/thinkError.js";
import ReasonError from '../../utils/reasonError.js';
import getChatCompletion, { OAIFunction, getChatCompletionGen } from "../../services/getChatCompletion";
import type { OAIMessage, ThinkConfig } from "../../types/thinkConfig.d.ts";
import action2OAIfunction, { ReasonActionInfo, validateOAIfunction } from "../../utils/oai-function";
import { ExtractorInfo } from "./__internal_think";
import isDebug from "../../utils/isDebug.js";
import { ReasonStreamReturn } from "../think.js";
import getFunctionCompletionGen, { FunctionReturn } from "../../services/getFunctionCompletion";
import { Trace } from "../../observability/tracer";
import stream from "../stream.js";
import { OAITool, ToolResponse } from "../../services/openai/getChatCompletion.js";

// const SYSTEM_PROMPT = `You'll receive a user text and your job is to extract the data the user needs and save the extracted data to a database. YOU NEED TO STRICTLY FOLLOW THE PARAMETERS TYPES YOU ARE GIVEN`
const SYSTEM_PROMPT = `You need to strictly follow the job its given to you but your response have to be using the \`respond_to_user()\`! You *must* respond using the correct arguments to the function! If you get wrong even the type of one of the parameters, a kid will die - please do not get it wrong. YOU NEED TO STRICTLY FOLLOW THE PARAMETERS TYPES YOU ARE GIVEN! DO NOT FORGET THIS - IT IS VERY IMPORTANT THAT YOU GET THIS RIGHT

IF YOU ARE GIVEN AN ENUM, THEN YOU ***HAVE*** TO ANSWER USING ONE OF THE ENUM VALUES`

function createSystemMessage(message?: OAIMessage): OAIMessage {
  let systemMessage = SYSTEM_PROMPT

  if (message?.role === 'system') systemMessage = `${message.content}\n\n${systemMessage}`

  return {
    role: 'system',
    content: systemMessage,
  }
}

function extractor2action(extractor: ExtractorInfo[]): ReasonActionInfo {
  let action: any = {
    name: 'respond_to_user',
    prompt: 'This function responds to the user with the data the user needs & *using the right types of the parameters*.'
  }

  action.parameters = extractor.map(param => {
    let description = ``

    if (param.prompt) description = `${param.prompt}.`
    else description = `None was given. In this case, interpret the parameter using its name and type.`

    return {
      prompt: description,
      name: param.name,
      type: param.type,
      required: param.required,
    }
  })

  return action
}

function toOAItool(extractor: ExtractorInfo[]): OAITool {
  let extractorAction = extractor2action(extractor)

  let fn = action2OAIfunction(extractorAction)

  return fn
}

export default async function extractorThink(input: string | OAIMessage[], config: null | ThinkConfig, extractor: ExtractorInfo[], trace: Trace) {
  let messages: OAIMessage[] = []

  if (typeof input === 'string') {
    messages.push(createSystemMessage())

    messages.push({
      role: 'user',
      content: input,
    })
  }

  if (Array.isArray(input)) {
    if (input[0].role !== 'system') messages.push(createSystemMessage(), ...input)
    else messages.push(createSystemMessage(input[0]), ...input.slice(1))
  }

  messages[messages.length - 1].content += '\n\nYOU NEED TO STRICTLY FOLLOW THE PARAMETERS TYPES YOU ARE GIVEN. YOU NEED TO STRICTLY FOLLOW THE PARAMETERS TYPES YOU ARE GIVEN! DO NOT FORGET THIS - IT IS VERY IMPORTANT THAT YOU GET THIS RIGHT\nHERE IS THE TYPE OF THE PARAMETERS YOU NEED TO ANSWER WITH:\n\n' + extractor.map(param => `${param.name}: ${param.type} ${param.prompt ? `\nParameter's description: ${param.prompt}` : ''}`).join('\n\n')
  
  const tool = toOAItool(extractor)

  let model
  // TODO: implement the retry validation strategy!
  let validationStrategy = config?.validation_strategy ?? null
  if (config?.validation_strategy) delete config.validation_strategy
  let ignoreValidation = validationStrategy === 'ignore'

  if (config?.model) {
    model = config.model
    delete config.model
  }

  let llmconfig = {
    model,
    config: {
      ...config,
      temperature: 0,
      tool_choice: {
        type: 'function',
        function: {
          name: tool.function.name
        }
      },
      tools: [tool],
    }
  }

  if (isDebug) console.log(tool);

  const completion = await getChatCompletion(messages as any, llmconfig, trace)

  if (!('tool_calls' in completion)) {
    const debuginfo = { err: 'no tool_calls returned in the extractor response', modelOutput: completion, input: messages, llmconfig }
    throw new ThinkError(`OpenAI model did not returned a valid response in the format you expected.\n\nThis can happen for a few reasons:\n1) The format you want is too complex — try simplifying it\n2) Try enhancing the descriptions of each parameter\n3) If you are using gpt-3.5-turbo, try using gpt-4.`, 600, debuginfo)
  }

  if (!ignoreValidation) {
    try {
      validateOAIfunction(completion.tool_calls[0], [extractor2action(extractor)])
    } catch (err) {
      trace.err(err)

      if (err instanceof ReasonError) {
        const debuginfo = { err: err.message, modelOutput: completion, input: messages, llmconfig }
        throw new ThinkError(`${err.message} — OpenAI model did not returned a valid response in the format you specified in the \`reason<type>()\` function call.\n\nThis can happen for a few reasons:\n1) The format you want is too complex — try simplifying it;\n2) Try enhancing the descriptions of each parameter and your overall prompt;\n3) If you are using gpt-3.5-turbo, try using gpt-4.`, err.code, debuginfo)
      }


      throw err
    }
  }

  return JSON.parse(completion.tool_calls[0].function.arguments)
}

export async function* extractorThinkStream<T extends object = Record<string, any>>(input: string | OAIMessage[], config: null | ThinkConfig, extractor: ExtractorInfo[], trace: Trace): AsyncGenerator<ReasonStreamReturn<T>, T> {
  let messages: OAIMessage[] = []

  if (typeof input === 'string') {
    messages.push(createSystemMessage())

    messages.push({
      role: 'user',
      content: input,
    })
  }

  if (Array.isArray(input)) {
    if (input[0].role !== 'system') messages.push(createSystemMessage(), ...input)
    else messages.push(createSystemMessage(input[0]), ...input.slice(1))
  }

  messages[messages.length - 1].content += '\n\nYOU NEED TO STRICTLY FOLLOW THE PARAMETERS TYPES YOU ARE GIVEN. YOU NEED TO STRICTLY FOLLOW THE PARAMETERS TYPES YOU ARE GIVEN! DO NOT FORGET THIS - IT IS VERY IMPORTANT THAT YOU GET THIS RIGHT\nHERE IS THE TYPE OF THE PARAMETERS YOU NEED TO ANSWER WITH:\n\n' + extractor.map(param => `${param.name}: ${param.type}`).join('\n')
  
  const tool = toOAItool(extractor)

  let model
  // TODO: implement the retry validation strategy!
  let validationStrategy = config?.validation_strategy ?? null
  if (config?.validation_strategy) delete config.validation_strategy
  let ignoreValidation = validationStrategy === 'ignore'
  if (config?.model) {
    model = config.model
    delete config.model
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
      temperature: 0,
      tool_choice: {
        type: 'function',
        function: {
          name: tool.function.name
        }
      },
      tools: [tool],
    }
  }
  
  const gen = getFunctionCompletionGen(messages as any, [extractor2action(extractor)], llmconfig as any, trace)
  let result = await gen.next()

  let value = result.value as FunctionReturn
  let llmDone = false

  const processLLMstream = async () => {
    while (!result.done) {
      value = result.value as FunctionReturn

      if (autoStream) {
        if (Array.isArray(value)) {
          stream(value[0]?.arguments)
        }
      }
      
      result = await gen.next()
    }
    llmDone = true
  }

  const promises = [processLLMstream()]

  while (!llmDone) {
    let val
    if (Array.isArray(value) && value.length > 0) {
      val = value[0]
    }
    yield val?.arguments as ReasonStreamReturn<T>

    /* the reason this is needed is to make sure the user `for await (... of reasonStream()) {}`
      does not starve the event loop — blocking all I/O.
      
      by waiting for a promise that resolves in the next `timers` phase of the event loop
      we make sure all I/O is processed before this loop runs again. */
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  let val
  if (Array.isArray(value) && value.length > 0) {
    val = value[0]
  }
  yield val?.arguments as ReasonStreamReturn<T>

  await Promise.all(promises)

  // TODO
  if (!ignoreValidation && (Array.isArray(result.value) || result.value.type === 'text+function')) {
    let fnCall
    if (Array.isArray(result.value)) {
      fnCall = {
        name: result.value[0].name,
        arguments: JSON.stringify(result.value[0].arguments)
      }
    } else {
      fnCall = {
        name: result.value.actions[0].name,
        arguments: JSON.stringify(result.value.actions[0].arguments)
      }
    }

    try {
      const oaiResponse: ToolResponse = {
        type: 'function',
        id: '',
        function: {
          name: fnCall.name,
          arguments: fnCall.arguments,
        }
      }
      validateOAIfunction(oaiResponse, [extractor2action(extractor)])
    } catch (err) {
      trace.err(err)
      if (err instanceof ReasonError) {
        const debuginfo = { err: err.message, modelOutput: result.value, input: messages, llmconfig }
        throw new ThinkError(`${err.message} — OpenAI model did not returned a valid response in the format you specified in the \`think<type>()\` function call.\n\nThis can happen for a few reasons:\n1) The format you want is too complex — try simplifying it;\n2) Try enhancing the descriptions of each parameter and your overall prompt;\n3) If you are using gpt-3.5-turbo, try using gpt-4.`, err.code, debuginfo)
      }

      throw err
    }
  }

  if (Array.isArray(result.value)) return result.value[0].arguments as T
  else if (result.value.type === 'text+function') return result.value.actions[0].arguments as T

  return result.value as T
}