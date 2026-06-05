"use strict";
// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLogLevel = void 0;
// Modified by Shaun Luttin while working at Rubikon Blockchain Corp.
const NONE = 0;
const ERROR = 1;
const WARN = 2;
const INFO = 3;
const DEBUG = 4;
const nopLogger = {
    debug() { },
    info() { },
    warn() { },
    error() { }
};
const isLogLevel = (input) => input >= NONE && input <= DEBUG && Math.round(input) === input;
exports.isLogLevel = isLogLevel;
let logger;
let level;
let previousTimeStampMilliseconds;
class Log {
    static get NONE() {
        return NONE;
    }
    static get ERROR() {
        return ERROR;
    }
    static get WARN() {
        return WARN;
    }
    static get INFO() {
        return INFO;
    }
    static get DEBUG() {
        return DEBUG;
    }
    static get level() {
        return level;
    }
    static set level(value) {
        if ((0, exports.isLogLevel)(value)) {
            level = value;
        }
        else {
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
    static set previousTimeStampMilliseconds(value) {
        previousTimeStampMilliseconds = value;
    }
    static get previousTimeStampMilliseconds() {
        return previousTimeStampMilliseconds;
    }
    static enable(logger = console, level = NONE) {
        this.logger = logger;
        this.level = level;
    }
    static disable() {
        level = INFO;
        logger = nopLogger;
    }
    static getElapsedTimeMilliseconds() {
        const currentTimestampMilliseconds = new Date().getTime();
        const elapsedTime = Log.previousTimeStampMilliseconds
            ? currentTimestampMilliseconds - Log.previousTimeStampMilliseconds
            : 0;
        Log.previousTimeStampMilliseconds = currentTimestampMilliseconds;
        return elapsedTime;
    }
    static buildLogMessage(args) {
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
    static abortOnSerializationError(...args) {
        try {
            JSON.stringify(args);
            return false;
        }
        catch (err) {
            Log.error('Aborting log on serialization error.');
            return true;
        }
    }
    /**
     * Always log even when the log level is NONE. This is helpful for turning on
     * specific log messages during debugging.
     */
    static special(...args) {
        if (Log.abortOnSerializationError(args))
            return;
        logger.info.apply(logger, Log.buildLogMessage(args));
    }
    static debug(...args) {
        if (level >= DEBUG) {
            if (Log.abortOnSerializationError(args))
                return;
            logger.debug.apply(logger, Log.buildLogMessage(args));
        }
    }
    static info(...args) {
        if (level >= INFO) {
            if (Log.abortOnSerializationError(args))
                return;
            logger.info.apply(logger, Log.buildLogMessage(args));
        }
    }
    static warn(...args) {
        if (level >= WARN) {
            if (Log.abortOnSerializationError(args))
                return;
            logger.warn.apply(logger, Log.buildLogMessage(args));
        }
    }
    static error(...args) {
        if (level >= ERROR) {
            if (Log.abortOnSerializationError(args))
                return;
            logger.error.apply(logger, Log.buildLogMessage(args));
        }
    }
    static timerStart(timerLabel) {
        // TODO Avoid using console directly.
        console.time(timerLabel); // eslint-disable-line no-console
    }
    static timerStop(timerLable) {
        // TODO Avoid using console directly.
        console.timeEnd(timerLable); // eslint-disable-line no-console
    }
}
exports.default = Log;
Log.disable();
