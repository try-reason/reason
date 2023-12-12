import http from 'http'
import url from 'url'
import c from 'ansi-colors'

import { IEntrypoint } from "./entrypoints";
import { getRequest, setResponse } from './fetch-standard';
import entrypointHandler from './handlers/entrypointHandler';

type HTTPMethods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

interface Route {
  handler: Function;
}

function isStreamEntrypoint(entrypoint: IEntrypoint) {
  return entrypoint.handler.constructor.name.includes('Generator');
}

export default class ReasonServer {
  entrypoints: IEntrypoint[]
  entrypointsRoutes: Record<string, IEntrypoint> = {}
  internalRoutes: Record<string, Function> = {}

  constructor(entrypoints: IEntrypoint[]) {
    this.entrypoints = entrypoints

    for (const entrypoint of entrypoints) {
      this.entrypointsRoutes[`${entrypoint.method}-${entrypoint.serverPath}`] = entrypoint
      console.log(`${c.gray.bold('RΞASON')} — ${c.cyan.italic(entrypoint.method)} ${c.cyan.italic(entrypoint.serverPath)} ${isStreamEntrypoint(entrypoint) ? 'is a streaming entrypoint and was ' : ''}registered...`);
    }

    this.setupInternalRoutes()
  }

  private setupInternalRoutes() {
    this.internalRoutes['GET-/__reason_internal__/entrypoints'] = () => {
      return new Response(JSON.stringify(this.entrypoints), {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
  }

  public async serve(port: number) {
    const server = http.createServer(async (req, res) => {
      this.handleRequest(req, res)
    })

    server.listen(port, () => {
      console.log(`${c.gray.bold('RΞASON')} — ✓ Ready at port ${c.cyan.italic(port.toString())}!`);
    })
  }

  private cors(res: Response, origin = '*') {
    const clone = res.clone()

    const headers = new Headers(clone.headers)

    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    headers.set('Access-Control-Allow-Headers', '*')
    // {
    //   'Access-Control-Allow-Origin': '*',
    //   'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    //   'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    // }

    return new Response(clone.body, {
      status: clone.status,
      statusText: clone.statusText,
      headers: headers
    })
  }

  private async handleOPTIONS(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    res.writeHead(204);
    res.end();
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const parsedUrl = url.parse(req.url!, true)
    const path = parsedUrl.pathname ?? ''
    const method = req.method?.toUpperCase() ?? ''

    if (method === 'OPTIONS') {
      return this.handleOPTIONS(req, res)
    }

    const request = await getRequest('http://localhost:1704', req, req.socket.remoteAddress)
    let response: Response | null = null

    const entrypoint = this.entrypointsRoutes[`${method}-${path}`]
    if (entrypoint) {
      response = await this.handleEntrypointRequest(entrypoint, request)
    }

    const internalRoute = this.internalRoutes[`${method}-${path}`]
    if (internalRoute) {
      response = await this.handleInternalRoute(internalRoute, request)
    }

    if (response) {
      response = this.cors(response)
      return await setResponse(res, response)
    }
    
    res.writeHead(404)
    res.end()
  }

  private async handleInternalRoute(fn: Function, req: Request): Promise<Response> {
    let response = await fn(req)
    if (!response) return new Response('REASON internal route did not return', { status: 500 })
    return response
  }

  private async handleEntrypointRequest(entrypoint: IEntrypoint, req: Request): Promise<Response> {
    return await entrypointHandler(entrypoint, req)
  }
}
