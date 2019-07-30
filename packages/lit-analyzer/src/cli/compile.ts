import { existsSync, readFileSync } from "fs";
import { join } from "path";
import {
	CompilerOptions,
	createProgram,
	Diagnostic,
	getPreEmitDiagnostics,
	ModuleKind,
	ModuleResolutionKind,
	Program,
	ScriptTarget,
	SourceFile
} from "typescript";
import { LitAnalyzerConfig, makeConfig } from "../analyze/lit-analyzer-config";

/**
 * The most general version of compiler options.
 */
const defaultOptions: CompilerOptions = {
	noEmitOnError: false,
	allowJs: true,
	experimentalDecorators: true,
	target: ScriptTarget.Latest,
	downlevelIteration: true,
	module: ModuleKind.ESNext,
	//module: ModuleKind.CommonJS,
	//lib: ["esnext", "dom"],
	strictNullChecks: true,
	moduleResolution: ModuleResolutionKind.NodeJs,
	esModuleInterop: true,
	noEmit: true,
	allowSyntheticDefaultImports: true,
	allowUnreachableCode: true,
	allowUnusedLabels: true,
	skipLibCheck: true,
	isolatedModules: true
};

export interface CompileResult {
	diagnostics: readonly Diagnostic[];
	program: Program;
	files: SourceFile[];
	pluginOptions?: LitAnalyzerConfig;
}

/**
 * Compiles an array of file paths using typescript.
 * @param filePaths
 */
export function compileTypescript(filePaths: string | string[]): CompileResult {
	//const options2 = readTsConfig() || defaultOptions;
	const options = defaultOptions;

	filePaths = Array.isArray(filePaths) ? filePaths : [filePaths];
	const program = createProgram(filePaths, options);
	const diagnostics = getPreEmitDiagnostics(program);
	const files = program.getSourceFiles().filter(sf => filePaths.includes(sf.fileName));

	return { diagnostics, program, files };
}

export function readTsConfig(tsConfigPath?: string): CompilerOptions | undefined {
	tsConfigPath = tsConfigPath || join(process.cwd(), "tsconfig.json");

	if (existsSync(tsConfigPath)) {
		try {
			const content = readFileSync(tsConfigPath, "utf8");
			const config = JSON.parse(content) as { compilerOptions: CompilerOptions };
			return config.compilerOptions;
		} catch {
			return undefined;
		}
	}

	return undefined;
}

export function readTsLitPluginConfig(options?: CompilerOptions): LitAnalyzerConfig | undefined {
	options = options || readTsConfig();

	if (options != null && "plugins" in options) {
		const plugins = options.plugins as ({ name: string } & LitAnalyzerConfig)[];
		const tsLitPluginOptions = plugins.find(plugin => plugin.name === "ts-lit-plugin");
		if (tsLitPluginOptions != null) {
			return makeConfig(tsLitPluginOptions);
		}
	}

	return undefined;
}
