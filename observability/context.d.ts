interface ILLMCallInfo {
  prompt: 'OpenAI';
  model: string;
  prompt: string;
  completion: string;
  temperature: number;
  tokens_usage: {
    prompt: number;
    completion: number;
    total: number;
  }
  timestamps: {
    start: Date;
    end?: Date;
  }
}

interface IAction {
  id: string;
  name: string;
  input: unknown;
  output: unknown;
  timestamps: {
    start: Date;
    end?: Date;
  }
  actions: IAction[];

  llm_calls?: ILLMCallInfo[];
  tokens_usage?: {
    prompt: number;
    completion: number;
    total: number;
  }
  
  // internal fields that REASON needs — will be striped before sending to the observability service
  __internal_done: boolean;
}

interface IContext extends IAction {
  id: string;
  entrypointName: string;
  span: any;
  spans: Record<string, any>;
  url: string;
  headers: Record<string, unknown>;
  body: unknown;
  currentAction: IAction;
  stop?: boolean;
  hasErrored?: boolean;
  stream?: {
    send: (data: string | Record<string, any>, cb?: Function) => void;
  };
}

export default IContext

export type { IAction, ILLMCallInfo }


// there is no current *global* action
// what there is is current executing actions
// and for a given context there is only one current action being executed at a time
