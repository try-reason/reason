import StreamableObject from "../functions/__internal/StremableObject.js";
import ReasonError from "../utils/reasonError.js";

const dividerStart = `!@#$12ka@a3sll_START`
const dividerEnd = `!@#$12ka@a3sll_END`
const errorIdentifier = `!@#$12ka@a3sll_ERROR`

type PrimitiveTypes = 'string' | 'number' | 'boolean'

// we only send the primitive values (as they are the one with deltas)
// the frontend will then decode the deltas and apply them to the internal object
interface Delta {
  // e.g. "user.emails[0]", "rationale", "related_sites[2]", etc.
  path: string;
  type: PrimitiveTypes;
  // all values are sent as strings no matter what — the frontend will decode then as the appropriate type
  delta: string;

  override?: boolean;
}

export default class StreamEncoder {
  public internalObj: any = {}
  private count = 1

  constructor() { }

  public encodeDeltas(deltas: Delta[]): string {
    let encodedValue = JSON.stringify(deltas, null, 0)
    // TODO: add counting logic to always maintain order in the arrived deltas in the frontend
    // encodedValue = dividerStart + `${this.count}-` + encodedValue + dividerEnd
    encodedValue = dividerStart + encodedValue + dividerEnd

    return encodedValue
  }

  public encodeError(): string {
    return errorIdentifier
  }

  // receives the yielded value and returns the delta to be streamed
  public encode(obj: Record<string, any>): Delta[] {
    obj = this.deepClone(obj)
    obj = this.removeStremableMetadata(obj)
    const deltas = this.getDeltas(this.internalObj, obj);
    this.updateInternalObject(obj);

    return deltas;
  }

  private path2value(obj: Record<string, any> | any[], path: string): any {
    try {
      if (path === '') {
        return obj
      }

      const parts = path.split('.')
      for (let part of parts) {
        if (typeof obj !== 'object') {
          throw new ReasonError(`Error while encoding your value to send it. Expected object or array but got ${typeof obj} in path ${path}`, 950, { obj, path })
        }

        if (obj === null) return null

        if (part.startsWith('[') && part.endsWith(']')) {
          if (obj === null) return null

          if (!Array.isArray(obj)) {
            throw new ReasonError(`Error while encoding your value to send it. Expected array but got ${typeof obj} in path ${path}`, 951, { obj, path })
          }

          // array
          const index = parseInt(part.slice(1, -1))
          if (obj.length <= index) {
            return null
          }

          obj = obj[index]
        } else {
          // object
          if (Array.isArray(obj)) {
            throw new ReasonError(`Error while encoding your value to send it. Expected \`object\` but got \`array\` in path \`${path}\``, 952, { obj, path, parts, part })
          }

          if (obj.hasOwnProperty(part) === false) {
            return null
          }

          obj = obj[part]
        }
      }

      return obj
    } catch (err) {
      if (err instanceof ReasonError) {
        throw err
      } else {
        throw new ReasonError(`Error while encoding your value to send it.`, 957, { obj, path })
      }
    }
  }

  private processDelta(path: string, newObj: any, oldObj: any, deltas: Delta[]): void {
    try {
      let newVal = this.path2value(newObj, path)

      // primitive values should always be sent as deltas
      if (typeof (newVal) === 'string' || typeof (newVal) === 'number' || typeof (newVal) === 'boolean') {
        // primitive value
        let oldVal = this.path2value(oldObj, path)

        if (oldVal === null) {
          // new value
          deltas.push({
            path: path,
            type: typeof (newVal) as PrimitiveTypes,
            delta: newVal.toString()
          })

          return
        }

        if (typeof (oldVal) !== typeof (newVal) && oldVal !== null) {
          // different types
          deltas.push({
            path: path,
            type: typeof (newVal) as PrimitiveTypes,
            delta: String(newVal),
            override: true
          });
          return

          // we used to not allow for types to be changed, but we do now
          // *however* will still let this unreachable code here in case we want to revert back to the old behavior
          throw new ReasonError(`You cannot change the type of a value you have previously yielded.\n\nFor instance, if you yield \`{ 'age': 10 }\`, you cannot later yield \`{ 'age': '100' }\` because you would be changing the type of the value.\nAnd you changed the type of ${path} from ${typeof (oldVal)} to ${typeof (newVal)}`, 954, { oldVal, newVal, path, oldObj, newObj })
        }

        if (oldVal === newVal) {
          // same value
          return
        }

        if (!String(newVal).startsWith(String(oldVal))) {
          // completely different values — should overwrite
          deltas.push({
            path: path,
            type: typeof (newVal) as PrimitiveTypes,
            delta: String(newVal),
            override: true
          })

          return
        }

        // different values — should delta
        deltas.push({
          path: path,
          type: typeof (newVal) as PrimitiveTypes,
          delta: this.getStringDifference(String(oldVal), String(newVal))
        })

        return
      }

      if (typeof (newVal) !== 'object') {
        throw new ReasonError(`You can only use JSON-serializable types in your returned/yielded value when your entrypoint is in stream mode (i.e.: is a Generator). When returning/yielding \`${path}\` the type of that value was \`${typeof (newVal)}\` — which is invalid.`, 955, { newVal, path, oldObj, newObj })
      }

      if (newVal === null) return

      deltas.push(...this.getDeltas(oldObj, newObj, path))
    } catch (err: any) {
      if (err instanceof ReasonError) {
        err.debug_info = { ...err.debug_info, processDeltaPath: path, oldObj, newObj }
        throw err
      } else {
        throw new ReasonError(`Error while encoding your value to stream it to your client.`, 956, { path, oldObj, newObj, errMessage: err?.message })
      }
    }
  }

  private deepClone(obj: Record<string, any>, hash = new WeakMap()) {
    if (obj === null) return null; // it's important to check for null before typeof as null is an object in JS
    if (typeof obj !== 'object') return obj; // primitives are returned as-is

    // Check hash map for cyclic structures
    if (hash.has(obj)) return hash.get(obj);

    let clonedObj: any;
    if (Array.isArray(obj)) {
      // Clone array
      clonedObj = [];
      hash.set(obj, clonedObj);
      for (let i = 0; i < obj.length; i++) {
        clonedObj[i] = this.deepClone(obj[i], hash);
      }
    } else {
      // Clone object
      clonedObj = Object.create(Object.getPrototypeOf(obj));
      hash.set(obj, clonedObj);
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key], hash);
        }
      }
    }

    return clonedObj;
  }

  private getDeltas(oldObj: Record<string, any>, newObj: Record<string, any>, path = ''): Delta[] {
    const deltas: Delta[] = [];

    let val = this.path2value(newObj, path)
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        let currentPath = `${path}.[${i}]`
        this.processDelta(currentPath, newObj, oldObj, deltas)
      }
      return deltas
    }

    // if (val instanceof StreamableObject) val = val.value

    const keys = Object.keys(val);
    for (let key of keys) {
      let currentPath = path !== '' ? `${path}.${key}` : key
      this.processDelta(currentPath, newObj, oldObj, deltas)
    }

    return deltas;
  }

  // remove the metadata that we add to the object to make it streamable in a NEW object with no reference to the old
  private removeStremableMetadata(obj: any) {
    if (obj instanceof StreamableObject) {
      if (Array.isArray(obj.value)) {
        for (let i = 0; i < obj.value.length; i++) {
          if (obj.value[i] instanceof StreamableObject) {
            obj.value[i] = this.removeStremableMetadata(obj.value[i]);
          }
        }
        return obj.value;
      }
      if (typeof obj.value === 'object') {
        for (let key in obj.value) {
          if (obj.value[key] instanceof StreamableObject) {
            obj.value[key] = this.removeStremableMetadata(obj.value[key]);
          }
        }
        return obj.value
      }
      return obj.value
    }
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      for (let key in obj) {
        obj[key] = this.removeStremableMetadata(obj[key]);
      }
    }
    else if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        obj[i] = this.removeStremableMetadata(obj[i]);
      }
    }
    return obj;
  }

  private getStringDifference(oldStr: string, newStr: string): string {
    // This is a simple implementation that returns the difference
    // at the end of the strings. More advanced diff algorithms can be used.
    let i = 0;
    while (i < oldStr.length && i < newStr.length && oldStr[i] === newStr[i]) {
      i++;
    }
    return newStr.slice(i);
  }

  private updateInternalObject(obj: Record<string, any>) {
    // Deep merge `obj` into `this.internalObj`
    this.internalObj = this.deepMerge(this.internalObj, obj);
  }

  private deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
    for (const key in source) {
      if (typeof source[key] === 'object' && source[key] !== null && target[key]) {
        target[key] = this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }
}