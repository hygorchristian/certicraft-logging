import { LoggingBunyan } from '@google-cloud/logging-bunyan';
import { ServiceContext } from '@google-cloud/logging-bunyan/build/src/types/core';
import bunyan, { Stream } from 'bunyan';
import bunyanFormat from 'bunyan-format';
import Config from './Config';
import StopwatchManager from './StopwatchManager';
import TimerManager from './TimerManager';

export default class CloudLogger {
  private config: Config;
  private timerManager: TimerManager;
  private stopwatchManager: StopwatchManager;
  private loggerName: string;
  private labels: Record<string, any>;
  private context: ServiceContext;
  private enabled: boolean;

  constructor(config: Config) {
    this.loggerName = 'default';
    this.labels = {};
    this.enabled = true;
    this.config = config;
    this.timerManager = new TimerManager();
    this.stopwatchManager = new StopwatchManager();
    this.context = {};
  }

  // ---------------------------------------------------------------------------
  // Setup Methods
  // ---------------------------------------------------------------------------

  setLoggerName(name: string): void {
    this.loggerName = name;
  }

  setLabels(labels: Record<string, any>): void {
    this.labels = { ...this.labels, ...labels };
  }

  setHttpLabels(httpRequest: Record<string, any>): void {
    this.labels = { ...this.labels, httpRequest };
  }

  setContext(context: ServiceContext): void {
    this.context = context;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // ---------------------------------------------------------------------------
  // Logger Methods
  // ---------------------------------------------------------------------------

  info(msg: any): void {
    this.getLogger().info(msg);
  }

  error(msg: any): void {
    this.getLogger().error(msg);
  }

  warn(msg: any): void {
    this.getLogger().warn(msg);
  }

  debug(msg: any): void {
    this.getLogger().debug(msg);
  }

  time(label: string): void {
    this.timerManager.time(label);
  }

  timeLog(label: string, ...args: any[]): void {
    this.timerManager.timeLog(label, ...args);
  }

  timeEnd(label: string): void {
    const { labels, timeLog } = this.timerManager.timeEnd(label);
    this.getLogger(labels).info({ timeLog });
  }

  stopwatchStart(label: string): void {
    this.stopwatchManager.start(label);
  }

  stopwatchStop(label: string): void {
    this.stopwatchManager.stop(label);
  }

  stopwatchGetInfo(label: string): void {
    const result = this.stopwatchManager.getInfo(label);
    this.getLogger({ stopwatch: label }).info({ stopwatch: result });
  }

  flush(): void {
    const timer = this.timerManager.flush();
    const stopwatch = this.stopwatchManager.flush();
    this.getLogger({ messages_flushed: 1 }).info({
      message: 'flushing all timer messages',
      timer,
      stopwatch
    });
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private getLogger(labels: Record<string, any> = {}): bunyan {
    return bunyan.createLogger({
      name: this.loggerName,
      streams: this.getStreams(labels)
    });
  }

  private getStreams(labels: Record<string, any> = {}): Stream[] {
    const streams: Stream[] = [];
    if (!this.enabled) return streams;
    if (!this.config.isTestEnvironment()) {
      if (this.config.isEmulator()) {
        // The 'false' condition seems redundant, remove if not needed
        streams.push(this.getStreamForLocalTesting());
      } else {
        streams.push(this.getStreamForCloudLogging(labels));
      }
    } else if (this.config.isTTY()) {
      streams.push(this.getStreamForLocalTesting());
    } else {
      streams.push(this.getStdoutStream());
    }
    return streams;
  }

  private getStdoutStream(): Stream {
    return { stream: process.stdout, level: 'info' };
  }

  private getStreamForLocalTesting(): Stream {
    return {
      stream: bunyanFormat({ outputMode: 'short' }),
      level: 'debug'
    };
  }

  private getStreamForCloudLogging(labels: Record<string, any>): Stream {
    return new LoggingBunyan({
      serviceContext: this.context,
      logName: this.loggerName,
      resource: {
        type: 'cloud_function',
        labels: { ...this.labels, ...labels }
      }
    }).stream('info');
  }
}
