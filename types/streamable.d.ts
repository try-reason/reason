interface StreamableDone<T> {
  /**
   * This indicates if this value has been fully streamed by the LLM.
   * 
   * If `false` then this value has not been fully streamed by the LLM — either because it has not even started or because it is being streaming right now but not fully finished.
   */
  done: true;

  /**
   * This is the actual value of this parameter.
   * 
   * If `null` then this value has not even started to be streamed by the LLM.
   * 
   * You can use this to check if the LLM has started to stream this value (if `value` != `null` && `done` == `false` then this is the value that is currently being streamed).
   */
  value: T;

  /**
   * This is a property that won't be streamed allowing you to store intermediary values that you don't want to stream back to your client.
   * 
   * It is an object that you can add whatever properties you'd like.
   */
  internal: Record<string, any>;
}

interface StreamableNotDone<T> {
  /**
   * This indicates if this value has been fully streamed by the LLM.
   * 
   * If `false` then this value has not been fully streamed by the LLM — either because it has not even started or because it is being streaming right now but not fully finished.
   */
  done: false;

  /**
   * This is the actual value of this parameter.
   * 
   * If `null` then this value has not even started to be streamed by the LLM.
   * 
   * You can use this to check if the LLM has started to stream this value (if `value` != `null` && `done` == `false` then this is the value that is currently being streamed).
   */
  value: Partial<T> | null;

  /**
   * This is a property that won't be streamed allowing you to store intermediary values that you don't want to stream back to your client.
   * 
   * It is an object that you can add whatever properties you'd like — and the data in it will get persisted throughout all iterations of `reasonStream()`.
   */
  internal: Record<string, any>;
}

type Streamable<T> = StreamableDone<T> | StreamableNotDone<T>;

export { StreamableDone, StreamableNotDone }

export default Streamable