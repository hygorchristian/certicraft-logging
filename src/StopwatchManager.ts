type TimerState = {
  startTime: number | null;
  ellapsedTime: number;
  numberOfCalls: number;
};

type StopwatchInfo =
  | {
      label: string;
      ellapsed: number;
      numberOfCalls: number;
      averageTime: number;
      message?: undefined;
    }
  | {
      message: string;
      label?: undefined;
      ellapsed?: undefined;
      numberOfCalls?: undefined;
      averageTime?: undefined;
    }
  | undefined;

export default class StopwatchManager {
  private timers: Map<string, TimerState> = new Map();

  start(label: string): void {
    if (!this.timers.has(label)) {
      this.timers.set(label, {
        startTime: null,
        ellapsedTime: 0,
        numberOfCalls: 0
      });
    }
    const timer = this.timers.get(label);
    if (!timer) return;
    if (timer.startTime === null) {
      timer.startTime = Date.now();
      timer.numberOfCalls++;
    }
  }

  stop(label: string): void {
    if (this.timers.has(label)) {
      const timer = this.timers.get(label);
      if (!timer) return;
      if (timer.startTime !== null) {
        timer.ellapsedTime += Date.now() - timer.startTime;
        timer.startTime = null;
      }
    }
  }

  getInfo(label: string): StopwatchInfo {
    if (this.timers.has(label)) {
      const timer = this.timers.get(label);
      if (!timer) return undefined;
      const ellapsed =
        timer.startTime !== null
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

  flush(): StopwatchInfo[] {
    const info: StopwatchInfo[] = [];
    for (const [label] of this.timers) {
      info.push(this.getInfo(label));
    }
    return info;
  }
}
