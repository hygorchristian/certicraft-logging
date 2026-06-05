type StopwatchInfo = {
    label: string;
    ellapsed: number;
    numberOfCalls: number;
    averageTime: number;
    message?: undefined;
} | {
    message: string;
    label?: undefined;
    ellapsed?: undefined;
    numberOfCalls?: undefined;
    averageTime?: undefined;
} | undefined;
export default class StopwatchManager {
    private timers;
    start(label: string): void;
    stop(label: string): void;
    getInfo(label: string): StopwatchInfo;
    flush(): StopwatchInfo[];
}
export {};
