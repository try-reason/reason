export default class ReasonError extends Error {
  public code: number;
  public debug_info: Record<string, any>;

  constructor(message: string, code: number, debug_info = {}) {
    super(`${message} (Error code ${code})`);
    this.code = code;
    this.debug_info = debug_info;
  }
}