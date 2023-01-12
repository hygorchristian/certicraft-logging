// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

// Modified by Shaun Luttin while working at Rubikon Blockchain Corp.

const NONE = 0;
const ERROR = 1;
const WARN = 2;
const INFO = 3;
const DEBUG = 4;

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

const nopLogger: LogWriter = {
  debug() {},
  info() {},
  warn() {},
  error() {}
};

export const isLogLevel = (input: number): input is LogLevel =>
  input >= NONE && input <= DEBUG && Math.round(input) === input;

let logger: LogWriter;
let level: LogLevel;
let previousTimeStampMilliseconds: number;

export default class Log {
  static get NONE(): LogLevel {
    return NONE;
  }

  static get ERROR(): LogLevel {
    return ERROR;
  }

  static get WARN(): LogLevel {
    return WARN;
  }

  static get INFO(): LogLevel {
    return INFO;
  }

  static get DEBUG(): LogLevel {
    return DEBUG;
  }

  static get level() {
    return level;
  }

  static set level(value) {
    if (isLogLevel(value)) {
      level = value;
    } else {
      throw new Error('Invalid log level');
    }
  }

  static get logger() {
    return logger;
  }

  static set logger(value) {
    if (!value.debug && value.info) {
      // just to stay backwards compat. can remove in 2.0
      value.debug = value.info;
    }

    logger = value;
  }

  static set previousTimeStampMilliseconds(value: number) {
    previousTimeStampMilliseconds = value;
  }

  static get previousTimeStampMilliseconds() {
    return previousTimeStampMilliseconds;
  }

  static enable(logger: LogWriter = console, level: LogLevel = NONE) {
    this.logger = logger;
    this.level = level;
  }

  static disable() {
    level = INFO;
    logger = nopLogger;
  }

  private static getElapsedTimeMilliseconds() {
    const currentTimestampMilliseconds = new Date().getTime();
    const elapsedTime = Log.previousTimeStampMilliseconds
      ? currentTimestampMilliseconds - Log.previousTimeStampMilliseconds
      : 0;

    Log.previousTimeStampMilliseconds = currentTimestampMilliseconds;
    return elapsedTime;
  }

  private static buildLogMessage(args: unknown[]): Array<unknown> {
    return Array.from([
      { millisecondsSincePreviousLog: this.getElapsedTimeMilliseconds() },
      ...args
    ]);
  }

  /**
   * Some `LogWriters` use `JSON.stringify` under the hood. This leads to
   * exceptions when the args involve circular references. Here we prevent
   * a logging error from bringing down our system.
   */
  private static abortOnSerializationError(...args: unknown[]) {
    try {
      JSON.stringify(args);
      return false;
    } catch (err) {
      Log.error('Aborting log on serialization error.');
      return true;
    }
  }

  /**
   * Always log even when the log level is NONE. This is helpful for turning on
   * specific log messages during debugging.
   */
  static special(...args: unknown[]) {
    if (Log.abortOnSerializationError(args)) return;
    logger.info.apply(logger, Log.buildLogMessage(args));
  }

  static debug(...args: unknown[]) {
    if (level >= DEBUG) {
      if (Log.abortOnSerializationError(args)) return;
      logger.debug.apply(logger, Log.buildLogMessage(args));
    }
  }

  static info(...args: unknown[]) {
    if (level >= INFO) {
      if (Log.abortOnSerializationError(args)) return;
      logger.info.apply(logger, Log.buildLogMessage(args));
    }
  }

  static warn(...args: unknown[]) {
    if (level >= WARN) {
      if (Log.abortOnSerializationError(args)) return;
      logger.warn.apply(logger, Log.buildLogMessage(args));
    }
  }

  static error(...args: unknown[]) {
    if (level >= ERROR) {
      if (Log.abortOnSerializationError(args)) return;
      logger.error.apply(logger, Log.buildLogMessage(args));
    }
  }

  static timerStart(timerLabel: string) {
    // TODO Avoid using console directly.
    console.time(timerLabel); // eslint-disable-line no-console
  }

  static timerStop(timerLable: string) {
    // TODO Avoid using console directly.
    console.timeEnd(timerLable); // eslint-disable-line no-console
  }
}

Log.disable();
