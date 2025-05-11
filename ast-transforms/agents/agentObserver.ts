import { context as otelContext } from '@opentelemetry/api'
import IContext from "../../observability/context"
import { Trace } from "../../observability/tracer"
import asyncLocalStorage from "../../utils/asyncLocalStorage"

function createAsyncQueue() {
    const buffer: any[] = []
    let resolver: any
    let closed = false

    return {
        push(value: any, last = false) {        // normal yield or final return value
            if (closed) return
            if (resolver) {
                resolver({ value, done: false })
                resolver = null
            } else {
                if (last) buffer.push({ _internal_reason_done: true, value: value })
                buffer.push(value)
            }
        },
        close() {            // mark the iterator as finished
            closed = true
            if (resolver) resolver({ value: undefined, done: true })
        },
        [Symbol.asyncIterator]() { return this },
        async next() {
            if (buffer.length) return { value: buffer.shift(), done: false }
            if (closed) return { value: undefined, done: true }
            return new Promise(r => { resolver = r })
        }
    }
}

function isGenerator(fn: any) {
    if (typeof fn !== 'function') return false;

    // The ES spec gives generator constructors these names
    const ctorName = fn.constructor ? fn.constructor.name : '';
    return ctorName === 'GeneratorFunction' || ctorName === 'AsyncGeneratorFunction';
}

export default function agentObserver(fn: Function) {
  if (isGenerator(fn)) {
	  return async function* (...args: any[]) {
      const stream = createAsyncQueue()

      async function run(push: any) {
                const context = asyncLocalStorage.getStore() as IContext

                const trace = new Trace(context, `[AGENT] ${fn.name}`, 'agent')
                return trace.startActiveSpan(async function (span: any) {
                    trace.addAttribute('agent.name', fn.name)
                    trace.addAttribute('agent.input', args)

                    let output
                    const currentOtelContext = otelContext.active()
                    const newOtelContext = currentOtelContext.setValue(Symbol('trace'), trace).setValue(Symbol('otel-context'), currentOtelContext)
                    await otelContext.with(newOtelContext, async () => {
                        try {
                            const gen = fn(...args)
                            let result = await gen.next()

                            while (!result.done) {
                                push(result.value)
                                result = await gen.next()
                            }
                            push(result.value, true)
                            output = result.value
                            return output
                        } catch (err) {
                            trace.err(err)
                            throw err
                        }
                    })

                    trace.addAttribute('agent.output', output)
                    trace.end()
                    return output
                })
            }

            // run secondary() concurrently
            run(stream.push.bind(stream))
                .finally(() => stream.close())

            // proxy everything (ordinary yields + final return value)
            // @ts-ignore-next-line
            for await (const v of stream) {
                if (typeof v === 'object' && '_internal_reason_done' in v && v._internal_reason_done) return v.value
                yield v
            }
	  }
  }

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
