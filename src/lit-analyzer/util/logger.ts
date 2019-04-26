import { appendFileSync, writeFileSync } from "fs";
import { join } from "path";
import { inspect } from "util";

const LOG_FILE_NAME = "lit-plugin.log";

export enum LoggingLevel {
	NONE = 0,
	ERROR = 1,
	WARN = 2,
	DEBUG = 3,
	VERBOSE = 4
}

/**
 * This class takes care of logging while fixing issues regarding the type script service logger.
 * It logs to a file called "log.txt" in the root of this project.
 */
export class Logger {
	level = LoggingLevel.NONE;
	private logPath = join(process.cwd(), LOG_FILE_NAME);

	set cwd(cwd: string) {
		this.logPath = join(cwd, LOG_FILE_NAME);
	}

	/**
	 * Resets the log file.
	 */
	resetLogs() {
		if (this.level > LoggingLevel.NONE) {
			writeFileSync(this.logPath, "");
		}
	}

	/**
	 * Logs if this.level >= DEBUG
	 * @param args
	 */
	debug(...args: any[]) {
		this.appendLogWithLevel(LoggingLevel.DEBUG, ...args);
	}

	/**
	 * Logs if this.level >= ERROR
	 * @param args
	 */
	error(...args: any[]) {
		this.appendLogWithLevel(LoggingLevel.ERROR, ...args);
	}

	/**
	 * Logs if level >= WARN
	 * @param args
	 */
	warn(...args: any[]) {
		this.appendLogWithLevel(LoggingLevel.WARN, ...args);
	}

	/**
	 * Logs if level >= VERBOSE
	 * @param args
	 */
	verbose(...args: any[]) {
		this.appendLogWithLevel(LoggingLevel.VERBOSE, ...args);
	}

	/**
	 * Appends a log if this.level > level
	 * @param level
	 * @param args
	 */
	private appendLogWithLevel(level: LoggingLevel, ...args: any[]) {
		if (this.level >= level) {
			const prefix = this.getLogLevelPrefix(level);
			this.appendLog(prefix, ...args);
		}
	}

	/**
	 * Appends a log entry to the log file.
	 * @param prefix
	 * @param args
	 */
	private appendLog(prefix: string, ...args: any[]) {
		appendFileSync(
			this.logPath,
			`${prefix}${inspect(args, {
				colors: true,
				depth: 6,
				breakLength: 50,
				maxArrayLength: 10
			})}\n`
		);
	}

	private getLogLevelPrefix(level: LoggingLevel) {
		switch (level) {
			case LoggingLevel.VERBOSE:
				return "\x1b[36m VERBOSE: \x1b[0m"; // CYAN
			case LoggingLevel.DEBUG:
				return "\x1b[35m DEBUG: \x1b[0m"; // PURPLE
			case LoggingLevel.WARN:
				return "\x1b[33m WARN: \x1b[0m"; // YELLOW
			case LoggingLevel.ERROR:
				return "\x1b[31m ERROR: \x1b[0m"; // RED
			case LoggingLevel.NONE:
				return "";
		}
	}
}

export const logger = new Logger();
