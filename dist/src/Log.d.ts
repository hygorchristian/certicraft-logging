declare const NONE = 0;
declare const ERROR = 1;
declare const WARN = 2;
declare const INFO = 3;
declare const DEBUG = 4;
type LogLevel =
  | typeof NONE
  | typeof ERROR
  | typeof WARN
  | typeof INFO
  | typeof DEBUG;
type LogWriter = {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};
export declare const isLogLevel: (input: number) => input is LogLevel;
export default class Log {
  static get NONE(): LogLevel;
  static get ERROR(): LogLevel;
  static get WARN(): LogLevel;
  static get INFO(): LogLevel;
  static get DEBUG(): LogLevel;
  static get level(): LogLevel;
  static set level(value: LogLevel);
  static get logger(): LogWriter;
  static set logger(value: LogWriter);
  static set previousTimeStampMilliseconds(value: number);
  static get previousTimeStampMilliseconds(): number;
  static enable(logger?: LogWriter, level?: LogLevel): void;
  static disable(): void;
  private static getElapsedTimeMilliseconds;
  private static buildLogMessage;
  /**
   * Some `LogWriters` use `JSON.stringify` under the hood. This leads to
   * exceptions when the args involve circular references. Here we prevent
   * a logging error from bringing down our system.
   */
  private static abortOnSerializationError;
  /**
   * Always log even when the log level is NONE. This is helpful for turning on
   * specific log messages during debugging.
   */
  static special(...args: unknown[]): void;
  static debug(...args: unknown[]): void;
  static info(...args: unknown[]): void;
  static warn(...args: unknown[]): void;
  static error(...args: unknown[]): void;
  static timerStart(timerLabel: string): void;
  static timerStop(timerLable: string): void;
}
export {};
