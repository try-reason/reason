import ReasonError from "./ReasonError";

const dividerStart = `!@#$12ka@a3sll_START`
const dividerEnd = `!@#$12ka@a3sll_END`
const errorIdentifier = `!@#$12ka@a3sll_ERROR`

export {
  dividerStart,
  dividerEnd,
  errorIdentifier,
}

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

export default class StreamDecoder {
  public internalObj: Record<string, any> = {}

  constructor() {}

  private path2value(obj: Record<string, any> | any[], path: string): any {
    const parts = path.split('.')

    for (let part of parts) {
      if (typeof obj !== 'object') {
        throw new ReasonError(`Error while encoding your value to send it. Expected object or array but got ${typeof obj} in path ${path}`, 17950, { obj, path })
      }

      if (part.startsWith('[') && part.endsWith(']')) {
        if (obj === null) return null

        if (!Array.isArray(obj)) {
          throw new ReasonError(`Error while encoding your value to send it. Expected array but got ${typeof obj} in path ${path}`, 17951, { obj, path })
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
          throw new ReasonError(`Error while encoding your value to send it. Expected \`object\` but got \`array\` in path \`${path}\``, 17952, { obj, path, parts, part })
        }

        if (obj.hasOwnProperty(part) === false) {
          return null
        }

        obj = obj[part]
      }
    }

    return obj
  }

  private str2value(delta: Delta): any {
    switch(delta.type) {
      case 'boolean': {
        return delta.delta.toLowerCase() === 'true'
      }

      case 'number': {
        return parseFloat(delta.delta)
      }

      case 'string': {
        return delta.delta
      }
    }
  }

  private addDelta(val1: PrimitiveTypes, delta: Delta): any {
    const str1 = val1.toString()

    let newVal = str1 + delta.delta

    return this.str2value({ ...delta, delta: newVal })
  }

  private delta2obj(delta: Delta) {
    const { path } = delta

    const parts = path.split('.')
    let parent = this.internalObj
    for (let i = 0; i < parts.length; i++) {
      let p = parts[i]
      let final = false

      if (p === parts[parts.length - 1]) {
        // this is the last part of the path — which means its where we have to actually add the value
        final = true
      }

      if (p.startsWith('[') && p.endsWith(']')) {
        // array
        if (final) {
          console.log('final and aarrays');
          const index = parseInt(p.slice(1, -1))

          if (!Array.isArray(parent)) {
            parent = []
          }

          if (parent.length <= index) {
            parent.push(this.str2value(delta))
            return
          }

          parent![index] = this.addDelta(parent![index], delta)
          return
        }

        const index = parseInt(p.slice(1, -1))
        
        if (!parent[index]) {
          parent[index] = {}
        }

        parent = parent[index]

        continue
      }
      
      // object
      if (final) {
        if (!parent[p]) {
          parent[p] = this.str2value(delta)
          return
        }

        parent[p] = this.addDelta(parent[p], delta)
        return
      }

      if (!parent[p]) {
        if (parts[i + 1].startsWith('[')) parent[p] = []
        else parent[p] = {}
      }
      
      parent = parent[p]
    }
  }

  public decode(encoded: string): Record<string, any> {
    if (encoded.indexOf(errorIdentifier) != -1) {
      throw new Error('The server returned an error.')
    }
    try {
      const deltas = JSON.parse(encoded) as Delta[]

      for (let delta of deltas) {
        this.delta2obj(delta)
      }
    } catch (err) {
      console.error(err)
    }
    
    return this.internalObj
  }
}