"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TimerManager {
    constructor() {
        this.timers = new Map();
    }
    time(label) {
        this.timers.set(label, {
            startTime: Date.now(),
            logs: []
        });
    }
    timeLog(label, ...args) {
        if (this.timers.has(label)) {
            const timer = this.timers.get(label);
            if (!timer)
                return;
            const { startTime } = timer;
            const elapsedTime = Date.now() - startTime;
            timer.logs.push({ elapsedTime, args });
        }
    }
    timeEnd(label) {
        const defaultResult = {
            labels: {},
            timeLog: {}
        };
        if (this.timers.has(label)) {
            const timer = this.timers.get(label);
            if (!timer)
                return defaultResult;
            const { startTime, logs } = timer;
            const duration = Date.now() - startTime;
            const timeLog = {
                label,
                duration,
                logs,
                formattedLogs: this.formatLogs(label, duration, logs)
            };
            const result = {
                labels: {
                    time_log_label: label,
                    time_log_duration: duration
                },
                timeLog
            };
            this.timers.delete(label);
            return result;
        }
        return defaultResult;
    }
    flush() {
        const info = [];
        for (const [label] of this.timers) {
            info.push(this.timeEnd(label));
        }
        return info;
    }
    formatLogs(label, duration, logs) {
        const formattedLogs = logs.map(({ elapsedTime, args }) => {
            return `${label}: ${elapsedTime}ms ${args
                .map(s => JSON.stringify(s, Object.getOwnPropertyNames(s)))
                .join(' ')}`;
        });
        formattedLogs.push(`${label}: duration: ${duration}ms`);
        return formattedLogs;
    }
}
exports.default = TimerManager;
