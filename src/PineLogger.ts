import pino, { Logger as PinoLogger, LoggerOptions } from 'pino';
import { gcpLogOptions } from 'pino-cloud-logging';
import CloudLogger from './CloudLogger';
import Config from './Config';
import StopwatchManager from './StopwatchManager';
import TimerManager from './TimerManager';
import { InterfaceOf } from './typeGuards/InterfaceOf';
import toPlainJson from './utils/toPlainJson';

export default class PinoCloudLogger implements InterfaceOf<CloudLogger> {
  private config: Config;
  private timerManager: TimerManager;
  private stopwatchManager: StopwatchManager;
  private logger!: PinoLogger;
  private labels: Record<string, any>;
  private context: Record<string, any>;
  private httpRequest: Record<string, any>;
  private enabled: boolean;
  private loggerName: string;
  private isProduction: boolean;

  constructor(config: Config) {
    this.config = config;
    this.labels = {};
    this.context = {};
    this.httpRequest = {};
    this.enabled = false;
    this.loggerName = '';
    this.isProduction = process?.env?.NODE_ENV === 'production';

    this.updateLogger();
    this.logger = pino();
    this.timerManager = new TimerManager();
    this.stopwatchManager = new StopwatchManager();
  }

  info(obj: any, msg?: string, ...args: any[]): void {
    if (!this.enabled) return;
    this.logger.info(
      this.serializeMessage(obj),
      msg as string,
      ...this.serializeMessage(args)
    );
  }

  error(obj: any, msg?: string, ...args: any[]): void {
    if (!this.enabled) return;
    this.logger.error(
      this.serializeMessage(obj),
      msg as string,
      ...this.serializeMessage(args)
    );
  }

  warn(obj: any, msg?: string, ...args: any[]): void {
    if (!this.enabled) return;
    this.logger.warn(
      this.serializeMessage(obj),
      msg as string,
      ...this.serializeMessage(args)
    );
  }

  debug(obj: any, msg?: string, ...args: any[]): void {
    if (!this.enabled) return;
    this.logger.debug(
      this.serializeMessage(obj),
      msg as string,
      ...this.serializeMessage(args)
    );
  }

  time(label: string): void {
    this.timerManager.time(label);
  }

  timeLog(label: string, ...args: any[]): void {
    this.timerManager.timeLog(label, ...args);
  }

  timeEnd(label: string): void {
    const { labels, timeLog } = this.timerManager.timeEnd(label);
    this.logger.info({ timeLog }, `time_log::${label}`, labels);
  }

  stopwatchStart(label: string): void {
    this.stopwatchManager.start(label);
  }

  stopwatchStop(label: string): void {
    this.stopwatchManager.stop(label);
  }

  stopwatchGetInfo(label: string): void {
    const result = this.stopwatchManager.getInfo(label);
    this.logger.info({ stopwatch: result }, `stopwatch::${label}`);
  }

  flush(): void {
    const timer = this.timerManager.flush();
    const stopwatch = this.stopwatchManager.flush();
    this.info(
      {
        message: 'flushing all timer messages',
        timer,
        stopwatch
      },
      'flushing_all_timer_messages'
    );
  }

  setLabels(labels: Record<string, any>): void {
    this.labels = labels;
    this.updateLogger();
  }

  setContext(context: Record<string, any>): void {
    this.context = context;
    this.updateLogger();
  }

  setHttpLabels(httpLabels: Record<string, any>): void {
    this.httpRequest = httpLabels;
    this.updateLogger();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setLoggerName(name: string): void {
    this.loggerName = name;
    this.updateLogger();
  }

  // Private

  private serializeMessage(message: any): any {
    return toPlainJson(message);
  }

  private level = (): pino.Level | 'silent' => {
    if (!this.enabled) return 'silent';
    if (this.config.isTestEnvironment()) return 'silent';
    if (this.config.isEmulator()) return 'debug';
    if (this.config.isTTY()) return 'info';
    return 'info';
  };

  private transporters = (): Partial<LoggerOptions> => {
    if (this.isProduction) return {};
    if (this.config.isTestEnvironment()) return {};
    return {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: true,
          ignore: 'pid,hostname'
        }
      }
    };
  };

  private getContext = (): Partial<LoggerOptions> => {
    if (this.isProduction)
      return {
        mixin: this.mixin.bind(this)
      };
    return {};
  };

  private updateLogger = (): void => {
    const options = gcpLogOptions(
      { level: this.level(), ...this.transporters() } as any,
      this.getContext() as any
    );
    this.logger = pino(options as LoggerOptions);
  };

  private mixin(): Record<string, any> {
    return {
      ...(Object.keys(this.labels).length
        ? { 'logging.googleapis.com/labels': this.labels }
        : {}),
      ...(Object.keys(this.context).length ? this.context : {}),
      ...(Object.keys(this.httpRequest).length
        ? { httpRequest: this.httpRequest }
        : {}),
      ...(this.loggerName ? { loggerName: this.loggerName } : {})
    };
  }
}
