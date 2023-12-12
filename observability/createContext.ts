import IContext from "./context";

export default function createContext(req: Request, entrypointName: string): IContext {
  const context: IContext = {
    id: Math.random().toString().replace('0.', ''),
    // url: req.url,
    entrypointName: entrypointName.replaceAll('-', ' '),
    timestamps: {
      start: new Date(),
    },
    spans: {},
    actions: [],
    get currentAction() {
      return this.actions[0] ?? null
    }
  } as any

  return context
}

/*

  [
    entry -> classify -> getwebpage (processing)
    entry -> 
  ]

*/