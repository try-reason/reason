export default class ReasonError extends Error {
  constructor(message, code, debug_info = {}) {
    super(`${message} (Error code ${code})`);
    this.code = code;
    this.debug_info = debug_info;
  }
}