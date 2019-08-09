/* eslint-disable @typescript-eslint/no-explicit-any */
import { appendFileSync, writeFileSync } from "fs";
import { DefaultLitAnalyzerLogger, LitAnalyzerLoggerLevel } from "lit-analyzer";
import { join } from "path";
import { inspect } from "util";

const LOG_FILE_NAME = "lit-plugin.log";

/**
 * This class takes care of logging while fixing issues regarding the type script service logger.
 * It logs to a file called "log.txt" in the root of this project.
 */
export class Logger extends DefaultLitAnalyzerLogger {
	level = LitAnalyzerLoggerLevel.OFF;

	/**
	 * Logs if this.level >= DEBUG
	 * @param args
	 */
	debug(...args: any[]) {
		this.appendLogWithLevel(LitAnalyzerLoggerLevel.DEBUG, ...args);
	}

	/**
	 * Logs if this.level >= ERROR
	 * @param args
	 */
	error(...args: any[]) {
		this.appendLogWithLevel(LitAnalyzerLoggerLevel.ERROR, ...args);
	}

	/**
	 * Logs if level >= WARN
	 * @param args
	 */
	warn(...args: any[]) {
		this.appendLogWithLevel(LitAnalyzerLoggerLevel.WARN, ...args);
	}

	/**
	 * Logs if level >= VERBOSE
	 * @param args
	 */
	verbose(...args: any[]) {
		this.appendLogWithLevel(LitAnalyzerLoggerLevel.VERBOSE, ...args);
	}

	private logPath = join(process.cwd(), LOG_FILE_NAME);

	set cwd(cwd: string) {
		this.logPath = join(cwd, LOG_FILE_NAME);
	}

	/**
	 * Resets the log file.
	 */
	resetLogs() {
		if (this.level > LitAnalyzerLoggerLevel.OFF) {
			writeFileSync(this.logPath, "");
		}
	}

	/**
	 * Appends a log if this.level > level
	 * @param level
	 * @param args
	 */
	private appendLogWithLevel(level: LitAnalyzerLoggerLevel, ...args: any[]) {
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

	private getLogLevelPrefix(level: LitAnalyzerLoggerLevel) {
		return `[${new Date().toLocaleString()}] [${this.severityPrefix(level)}] `;
	}
}

export const logger = new Logger();
