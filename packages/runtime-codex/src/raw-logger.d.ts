export interface RawLoggerOptions {
  directory?: string;
  now?: Date;
}

export function logRawObservation(raw: Buffer | string, event?: string, options?: RawLoggerOptions): Promise<string>;
