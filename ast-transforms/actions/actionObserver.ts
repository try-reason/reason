import IContext from "../../observability/context"
import { Trace } from "../../observability/tracer"
import asyncLocalStorage from "../../utils/asyncLocalStorage"

const start: EventHandler = (fn: Function) => {
  // console.time(fn.name)
}

const end: EventHandler = (fn: Function) => {
  // console.timeEnd(fn.name)
}

const isStream: EventHandler = (fn: Function) => {
  // console.log(fn.name, ' is stream action!')
}

const streamNewByte: EventHandler = (fn: Function) => {
  // console.log(fn.name, ' new byte!')
}

type EventHandler = (...args: any[]) => void
const events = {
  'start': start,
  'end': end,
  'stream-detected': isStream,
  'stream-new-byte': streamNewByte,
}

function observe(event: keyof typeof events, ...args: any[]) {
  events[event](...args)
}

export default function actionObserver(fn: Function) {
  switch (fn.constructor.name) {
    case 'Function': {
      return function (...args: any[]) {
        const context = asyncLocalStorage.getStore() as IContext
        const trace = new Trace(context, `[ACTION] ${fn.name}`, 'action')
        
        return trace.startActiveSpanSync((span: any) => {
          trace.addAttribute('action.name', fn.name)
          trace.addAttribute('action.input', args)
          observe('start', fn)
          try {
            let result = fn(...args)

            trace.addAttribute('action.output', result)
            observe('end', fn)
            trace.end()
            return result
          } catch (err) {
            trace.err(err)
            throw err
          }
        })
      }
    }

    case 'AsyncFunction': {
      return async function (...args: any[]) {
        const context = asyncLocalStorage.getStore() as IContext
        const trace = new Trace(context, `[ACTION] ${fn.name}`, 'action')
        
        return trace.startActiveSpan(async (span: any) => {
          trace.addAttribute('action.name', fn.name)
          trace.addAttribute('action.input', args)
          trace.addAttribute('action.input', args)
          observe('start', fn)
          try {
            let result = await fn(...args)
            trace.addAttribute('action.output', result)
            observe('end', fn)
            trace.end()
            return result
          } catch (err) {
            trace.err(err)
            throw err
          }

        })
      }
    }

    // TODO: telemetry: how to observe this?
    case 'AsyncGeneratorFunction': {
      return async function* (...args: any[]) {
        observe('stream-detected', fn)
        observe('start', fn)

        const gen = fn(...args)
        let result = await gen.next()
        while (!result.done) {
          let { value, done } = result

          yield value

          result = await gen.next()
        }

        observe('end', fn)
        return result.value
      }
    }

    case 'GeneratorFunction': {
      return async function* (...args: any[]) {
        observe('stream-detected', fn)
        observe('start', fn)
        
        const gen = fn(...args)
        let result = gen.next()
        while (!result.done) {
          let { value, done } = result

          yield value

          result = gen.next()
        }

        observe('end', fn)
        return result.value
      }
    }
  }
}

// asyncStores[actionId] = asyncStore

// i could create a new store with a newly generated actionId
// but how would i be able to get that id in child actions?
// asyncStores have the nice property of literally only existing in the current execution context