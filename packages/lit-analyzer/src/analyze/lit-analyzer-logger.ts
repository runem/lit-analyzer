/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LitAnalyzerLogger {
	debug(...args: any[]): void;
	error(...args: any[]): void;
	warn(...args: any[]): void;
	verbose(...args: any[]): void;
}

export class DefaultLitAnalyzerLogger implements LitAnalyzerLogger {
	debug = console.log;
	error = console.error;
	warn = console.warn;
	verbose = console.log;
}
