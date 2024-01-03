export default class StreamableObject {
  public internal: Record<string, any> = {}
  public value: any;
  public done: boolean;

  // this enables the return of `reasonStream` to be extended
  // i.e.: `for await (const output of reasonStream<SomeType>(...)) output.newProp = 'foo'`
  [key: string]: any;

  constructor(value: any, done: boolean) {
    this.value = value
    this.done = done
  }
}