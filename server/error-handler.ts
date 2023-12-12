import { SpanStatusCode } from '@opentelemetry/api';
import IContext from "../observability/context";
import asyncLocalStorage from "../utils/asyncLocalStorage";
import isDebug from "../utils/isDebug.js";
import ReasonError from "../utils/reasonError.js";

function stopAllSpans(context: IContext, err: any) {
  for (const span of Object.values(context.spans)) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: err?.message  })
    span.end()
  }
}

export default function errorhandler(err: any, ctx?: IContext) {
  let context: IContext

  if (!ctx) context = asyncLocalStorage.getStore() as IContext
  else context = ctx

  context.span?.setStatus({ code: SpanStatusCode.ERROR, message: err?.message  })
  context.span?.end()

  stopAllSpans(context, err)

  context.stop = true
  context.hasErrored = true

  console.error(`[ERROR ${context.entrypointName}]: ${err?.message}`);

  if (isDebug) {
    console.log('-------STACK TRACE-------');
    console.log(err?.stack);
  }
  
  if (err instanceof ReasonError) {
    if (isDebug) {
      console.log('-------ADDITIONAL INFORMATION-------');
      console.log(JSON.stringify(err.debug_info, null, 2));
    }

    return
  }

  console.error(err?.stack);
}