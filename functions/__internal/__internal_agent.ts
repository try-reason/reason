import { Context, context as otelContext } from '@opentelemetry/api'
import c from 'ansi-colors'
import IContext from '../../observability/context.js'
import { OAIFunction } from '../../services/getChatCompletion'
import getFunctionCompletionGen, { LLMConfig } from '../../services/getFunctionCompletion'
import type ActionConfig from '../../types/actionConfig.d.ts'
import type AgentConfig from '../../types/agentConfig.d.ts'
import type {Action, default as IAgent, Message, ReasonActionReturn, ReasonTextReturn} from '../../types/iagent.d.ts'
import type Streamable from '../../types/streamable.d.ts'
import asyncLocalStorage from '../../utils/asyncLocalStorage'
import action2OAIfunction from '../../utils/oai-function'
import ReasonError from '../../utils/reasonError.js'
import stream from '../stream'
import { Trace } from '../../observability/tracer'
import isDebug from '../../utils/isDebug'
import { openaiConfig } from '../../configs/openai.js'
import { OAITool } from '../../services/openai/getChatCompletion.js'
import fs from 'node:fs'
interface REASON__INTERNAL__INFO {
  type: 'action'
  name: string
  filepath: string
  prompt: string
  parameters: {
    order: number;
    name: string
    type: string
    prompt: string
    required: boolean
  }[]
}

interface REASON__INTERNAL__AGENT__INFO {
  type: 'agent'
  filepath: string;
  name: string
  prompt: string
}

interface InternalAgentAction {
  name: string;
  handler: (...args: any[]) => any;
  streamable?: (...args: any[]) => any;
  config?: ActionConfig
  prompt: string;
  parameters: {
    order: number;
    name: string;
    type: string;
    prompt: string;
    required: boolean;
  }[];
}

interface StepAction extends ReasonActionReturn {
  actions: (Action & {id: string})[]
}

type Step = StepAction | ReasonTextReturn

// TODO: create `stop()` method
class Agent implements IAgent {
  private trace: Trace;
  private otelContext: Context;

  private actions: InternalAgentAction[];
  private info: REASON__INTERNAL__AGENT__INFO;
  private memoryID!: string;
  private _messages: Message[];
  private config?: AgentConfig;

  private answerToAction?: string
  private _stop = false
  private steps: Step[] = []

  private db: Record<string, any> = {}

  constructor(info: REASON__INTERNAL__AGENT__INFO) {
    this.info = info;
    
    this.actions = [];
    this._messages = [];
    this.getDB()
    // open telemetry setup
    let trace: Trace | null = null
    const context = otelContext.active() as any
    for (const [key, value] of context._currentContext) {
      if (typeof(key) === 'symbol' && key.description === 'trace') {
        trace = value
        break
      }
    }
    if (!trace) {
      throw new ReasonError(`Could not find the trace in the current context.`, 1721, { otel_context: context, agent_info: info })
    }
    this.trace = trace
    
    let oldOtelContext: Context | null = null
    for (const [key, value] of context._currentContext) {
      if (typeof(key) === 'symbol' && key.description === 'otel-context') {
        oldOtelContext = value
        break
      }
    }
    if (!oldOtelContext) {
      throw new ReasonError(`Could not find the \`old_otel_context\` in the current context.`, 1721, { otel_context: context, agent_info: info })
    }
    this.otelContext = oldOtelContext
  }

  private getDB() {
    try {
      const db = fs.readFileSync('./agent-history.reason', 'utf8')
      this.db = JSON.parse(db)
    } catch {
      this.db = {}
    }
  }

  public stop() {
    this._stop = true
  }

  public messages = {
    getID: () => this.memoryID,
    get: () => this._messages,
    set: (messages: Message[]) => this._messages = messages,
    next: (message: string) => this.answerToAction = message
  }

  public async setup(actions: REASON__INTERNAL__INFO[], memoryID?: string) {
    await this.getAgentConfig()

    const promises = [
      this.buildMessages(memoryID),
      this._buildAgentActions(actions),
    ]

    await Promise.all(promises)

    this.trace.addAttribute('agent.actions', this.actions.map(action => action.name))
    this.trace.addAttribute('agent.config', this.config)
    this.trace.addAttribute('agent.instruction', this.info.prompt)
  }

  private async getAgentConfig() {
    const { config } = await import(this.info.filepath)

    if (config) {
      this.config = config

      if (this.config?.disableAutoSave === true) {
        console.log(`${c.gray.bold('RΞASON')} — ${c.cyan.italic(this.info.name)} has disabled auto save on. This means that the agent will not save the conversation history automatically.`);
      }
    }
  }

  private createMemoryID(): string {
    return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
  }

  private async buildMessages(memoryID?: string) {
    if (memoryID && !this.config?.disableAutoSave) {
      this.memoryID = memoryID
      await this.getMessagesHistory()
      return
    }

    this.memoryID = this.createMemoryID()
    this._messages.push(this.systemMessage())
  }

  private async getMessagesHistory() {
    return this.db[this.memoryID]
  }

  private async _buildAgentActions(actions: REASON__INTERNAL__INFO[]): Promise<void> {
    for (let a of actions) {
      const {default: handler, config, streamable} = await import(a.filepath)
      let action = {
        ...a,
        handler,
        config,
        streamable
      }

      this.actions.push(action)
    }
  }

  private setupReason(prompt: string, state?: Record<string, any>) {
    this._messages.push(this.userMessage(prompt))

    let llmconfig: any = {
      config: {
        tools: this.actions.map(action => this.action2OAIfunction(action)),
        temperature: this.config?.temperature,
      },
      model: this.config?.model || openaiConfig.defaultModel,
    }

    if (this.actions.length === 0) {
      delete llmconfig.config.functions
    }

    // for (let action of this.actions) {
    //   if (action.streamable) {
    //     action.streamable = action.streamable(state)
    //   }
    // }

    return llmconfig
  }

  private shouldAgentStop() {
    if (this.config?.max_turns && this.steps.length >= this.config.max_turns) {
      return true
    }

    if (this._stop) {
      return true
    }

    return false
  }

  private shouldStreamText() {
    if (this.config?.streamText === false) {
      return false
    }

    return true
  }

  private async handleStreamable(action: InternalAgentAction, args: Record<string, Streamable<any>>) {
    if (!action.streamable) return
    
    const argsRightOrder = this.correctOrder(action, args)
    return action.streamable(...argsRightOrder)
  }

  /**
   * this functions processes a single agent turn — it does everything that a single turn should do: it streams the action usage (if its not disabled), it gets the action output, and it returns a turn object
   * @param llmconfig the LLM config
   * @returns a turn object
   */
  private async processSingleTurn(llmconfig: LLMConfig, trace: Trace): Promise<Step> {
    this.debugLog(`[!] ${this.info.name} agent is about to call the LLM with the following messages:`, this._messages);

    // console.log(`${c.gray.bold('RΞASON')} — ${c.cyan.italic(this.info.name)} has disabled auto save on. This means that the agent will not save the conversation history automatically.`);
    
    let step: Step = ({
      actions: null,
      message: null
    } as unknown) as Step
    this.steps.push(step)

    let chosenAction: InternalAgentAction[] = []

    let hasStreamableFnBeenUsed = false

    const context = asyncLocalStorage.getStore() as IContext
    const llmTrace = new Trace(context, `LLM call`, 'agent-llm-call')
    llmTrace.startActiveSpan((span: any) => {})
    
    const gen = getFunctionCompletionGen(this._messages, this.actions, llmconfig, llmTrace)
    let result = await gen.next()
    while (!result.done && !hasStreamableFnBeenUsed) {
      let { value } = result

      // handle when LLM just returns a pure text messaage
      if (!Array.isArray(value) && value.type === 'text') {
        if (!step.message) step.message = { done: false } as any
        step.message!.content = value.content
        
        if (this.shouldStreamText()) stream({ steps: this.steps })
      }

      // handle when LLM selects an action
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          let val = value[i]
          if (step.message) {
            // if the LLM has previously return a text message, and now has selected a function — we can infer that the previous text message is `done`
            step.message.done = true
          }

          // get chosen action when LLM has selected one
          if (val.name && !chosenAction[i]) {
            let name = val.name
            let chosenAction1 = this.actions.find(action => action.name === name) ?? null
            if (!chosenAction1) throw new ReasonError(`LLM selected an action that did not exist — it tried to use ${val.name} action, which do not exist.`, 1710, { val, actions: this.actions, agent: this.info })

            chosenAction[i] = chosenAction1

            if (!step.actions) step.actions = [] as any
    
            step.actions!.push({} as any)
            step.actions![i].name = val.name
          }
  
          if (step.actions !== null && step.actions[i]) {
            if (val.id) {
              step.actions[i].id = val.id
            }
            step.actions[i].input = val.arguments
          }
          
          // handle streamable function from action — if there is one
          if (chosenAction[i]?.streamable) {
            let output = await this.handleStreamable(chosenAction[i], val.arguments)
            if (output !== undefined && output !== null) {
              step.actions![i].output = output
              hasStreamableFnBeenUsed = true
            }
          }
    
          // BUG: if multiple actions are returned and one as streamActionUsage: false while the others have it true,
          // we will stream the usage of all actions :(
          // stream action usage — unless its disabled
          if (chosenAction[i]?.config?.streamActionUsage === undefined || chosenAction[i]?.config?.streamActionUsage === true) {
            stream({ steps: this.steps })
          }
        }
      }

      result = await gen.next()
    }

    llmTrace.end()

    // call the selected action handler to get its output — if the action has returned an output before this will not even be reached
    if (chosenAction.length > 0 && step.actions && (Array.isArray(result.value)|| result.value.type === 'text+function')) {
      let llmFunctionReturn
      
      if (!Array.isArray(result.value) && result.value.type === 'text+function') llmFunctionReturn = result.value.actions
      else llmFunctionReturn = result.value

      const promises = []

      for (let i = 0; i < llmFunctionReturn.length; i++) {
        let fnReturn = llmFunctionReturn[i]
        let chAction = chosenAction[i]

        this.debugLog(`[!] about to call the handler of ${fnReturn.name} with arguments:`, fnReturn);
        const args = this.correctOrder(chAction, fnReturn.arguments)
        this.debugLog('args', args);
        
        
        promises.push(
          (async () => {
            step.actions![i].output = await chAction.handler(...args)

            // stream action output — unless its disabled
            if (chAction?.config?.streamActionUsage === undefined || chAction?.config?.streamActionUsage === true) {
              stream({ steps: this.steps })
            }

            step.actions![i].output = step.actions![i].output
            step.actions![i].input = fnReturn.arguments
            step.actions![i].name = chAction.name
          })()
        )
      }

      await Promise.all(promises)

      return step
    }

    if (!Array.isArray(result.value) && result.value.type === 'text' && step.message) {
      step.message.done = true
      if (this.shouldStreamText()) stream({ steps: this.steps})

      return step
    }

    throw new ReasonError(`LLM did not select an action.`, 1711, { actions: this.actions, agent: this.info, result })
  }

  private action2OAIfunction(action: InternalAgentAction): OAITool {
    let fn = action2OAIfunction(action)

    return fn
  }

  private createLLMresponse(id: string, actionName: string, output: any): Message {
    return {
      role: 'tool',
      tool_call_id: id,
      name: actionName,
      content: JSON.stringify(output)
    }
  }

  private correctOrder(action: InternalAgentAction, args: Record<string, any>): any[] {
    let orderedArgs: any[] = []

    for (let param of action.parameters) {
      orderedArgs[param.order] = args[param.name]
    }

    return orderedArgs
  }

  private async saveMessages() {
    if (this.config?.disableAutoSave) {
      return
    }

    try {
      this.db[this.memoryID] = this._messages
      fs.writeFileSync('./agent-history.reason', JSON.stringify(this.db), 'utf8')
    } catch (err: any) {
      throw new ReasonError(`Tried saving your agent chat history but something failed. Error: ${err?.message}`, 1729, { agentInfo: this.info, messages: this._messages, err, memoryID: this.memoryID })
    }
  }

  private addStep2Messages(step: Step) {
    let message: any = {
      role: 'assistant',
      content: step.message?.content ?? null
    }



    if (step.actions) {
      // step.actions[0].
      message.tool_calls = []
      for (const action of step.actions) {
        message.tool_calls.push({
          id: action.id,
          type: 'function',
          function: {
            name: action.name,
            arguments: JSON.stringify(action.input)
          }
        })
      }
    }

    this._messages.push(message)
  }

  private debugLog(...args: any[]) {
    if (isDebug) {
      console.log(...args);
    }
  }

  private shouldSendMemoryID() {
    if (this.config?.sendMemoryID === false || this.config?.disableAutoSave === true) {
      return false
    }

    return true
  }

  public async *reason(prompt: string, state?: any) {
    this.debugLog(`[!] ${this.info.name} agent is starting to RΞASON!`);

    console.log(`${c.gray.bold('RΞASON')} — ${c.cyan.italic(this.info.name)} ${this.info.name.toLowerCase().includes('agent') ? '' : 'agent '}is starting...`);

    if (this.shouldSendMemoryID()) {
      stream({ memory_id: this.memoryID })
    }

    const llmconfig = this.setupReason(prompt, state)

    while (!this.shouldAgentStop()) {
      let step: Step = await otelContext.with(this.otelContext, async () => {
        const context = asyncLocalStorage.getStore() as IContext
        const trace = new Trace(context, `[${this.info.name}] step ${this.steps.length + 1}`, 'agent-step')
        return trace.startActiveSpan(async (span: any) => {
          trace.addAttribute('step.input', this._messages[this._messages.length - 1])

          this.debugLog(`[!] ${this.info.name} agent is about to process a single turn!`);
          let step = await this.processSingleTurn(llmconfig, trace)
          this.debugLog(`[!] ${this.info.name} agent FINISHED the turn!`);
          
          if (step.message) {
            trace.addAttribute('step.llm.message', step.message.content)
          }
          if (step.actions) {
            trace.addAttribute('step.llm.actions.name', step.actions)
          }
          if (step.message && !step.actions) {
            trace.addAttribute('step.output', step.message.content)
          }

          trace.end()
          return step
        })
      })

      this.addStep2Messages(step)
      this.saveMessages()

      yield step

      if (step.message) {
        if (!this.answerToAction) {
          this._messages.push({ role: 'assistant', content: step.message.content })
          continue

          // should stop agent
          break
        }

        this._messages.push({ role: 'user', content: this.answerToAction })
        continue
      }

      let nextMessages = []
      for (const action of step.actions) {
        let nextMessage = this.createLLMresponse(action.id, action.name, action.output)
        nextMessages.push(nextMessage)
      }
      if (this.answerToAction && nextMessages.length === 1) {

        nextMessages[0].content = this.answerToAction
        this.answerToAction = undefined
      }

      this._messages.push(...nextMessages)
      this.saveMessages()
    }
  }

  public async run(prompt: string, state?: any) {
    for await (const step of this.reason(prompt, state)) {
      if (!step.actions) {
        this.stop()
        return step.message.content
      }
    }

    throw new ReasonError(`The agent ${this.info.name} has finished but it did not return an answer.`, 1786, { agent: this.info, steps: this.steps })
  }

  private systemMessage(): Message {
    return {
      role: 'system',
      content: this.info.prompt
    }
  }

  private userMessage(content: string): Message {
    return {
      role: 'user',
      content
    }
  }
}

export default async function __internal_DO_NOT_USE_useAgent(agent: REASON__INTERNAL__AGENT__INFO, actions: REASON__INTERNAL__INFO[], memoryID?: string) {
  const a = new Agent(agent)
  await a.setup(actions, memoryID)

  return a
}
