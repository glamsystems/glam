export class GlamError extends Error {
  rawError: any;
  programLogs?: string[];
  message: string;
}
