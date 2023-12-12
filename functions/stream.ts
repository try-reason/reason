import { reasonStream } from ".";
import IContext from "../observability/context";
import asyncLocalStorage from "../utils/asyncLocalStorage";
import ReasonError from "../utils/reasonError.js";

export default function stream(value: string | Record<string, any>) {
  const context = asyncLocalStorage.getStore() as IContext

  // assertion check
  if (typeof(value) !== 'string' && typeof(value) !== 'object') {
    throw new ReasonError(`The \`stream()\` function only accepts \`string\` or \`object\` as arguments, but got \`${typeof(value)}\`.\n\nLearn more at DOCS_URL\n\n`, 189)
  }
  if (typeof(value) === 'object') {
    if (Array.isArray(value)) {
      throw new ReasonError(`The \`stream()\` function only accepts \`string\` or \`object\` as arguments, but got \`array\`.\n\nLearn more at DOCS_URL\n\n`, 183)
    }

    if (value === null) {
      throw new ReasonError(`The \`stream()\` function only accepts \`string\` or \`object\` as arguments, but got \`null\`.\n\nLearn more at DOCS_URL\n\n`, 184)
    }

    if (value instanceof Date) {
      throw new ReasonError(`The \`stream()\` function only accepts \`string\` or \`object\` as arguments, but got \`Date\`.\n\nLearn more at DOCS_URL\n\n`, 185)
    }
  }

  if (!context.stream) {
    // TODO: add link to docs
    throw new ReasonError(`You tried using the \`stream()\` function in a non-streamable entrypoint (\`${context.entrypointName}\`).\nTo make it streamable, just turn the function into an async generator function: \`async function* handler() {}\`.\n\nLearn more at DOCS_URL\n\n`, 160)
  }

  context.stream.send(value)
}