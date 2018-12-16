import { appendFileSync, writeFileSync } from "fs";
import { join } from "path";

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
	 * @param msg
	 * @param args
	 */
	debug(msg: string, ...args: any[]) {
		this.appendLogWithLevel(LoggingLevel.DEBUG, msg, ...args);
	}

	/**
	 * Logs if level >= VERBOSE
	 * @param msg
	 * @param args
	 */
	verbose(msg: string, ...args: any[]) {
		this.appendLogWithLevel(LoggingLevel.VERBOSE, msg, ...args);
	}

	/**
	 * Appends a log if this.level > level
	 * @param level
	 * @param msg
	 * @param args
	 */
	private appendLogWithLevel(level: LoggingLevel, msg: string, ...args: any[]) {
		if (this.level >= level) {
			this.appendLog(msg, ...args);
		}
	}

	/**
	 * Appends a log entry to the log file.
	 * @param msg
	 * @param args
	 */
	private appendLog(msg: string, ...args: any[]) {
		appendFileSync(logPath, `${msg} ${args.length > 0 ? JSON.stringify(args) : ""}\n`);
	}
}

export const logger = new Logger();
