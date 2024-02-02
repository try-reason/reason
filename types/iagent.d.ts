export interface Action {
  name: string;
  input: Record<string, any>;
  output: any;
}

export interface LLMTextReturn {
  content: string;
  done: boolean;
}

export interface UserMessage {
  role: 'user' | 'system'
  content: string
}

export interface AssistantMessageText {
  role: 'assistant';
  content: string;
}

export interface FunctionResponseMessage {
  role: 'tool'
  tool_call_id: string;
  name: string
  content: string
}

export interface AssistantMessageAction {
  role: 'assistant';
  content: null;
  function_call: {
    name: string;
    arguments: string;
  }
}

type Message = UserMessage | AssistantMessageText | AssistantMessageAction | FunctionResponseMessage

export interface IMessages {
  functions?: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      required: string[]
      properties: Record<string, any>
    }
  }[];
  function_call?: {
    name: string;
  }

  messages: Message[]
}

export { Message }

export interface Prompt extends IMessage, OAIOptions {
  model: string;
}

export interface ReasonActionReturn {
  message: null;
}

export interface ReasonTextReturn {
  actions: null;
  message: LLMTextReturn;
}

export interface ReasonActionAndTextReturn {
  actions: Action[];
  message: LLMTextReturn;
}

export { ReasonTextReturn, ReasonActionReturn }

export default interface Agent {
  reason(prompt: string, state?: any): AsyncGenerator<ReasonActionReturn | ReasonTextReturn | ReasonActionAndTextReturn, void>
  run(prompt: string, state?: any): Promise<string>
  stop(): void
  messages: {
    next(message: string): void
    getID(): string;
    get(): Message[];
    set(messages: Message[]): void;
  }
}