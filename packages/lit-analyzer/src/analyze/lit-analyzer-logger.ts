/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LitAnalyzerLogger {
	level: LitAnalyzerLoggerLevel;
	debug(...args: any[]): void;
	error(...args: any[]): void;
	warn(...args: any[]): void;
	verbose(...args: any[]): void;
}

export enum LitAnalyzerLoggerLevel {
	OFF = 0,
	ERROR = 1,
	WARN = 2,
	DEBUG = 3,
	VERBOSE = 4
}

export class DefaultLitAnalyzerLogger implements LitAnalyzerLogger {
	level = LitAnalyzerLoggerLevel.OFF;

	/**
	 * Logs if this.level >= DEBUG
	 * @param args
	 */
	debug(...args: any[]) {
		this.log(LitAnalyzerLoggerLevel.DEBUG, ...args);
	}

	/**
	 * Logs if this.level >= ERROR
	 * @param args
	 */
	error(...args: any[]) {
		this.log(LitAnalyzerLoggerLevel.ERROR, ...args);
	}

	/**
	 * Logs if level >= WARN
	 * @param args
	 */
	warn(...args: any[]) {
		this.log(LitAnalyzerLoggerLevel.WARN, ...args);
	}

	/**
	 * Logs if level >= VERBOSE
	 * @param args
	 */
	verbose(...args: any[]) {
		this.log(LitAnalyzerLoggerLevel.VERBOSE, ...args);
	}

	private log(level: LitAnalyzerLoggerLevel, ...args: any[]) {
		// Only log for the set level
		if (level > this.level) {
			return;
		}

		const prefix = `[${this.severityPrefix(level)}]`;

		switch (level) {
			case LitAnalyzerLoggerLevel.VERBOSE:
				// eslint-disable-next-line no-console
				console.log(prefix, ...args);
				return;
			case LitAnalyzerLoggerLevel.DEBUG:
				// eslint-disable-next-line no-console
				console.debug(prefix, ...args);
				return;
			case LitAnalyzerLoggerLevel.WARN:
				// eslint-disable-next-line no-console
				console.warn(prefix, ...args);
				return;
			case LitAnalyzerLoggerLevel.ERROR:
				// eslint-disable-next-line no-console
				console.error(prefix, ...args);
				return;
			case LitAnalyzerLoggerLevel.OFF:
				return;
		}
	}

	protected severityPrefix(level: LitAnalyzerLoggerLevel): string {
		switch (level) {
			case LitAnalyzerLoggerLevel.VERBOSE:
				return "\x1b[36mVERBOSE\x1b[0m"; // CYAN
			case LitAnalyzerLoggerLevel.DEBUG:
				return "\x1b[33mDEBUG\x1b[0m"; // YELLOW
			case LitAnalyzerLoggerLevel.WARN:
				return "\x1b[35mWARN\x1b[0m"; // PURPLE
			case LitAnalyzerLoggerLevel.ERROR:
				return "\x1b[31mERROR\x1b[0m"; // RED
			case LitAnalyzerLoggerLevel.OFF:
				return "";
		}
	}
}
