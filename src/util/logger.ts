import { appendFileSync, writeFileSync } from "fs";
import { join } from "path";
import { inspect } from "util";

const logPath = join(__dirname, "../../log.txt");

export enum LoggingLevel {
	NONE = 0,
	DEBUG = 1,
	VERBOSE = 2
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
	 * Logs if level >= DEBUG
	 * @param args
	 */
	debug(...args: any[]) {
		this.appendLogWithLevel(LoggingLevel.DEBUG, ...args);
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
			this.appendLog(...args);
		}
	}

	/**
	 * Appends a log entry to the log file.
	 * @param args
	 */
	private appendLog(...args: any[]) {
		appendFileSync(logPath, `${inspect(args, { colors: true, depth: 3, breakLength: 50, maxArrayLength: 10 })}\n`);
	}
}

export const logger = new Logger();
