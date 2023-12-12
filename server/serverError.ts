import isDebug from "../utils/isDebug";

export default class ServerError extends Error {
  public name: string;
  public description: string;
  public code: number;

  constructor(description: string, code: number, debug_info?: any) {
    const message = `${description}\nError code: ${code}`
    super(message)
    
    this.name = 'ServerError'
    this.description = description
    this.code = code

    if (isDebug) {
      console.log('RΞASON — INTERNAL DEBUG INFORMATION:');
      console.log(debug_info);
    }
  }
}