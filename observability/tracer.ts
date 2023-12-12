import { SpanStatusCode, trace } from '@opentelemetry/api';
import type IContext from './context.d.ts';
import { Span } from '@opentelemetry/api';

const tracer = trace.getTracer('app', '1.0.0');

export default tracer

export function addAttribute(span: any, key: string, value: any) {
  function setSpanAttribute(obj: any, currentKey: string) {
      if (typeof obj === 'object' && obj !== null) {
          for (const [subKey, subValue] of Object.entries(obj)) {
              setSpanAttribute(subValue, `${currentKey}.${subKey}`);
          }
      } else {
          span.setAttribute(currentKey, obj);
      }
  }

  setSpanAttribute(value, key);
}

type TraceTypes =
  'normal-llm-call'
  | 'entrypoint'
  | 'extractor-llm-call'
  | 'agent-llm-call'
  | 'agent'
  | 'agent-step'
  | 'action'

export class Trace {
  public span!: Span
  public tracer: any
  private context: IContext;
  private id?: string;
  private name: string;
  private type: TraceTypes;
  private isCustomServer: boolean = false;

  constructor(context: IContext, name: string, type: TraceTypes) {
    if (!name) name = 'app'
    this.tracer = trace.getTracer(name, '1.0.0');

    this.name = name
    this.type = type
    this.context = context

    if (!context) this.isCustomServer = true
  }

  private registerSpan() {
    if (this.isCustomServer) return

    const id = this.span.spanContext().spanId
    this.id = id
    this.context.spans[id] = this.span
  }

  err(err: any) {
    if (this.isCustomServer) return

    this.span.setStatus({ code: SpanStatusCode.ERROR, message: err?.message  })
    this.end()
  }

  end() {
    if (this.isCustomServer) return

    if (this.id) {
      delete this.context.spans[this.id]
    }
    this.span.end()
  }

  async startActiveSpan(fn: Function) {
    if (this.isCustomServer) {
      let result = await fn({ name: 'empty-span' })
      return result
    }

    return this.tracer.startActiveSpan(this.name, async (span: any) => {
      this.span = span
      this.registerSpan()
      this.addAttribute('reason.type', this.type)

      let result = await fn(span)
      return result
    })
  }
  
  startActiveSpanSync(fn: Function) {
    if (this.isCustomServer) {
      let result = fn({ name: 'empty-span' })
      return result
    }

    return this.tracer.startActiveSpan(this.name, (span: any) => {
      this.span = span
      this.registerSpan()
      this.addAttribute('reason.type', this.type)

      let result = fn(span)
      return result
    })
  }

  addAttribute(key: string, value: any) {
    if (this.isCustomServer) return

    this.setSpanAttribute(value, `_${key}`);
  }

  setSpanAttribute(obj: any, currentKey: string, attributes: Record<string, any> = {}) {
    if (this.isCustomServer) return

    if (typeof obj === 'object' && obj !== null) {
      for (let [subKey, subValue] of Object.entries(obj)) {
        if (Array.isArray(obj)) {
          subKey = `[${subKey}]`
        }
        this.setSpanAttribute(subValue, `${currentKey}.${subKey}`);
      }
    } else {
      this.span.setAttribute(currentKey, obj);
    }
  }

  getOTELattributes(obj: any, currentKey: string, attributes: Record<string, any> = {}) {
    if (this.isCustomServer) return

    if (typeof obj === 'object' && obj !== null) {
      for (let [subKey, subValue] of Object.entries(obj)) {
        if (Array.isArray(obj)) {
          subKey = `[${subKey}]`
        }
        this.getOTELattributes(subValue, `${currentKey}.${subKey}`);
      }
    } else {
      attributes[currentKey] = obj;
    }

    return attributes
  }
}