import { Readable } from 'stream'
import { IEntrypoint } from "../entrypoints";
import StreamEncoder from "../StreamEncoder";
import asyncLocalStorage from "../../utils/asyncLocalStorage";
import IContext from "../../observability/context";
import ReasonError from "../../utils/reasonError.js";
import { Trace } from "../../observability/tracer";
import c from 'ansi-colors'
import errorhandler from '../error-handler';

function isGenerator(gen: any) {
  try {
      if (!gen) return false;
      return typeof gen.next === 'function' && typeof gen.throw === 'function' && typeof gen.return === 'function';
  } catch {
      return false
  }
}

export default async function asyncGeneratorHandler(req: Request, entrypoint: IEntrypoint): Promise<Response> {
  const context = asyncLocalStorage.getStore() as IContext
  const trace = new Trace(context, `${entrypoint.serverPath}`, 'entrypoint')
  
  return await trace.startActiveSpan(async (span: any) => {
    context.span = span
    trace.addAttribute('entrypoint.name', entrypoint.prettyName)
    trace.addAttribute('entrypoint.is_stream', true)
    trace.addAttribute('entrypoint.request.body', req.body)

    // res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  
    const encoder = new StreamEncoder()
  
    console.log(`${c.gray.bold('RΞASON')} — ${c.cyan.italic(entrypoint.method)} ${c.cyan.italic(entrypoint.serverPath)} was called and result will be streamed...`)
    let gen = entrypoint.handler(req)
  
    let rawStream: any = null
  
    let isReading = false

    const { readable, writable } = new TransformStream();

    const writer = writable.getWriter();

    (async () => {
      try {
        if (isReading) return
        isReading = true
        let wasStreamClosed = false
        writer.closed.then(() => wasStreamClosed = true)
        
        let result = await gen.next()
        let wasReturnGen = false
        if (result.done && isGenerator(result.value)) {
          wasReturnGen = true
          gen = result.value
          result = await gen.next()
        }
        while (!result.done && !wasStreamClosed) {
          let { value } = result
          if (value !== undefined && value !== null) {
            await sendData(value)
          }
          result = await gen.next();
        }

        if (!wasStreamClosed) {
          if (!wasReturnGen) {
            if (typeof (result.value) === 'string') {
              await sendData(result.value);
            } else if (result.value !== undefined && result.value !== null) {
              await sendData(result.value);
            }
        }
          writer.close()
          isReading = false
          trace.addAttribute('entrypoint.response', encoder.internalObj)
          trace.end()
          return
        }

        isReading = false
      } catch (err: any) {
        isReading = false
        if (err instanceof ReasonError && err.code === 1704) return

        if (!context.hasErrored) {
          errorhandler(err, context)
          await writer.write(encoder.encodeError())
          writer.close()
        }
        
        throw err
      }
    })();
  
    async function sendData(value: string | Record<string, any>) {
      try {
        if (context.stop) {
          return
        }
  
        if (rawStream === null) {
          if (typeof(value) === 'string') rawStream = true
          else rawStream = false
        }
    
        if (rawStream) {
          if (typeof(value) !== 'string') {
            throw new Error(`Expected a string but got ${typeof value}`)
          }
    
          await writer.write(value)
        } else {
          if (typeof(value) !== 'object') {
            throw new Error(`Expected an object but got ${typeof value}`)
          }
    
          const deltas = encoder.encode(value)
          const encodedValue = encoder.encodeDeltas(deltas)
  
          await writer.write(encodedValue)
        }
      } catch (err: any) {
        if (context.stop) return
  
        if (!context.hasErrored) {
          errorhandler(err, context)
          await writer.write(encoder.encodeError())
          writer.close()
        }
  
        if (err instanceof ReasonError) {
          err.debug_info = { ...err.debug_info, sendData_value: value }
        }
  
        throw err
      }
    }

    context.stream = {
      send: sendData,
    }
  
    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
    // readable.pipe(res)
  })
}