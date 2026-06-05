type TimerLog = {
  elapsedTime: number;
  args: any[];
};

type TimerState = {
  startTime: number;
  logs: TimerLog[];
};

type TimeEndResult = {
  labels: Record<string, any>;
  timeLog: any;
};

export default class TimerManager {
  private timers: Map<string, TimerState>;

  constructor() {
    this.timers = new Map();
  }

  time(label: string): void {
    this.timers.set(label, {
      startTime: Date.now(),
      logs: []
    });
  }

  timeLog(label: string, ...args: any[]): void {
    if (this.timers.has(label)) {
      const timer = this.timers.get(label);
      if (!timer) return;
      const { startTime } = timer;
      const elapsedTime = Date.now() - startTime;
      timer.logs.push({ elapsedTime, args });
    }
  }

  timeEnd(label: string): TimeEndResult {
    const defaultResult: TimeEndResult = {
      labels: {},
      timeLog: {}
    };
    if (this.timers.has(label)) {
      const timer = this.timers.get(label);
      if (!timer) return defaultResult;
      const { startTime, logs } = timer;
      const duration = Date.now() - startTime;
      const timeLog = {
        label,
        duration,
        logs,
        formattedLogs: this.formatLogs(label, duration, logs)
      };
      const result: TimeEndResult = {
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

  flush(): TimeEndResult[] {
    const info: TimeEndResult[] = [];
    for (const [label] of this.timers) {
      info.push(this.timeEnd(label));
    }
    return info;
  }

  private formatLogs(
    label: string,
    duration: number,
    logs: TimerLog[]
  ): string[] {
    const formattedLogs = logs.map(({ elapsedTime, args }) => {
      return `${label}: ${elapsedTime}ms ${args
        .map(s => JSON.stringify(s, Object.getOwnPropertyNames(s)))
        .join(' ')}`;
    });
    formattedLogs.push(`${label}: duration: ${duration}ms`);
    return formattedLogs;
  }
}
