import { context as otelContext } from '@opentelemetry/api'
import IContext from "../../observability/context"
import { Trace } from "../../observability/tracer"
import asyncLocalStorage from "../../utils/asyncLocalStorage"

export default function agentObserver(fn: Function) {
  return async function (...args: any[]) {
    const context = asyncLocalStorage.getStore() as IContext

    const trace = new Trace(context, `[AGENT] ${fn.name}`, 'agent')
    return trace.startActiveSpan(async (span: any) => {
      trace.addAttribute('agent.name', fn.name)
      trace.addAttribute('agent.input', args)

      let result
      const currentOtelContext = otelContext.active()
      const newOtelContext = currentOtelContext.setValue(Symbol('trace'), trace).setValue(Symbol('otel-context'), currentOtelContext)
      await otelContext.with(newOtelContext, async () => {
        try {
          result = await fn(...args)
        } catch (err) {
          trace.err(err)
          throw err
        }
      })
      
      trace.addAttribute('agent.output', result)
      trace.end()
      return result
    })
  }
}

// asyncStores[actionId] = asyncStore

// i could create a new store with a newly generated actionId
// but how would i be able to get that id in child actions?
// asyncStores have the nice property of literally only existing in the current execution context