import { appendFileSync, writeFileSync } from "fs";
import { join } from "path";
import { inspect } from "util";

const logPath = join(__dirname, "../../log.txt");

export enum LoggingLevel {
	NONE = 0,
	DEBUG = 1,
	VERBOSE = 2,
	ERROR = 3
}

/**
 * This class takes care of logging while fixing issues regarding the type script service logger.
 * It logs to a file called "log.txt" in the root of this project.
 */
export class Logger {
	level = LoggingLevel.NONE;

	/**
	 * Resets the log file.
	 */
	resetLogs() {
		if (this.level > LoggingLevel.NONE) {
			writeFileSync(logPath, "");
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
			logPath,
			`${prefix}${inspect(args, {
				colors: true,
				depth: 4,
				breakLength: 50,
				maxArrayLength: 10
			})}\n`
		);
	}

	private getLogLevelPrefix(level: LoggingLevel) {
		switch (level) {
			case LoggingLevel.VERBOSE:
				return "\x1b[36m DEBUG: \x1b[0m"; // CYAN
			case LoggingLevel.DEBUG:
				return "\x1b[33m DEBUG: \x1b[0m"; // YELLOW
			case LoggingLevel.ERROR:
				return "\x1b[31m ERROR: \x1b[0m"; // RED
			case LoggingLevel.NONE:
				return "";
		}
	}
}

export const logger = new Logger();
