import createContext from '../../observability/createContext';
import tracer, { addAttribute } from '../../observability/tracer';
import asyncLocalStorage from '../../utils/asyncLocalStorage';
import { IEntrypoint } from '../entrypoints';
import asyncFunctionHandler from './asyncFunctionHandler';
import asyncGeneratorHandler from "./asyncGeneratorHandler";
import functionHandler from './functionHandler';

export default async function entrypointHandler(entrypoint: IEntrypoint, req: Request): Promise<Response> {
  const handler = entrypoint.handler

  const context = createContext(req, entrypoint.serverPath)

  let res: Response | null = null
  await asyncLocalStorage.run(context, async () => {
    try {
      switch(handler.constructor.name) {
        case 'Function': {
          res = await functionHandler(context, entrypoint, req)
          break
        }

        case 'AsyncFunction': {
          res = await asyncFunctionHandler(context, req, entrypoint)
          break
        }

        case 'AsyncGeneratorFunction': {
          res = await asyncGeneratorHandler(req, entrypoint)
          break
        }

        case 'GeneratorFunction': {
          res = await asyncGeneratorHandler(req, entrypoint)
          break
        }

        default: {
          res = new Response('Not implemented yet', { status: 422 })
          break
        }
      }
    } catch (err) {
      console.error(`There was an error while handling the request ${req.url}:`, err);
      res = new Response('Internal server error', { status: 500 })
      // TODO: add observability on this  
    }
  })
  if (!res) {
    res = new Response('Something weird happened', { status: 500 })
  }
  return res
}