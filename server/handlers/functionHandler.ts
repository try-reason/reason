import IContext from "../../observability/context"
import { Trace } from "../../observability/tracer"
import { IEntrypoint } from "../entrypoints"

export default async function functionHandler(context: IContext, entrypoint: IEntrypoint, req: Request) {
  const handler = entrypoint.handler
  let body = {}
  if (req.headers.get('content-type')?.includes('application/json')) body = await req.clone().json()

  const tracer = new Trace(context, entrypoint.serverPath, 'entrypoint')
  
  return tracer.startActiveSpan((span: any) => {
    context.span = span

    tracer.addAttribute('entrypoint.request.body', body)

    try {
      const result = handler(req)
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