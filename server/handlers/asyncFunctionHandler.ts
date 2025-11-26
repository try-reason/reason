import IContext from "../../observability/context"
import { Trace } from "../../observability/tracer"
import { IEntrypoint } from "../entrypoints"

export function isGenerator(gen: any) {
  try {
      if (!gen) return false;
      return typeof gen.next === 'function' && typeof gen.throw === 'function' && typeof gen.return === 'function';
  } catch {
      return false
  }
}

export default async function asyncFunctionHandler(context: IContext, req: Request, entrypoint: IEntrypoint): Promise<Response> {
  const handler = entrypoint.handler
  let body = {}
  if (req.headers.get('content-type')?.includes('application/json')) body = await req.clone().json()

  const tracer = new Trace(context, entrypoint.serverPath, 'entrypoint')

  return await tracer.startActiveSpan(async (span: any) => {
    context.span = span
    tracer.addAttribute('entrypoint.request.body', body)

    try {
      const result = await handler(req)

      if (isGenerator(result)) {
        throw new Error(`The entrypoint ${entrypoint.serverPath} returned a generator, however this is not supported as this is not a streaming entrypoint. To make it a streaming generator declare like: \`async function* someName() {}\`.\n\n Learn more at https://docs.tryreason.dev/docs/essentials/entrypoints#types-of-entrypoints\n\n(Error code: 994)`)
      }

      tracer.addAttribute('entrypoint.response', result)
      tracer.end()
      if (result instanceof Response) {
        return result
      }
      if (typeof result === 'object') {
        // res.json(result)
        return new Response(JSON.stringify(result), {
          headers: {
            'Content-Type': 'application/json'
          }
        })
      }
      else if (typeof result === 'string') {
        // res.send(result + '\n')
        return new Response(result + '\n', { headers: {
          'Content-Type': 'text/html'
        } })
      }
      else {
        // res.send(result.toString)
        return new Response(result.toString(), { headers: {
          'Content-Type': 'text/html'
        } })
      }
    } catch (e: any) {
      tracer.err(e)
      if (e.message) console.error(`[ERROR] ${entrypoint.serverPath}: ${e?.message}`);
      else console.error(`[ERROR] ${entrypoint.serverPath}: ${e}`);
      // res.status(500).send('Internal Server Error')
      return new Response('Internal server error', { status: 500 })
    }
  })
}
