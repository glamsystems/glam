export class GlamError extends Error {
  rawError: any;
  programLogs?: string[];
  message: string;

  constructor(message: string, rawError: any, programLogs?: string[]) {
    super(message);
    this.message = message;
    this.rawError = rawError;
    this.programLogs = programLogs;
  }
}
