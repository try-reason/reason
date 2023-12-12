import setup from './setup';
import express from 'express'
import { getEntrypoints } from './entrypoints';
import cors from 'cors'
import IContext from '../observability/context';
import errorhandler from './error-handler';
import ReasonServer from './server';

const app = express()

app.use(cors())
app.use(express.json())

process.on('unhandledRejection', (reason, promise: any) => {
  const symbols = Object.getOwnPropertySymbols(promise);
  const kResourceStoreSymbol = symbols.find(symbol => symbol.description === 'kResourceStore');

  if (reason instanceof SyntaxError && reason.message.includes('REASON__INTERNAL__INFO') && reason.message.includes('The requested module') && reason.message.includes('does not provide an export named')) {
    try {
        const action = reason.message.split("'")[1]
        const agentWithLineNumber = reason.stack?.split('\n')[0]
        const agent = agentWithLineNumber?.substring(0, agentWithLineNumber.lastIndexOf(':'))

        console.error(`ReasonError: The action \`${action}\` imported in agent \`${agent}\` is not LLM-callable.\n\nTo make an action LLM-callable, add the prompt information above its declaration by adding the proper JSDoc. For instance:
\`\`\`
/**
 * This is a sample description for the foo action
 * @param bar This is a sample description for the bar parameter
 */
export default function foo(bar: string) {
  // do work
}
\`\`\`

For more information see link-docs\n\n(Error code: 9910)`)

        return
    } catch {}
}

  if (kResourceStoreSymbol) {
    const resourceStore = promise[kResourceStoreSymbol] as IContext;
    if (resourceStore) {
      if (resourceStore.hasErrored) return
      return errorhandler(reason, resourceStore)
    }
  }
  
  console.error('Unhandled Rejection at:', promise, '\nReason:', reason);
})

async function main() {
  await setup()

  let port = 1704
  if (process.argv.length >= 4 && process.argv[2] === '--port') {
    port = parseInt(process.argv[3])
  }

  const entrypoints = await getEntrypoints()

  const server = new ReasonServer(entrypoints)
  await server.serve(port)
}

main()
