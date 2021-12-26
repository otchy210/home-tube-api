export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

class Logger {
    public level: LogLevel = 'warn';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    debug(message?: any, ...optionalParams: any[]): void {
        switch (this.level) {
            case 'debug':
                console.debug('[DEBUG]', ...[message, ...optionalParams]);
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    info(message?: any, ...optionalParams: any[]) {
        switch (this.level) {
            case 'debug':
            case 'info':
                console.info('[INFO]', ...[message, ...optionalParams]);
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    warn(message?: any, ...optionalParams: any[]) {
        switch (this.level) {
            case 'debug':
            case 'info':
            case 'warn':
                console.warn('[WARN]', ...[message, ...optionalParams]);
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error(message?: any, ...optionalParams: any[]) {
        switch (this.level) {
            case 'debug':
            case 'info':
            case 'warn':
            case 'error':
                console.error('[ERROR]', ...[message, ...optionalParams]);
        }
    }
}
const logger = new Logger();

export default logger;
