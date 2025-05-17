import useAgent from "./agent"
import reason, { ReasonStreamReturn, reasonStream } from "./think"
import stream from "./stream"

import __internal_DO_NOT_USE_think, { __internal_DO_NOT_USE_thinkStream } from "./__internal/__internal_think"
import __internal_DO_NOT_USE_useAgent from "./__internal/__internal_agent"
import ReasonConfig from "../types/reasonConfig"
import AgentConfig from "../types/agentConfig"
import ActionConfig from "../types/actionConfig"
import asyncLocalStorage from "./async-local-storage"

function useAgentState(): Record<string, any> {
  return {}
}

export {
  asyncLocalStorage,
  useAgent,
  reason,
  reasonStream,
  stream,
  __internal_DO_NOT_USE_think as __internal_DO_NOT_USE_reason,
  __internal_DO_NOT_USE_thinkStream as __internal_DO_NOT_USE_reasonStream,
  __internal_DO_NOT_USE_useAgent,
  ReasonConfig,
  AgentConfig,
  ActionConfig,
  ReasonStreamReturn,
  useAgentState,
}
