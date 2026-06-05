"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class StopwatchManager {
    constructor() {
        this.timers = new Map();
    }
    start(label) {
        if (!this.timers.has(label)) {
            this.timers.set(label, {
                startTime: null,
                ellapsedTime: 0,
                numberOfCalls: 0
            });
        }
        const timer = this.timers.get(label);
        if (!timer)
            return;
        if (timer.startTime === null) {
            timer.startTime = Date.now();
            timer.numberOfCalls++;
        }
    }
    stop(label) {
        if (this.timers.has(label)) {
            const timer = this.timers.get(label);
            if (!timer)
                return;
            if (timer.startTime !== null) {
                timer.ellapsedTime += Date.now() - timer.startTime;
                timer.startTime = null;
            }
        }
    }
    getInfo(label) {
        if (this.timers.has(label)) {
            const timer = this.timers.get(label);
            if (!timer)
                return undefined;
            const ellapsed = timer.startTime !== null
                ? Date.now() - timer.startTime
                : timer.ellapsedTime;
            return {
                label,
                ellapsed,
                numberOfCalls: timer.numberOfCalls,
                averageTime: (ellapsed ?? 0) / (timer.numberOfCalls || 1)
            };
        }
        return {
            message: `Timer ${label} not found`
        };
    }
    flush() {
        const info = [];
        for (const [label] of this.timers) {
            info.push(this.getInfo(label));
        }
        return info;
    }
}
exports.default = StopwatchManager;
