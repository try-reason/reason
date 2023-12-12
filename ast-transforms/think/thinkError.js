import isDebug from "../../utils/isDebug.js";

export default class ThinkError extends Error {
  name;
  description;
  code;

  constructor(description, code, debug_info = {}) {
    const message = `ThinkError: ${description}\nError code: ${code}`
    super(message)
    
    this.name = 'ThinkError'
    this.description = description
    this.code = code

    if (isDebug) {
      console.log('RΞASON — INTERNAL DEBUG INFORMATION:');
      console.log(debug_info);
    }
  }
}