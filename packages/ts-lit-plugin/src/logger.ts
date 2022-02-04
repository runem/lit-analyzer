/* eslint-disable @typescript-eslint/no-explicit-any */
import { appendFileSync, writeFileSync } from "fs";
import { DefaultLitAnalyzerLogger, LitAnalyzerLoggerLevel } from "lit-analyzer";
import { join } from "path";
import { inspect } from "util";
import * as tsServer from "typescript/lib/tsserverlibrary.js";

const LOG_FILE_NAME = "lit-plugin.log";

/**
 * This class takes care of logging while fixing issues regarding the type script service logger.
 * It logs to a file called "log.txt" in the root of this project.
 */
export class Logger extends DefaultLitAnalyzerLogger {
	level = LitAnalyzerLoggerLevel.OFF;

	private tsLogger: tsServer.server.Logger | undefined = undefined;

	/**
	 * Call this with the TS Server's logger so that we can log to the TS server logs.
	 *
	 * Access in VS Code via > TypeScript: Open TS Server log
	 */
	setTsServerLogging(tsLogger: tsServer.server.Logger | undefined): void {
		this.tsLogger = tsLogger;
	}

	/**
	 * Logs if this.level >= DEBUG
	 * @param args
	 */
	debug(...args: any[]): void {
		this.appendLogWithLevel(LitAnalyzerLoggerLevel.DEBUG, ...args);
	}

	/**
	 * Logs if this.level >= ERROR
	 * @param args
	 */
	error(...args: any[]): void {
		this.appendLogWithLevel(LitAnalyzerLoggerLevel.ERROR, ...args);
	}

	/**
	 * Logs if level >= WARN
	 * @param args
	 */
	warn(...args: any[]): void {
		this.appendLogWithLevel(LitAnalyzerLoggerLevel.WARN, ...args);
	}

	/**
	 * Logs if level >= VERBOSE
	 * @param args
	 */
	verbose(...args: any[]): void {
		this.appendLogWithLevel(LitAnalyzerLoggerLevel.VERBOSE, ...args);
	}

	private logPath = join(process.cwd(), LOG_FILE_NAME);

	set cwd(cwd: string) {
		this.logPath = join(cwd, LOG_FILE_NAME);
	}

	/**
	 * Resets the log file.
	 */
	resetLogs(): void {
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
			const message = inspect(args, {
				colors: true,
				depth: 6,
				breakLength: 50,
				maxArrayLength: 10
			});
			try {
				appendFileSync(this.logPath, `${prefix}${message}\n`);
			} catch {
				// ignore
			}
			this.tsLogger?.msg(`[ts-lit-plugin] ${message}`, level === LitAnalyzerLoggerLevel.ERROR ? tsServer.server.Msg.Err : tsServer.server.Msg.Info);
		}
	}

	private getLogLevelPrefix(level: LitAnalyzerLoggerLevel) {
		return `[${new Date().toLocaleString()}] [${this.severityPrefix(level)}] `;
	}
}

export const logger = new Logger();
