import isDebug from "../../utils/isDebug.js";

export default class AgentError extends Error {
  name;
  description;
  code;

  constructor(description, code, debug_info = null) {
    const message = `AgentError: ${description}\nError code: ${code}`
    super(message)
    
    this.name = 'AgentError'
    this.description = description
    this.code = code

    if (isDebug) {
      console.log('RΞASON — INTERNAL DEBUG INFORMATION:');
      console.log(debug_info);
    }
  }
}