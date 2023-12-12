import { OAIChatModels } from "../services/getChatCompletion";

export default interface AgentConfig {
  model?: OAIChatModels;
  temperature?: number;

  /**
   * The maximum number of turns this agent will take before stopping. A turn is defined as a response from the LLM model — calling an action or sending a message.
   */
  max_turns?: number;

  /**
   * If this is `false`, the agent will not automatically stream back to the client the text it receives from the LLM model. This is useful if you want to do something with the text before sending it back to the client.
   * 
   * By default, this is true.
   */
  streamText?: boolean;

  /**
   * If `true`, RΞASON will send the memory ID of the current conversation automatically to the client as the `memory_id` field in the root of the streamed object.
   * This only works if the agent is in stream mode, otherwise the memory ID will not be sent automatically.
   * 
   * The default is `true`.
   */
  sendMemoryID?: boolean; 

  /**
   * If `true`, RΞASON won't automatically save the history of the current conversation. If `true` passing a `memory_id` to `useAgent` will do nothing and `memory_id` will also not be sent.
   * 
   * The default is `false`.
   */
  disableAutoSave?: boolean;
}