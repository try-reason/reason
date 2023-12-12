import isDebug from "../../utils/isDebug.js";

export default class ActionError extends Error {
  name;
  description;
  code;

  constructor(description, code, debug_info = null) {
    const message = `ActionError: ${description}\nError code: ${code}`
    super(message)
    
    this.name = 'ActionError'
    this.description = description
    this.code = code

    if (isDebug) {
      console.log('RΞASON — INTERNAL DEBUG INFORMATION:');
      console.log(debug_info);
    }
  }
}