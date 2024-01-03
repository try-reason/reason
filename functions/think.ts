import Streamable, { StreamableDone, StreamableNotDone } from "../types/streamable";
import { OAIMessage, ThinkConfig } from "../types/thinkConfig";

// this enables the return of `reasonStream` to be extended
// i.e.: `for await (const output of reasonStream<SomeType>(...)) output.newProp = 'foo'`
// this alsos enables the return of `reasonStream` to have nested StreamableValues in them
type ActualStreamReturnDone<T> = T extends string | number | boolean ? StreamableDone<T> : (StreamableDone<{
  [K in keyof T]: T[K] extends Array<infer U> ? Array<ActualStreamReturnDone<U>> : ActualStreamReturnDone<T[K]>;
}>
) & Streamable<{
  [key: string]: unknown;
}>;

type ActualStreamReturnNotDone<T> = T extends string | number | boolean ? Streamable<T> : (StreamableNotDone<{
  [K in keyof T]: T[K] extends Array<infer U> ? Array<ActualStreamReturnNotDone<U>> : ActualStreamReturnNotDone<T[K]>;
}>
) & Streamable<{
  [key: string]: unknown;
}>;

type ActualStreamReturn<T> = T extends string | number | boolean ? Streamable<T> : (StreamableDone<{
  [K in keyof T]: T[K] extends Array<infer U> ? Array<ActualStreamReturnDone<U>> : ActualStreamReturnDone<T[K]>;
}>
| StreamableNotDone<{
  [K in keyof T]: T[K] extends Array<infer U> ? Array<ActualStreamReturnNotDone<U>> : ActualStreamReturnNotDone<T[K]>;
}>
) & Streamable<{
  [key: string]: unknown;
}>;

type StreamReturn<T> = T extends string | number | boolean ? Streamable<T> : {
  [K in keyof T]: ActualStreamReturn<T[K]>
} & {
  [key: string]: unknown;
}

export { StreamReturn }

type StreamFunction<T> = (values: StreamReturn<T>) => void

export default function reason<T = string>(prompt: string, config?: ThinkConfig): Promise<T>;
export default function reason<T = string>(messages: OAIMessage[], config?: ThinkConfig): Promise<T>;

export default async function reason<T = string>(input: string | OAIMessage[], config?: ThinkConfig): Promise<T> { return {} as T }

interface ReasonStreamStringOutput {
  done: false;
  value: string;
  delta: string;
}

export { ReasonStreamStringOutput }

// @ts-expect-error
export function reasonStream(prompt: string, config?: ThinkConfig): AsyncGenerator<ReasonStreamStringOutput, string>;
export function reasonStream<T = string>(prompt: string, config?: ThinkConfig): AsyncGenerator<StreamReturn<T>, T>;
export function reasonStream<T = string>(messages: OAIMessage[], config?: ThinkConfig): AsyncGenerator<StreamReturn<T>, T>;

export async function* reasonStream<T = string>(input: string | OAIMessage[], config?: ThinkConfig): AsyncGenerator<StreamReturn<T>, T> { return {} as T }