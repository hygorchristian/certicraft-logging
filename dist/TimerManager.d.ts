type TimeEndResult = {
    labels: Record<string, any>;
    timeLog: any;
};
export default class TimerManager {
    private timers;
    constructor();
    time(label: string): void;
    timeLog(label: string, ...args: any[]): void;
    timeEnd(label: string): TimeEndResult;
    flush(): TimeEndResult[];
    private formatLogs;
}
export {};
