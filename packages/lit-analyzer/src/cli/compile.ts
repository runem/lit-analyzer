import { existsSync, readFileSync } from "fs";
import { basename } from "path";
import {
	CompilerOptions,
	convertCompilerOptionsFromJson,
	createProgram,
	findConfigFile,
	ModuleKind,
	ModuleResolutionKind,
	Program,
	readConfigFile,
	ScriptTarget,
	SourceFile
} from "typescript";
import { LitAnalyzerConfig } from "../analyze/lit-analyzer-config";

const requiredCompilerOptions: CompilerOptions = {
	noEmitOnError: false,
	noEmit: true,
	allowJs: true,
	//maxNodeModuleJsDepth: 3,
	strictNullChecks: true, // Type checking will remove all "null" and "undefined" from types if "strictNullChecks" is false
	moduleResolution: ModuleResolutionKind.NodeJs,
	skipLibCheck: true,
	lib: ["lib.esnext.d.ts", "lib.dom.d.ts"]
};

/**
 * The most general version of compiler options.
 */
const defaultCompilerOptions: CompilerOptions = {
	...requiredCompilerOptions,
	experimentalDecorators: true,
	target: ScriptTarget.Latest,
	downlevelIteration: true,
	module: ModuleKind.ESNext,
	//module: ModuleKind.CommonJS,
	esModuleInterop: true,
	allowSyntheticDefaultImports: true,
	allowUnreachableCode: true,
	allowUnusedLabels: true
};

export interface CompileResult {
	program: Program;
	files: SourceFile[];
	pluginOptions?: LitAnalyzerConfig;
}

/**
 * Compiles an array of file paths using typescript.
 * @param filePaths
 */
export function compileTypescript(filePaths: string | string[]): CompileResult {
	const options = getCompilerOptions();

	filePaths = Array.isArray(filePaths) ? filePaths : [filePaths];
	const program = createProgram(filePaths, options);
	const files = program
		.getSourceFiles()
		.filter(sf => filePaths.includes(sf.fileName))
		.sort((sfA, sfB) => (sfA.fileName > sfB.fileName ? 1 : -1));

	return { program, files };
}

/**
 * Returns compiler options to be used
 */
export function getCompilerOptions(): CompilerOptions {
	// Get compiler options from files
	const compilerOptions = resolveTsConfigCompilerOptions();

	// If we found existing compiler options, merged "required compiler options" into it.
	if (compilerOptions != null) {
		return {
			...compilerOptions,
			...requiredCompilerOptions
		};
	}

	// Return default compiler options if no compiler options were found
	return defaultCompilerOptions;
}

/**
 * Resolves "tsconfig.json" file and returns its CompilerOptions
 */
export function resolveTsConfigCompilerOptions(): CompilerOptions | undefined {
	// Find the nearest tsconfig.json file if possible
	const tsConfigFilePath = findConfigFile(process.cwd(), existsSync, "tsconfig.json");

	if (tsConfigFilePath != null) {
		// Read the tsconfig.json file
		const parsedConfig = readConfigFile(tsConfigFilePath, path => readFileSync(path, "utf8"));

		if (parsedConfig != null && parsedConfig.config != null) {
			// Parse the tsconfig.json file
			const parsedJson = convertCompilerOptionsFromJson(parsedConfig.config.compilerOptions, basename(tsConfigFilePath), "tsconfig.json");
			return parsedJson?.options;
		}
	}

	return undefined;
}

/**
 * Resolves the nearest tsconfig.json and returns the configuration seed within the plugins section for "ts-lit-plugin"
 */
export function readLitAnalyzerConfigFromTsConfig(): Partial<LitAnalyzerConfig> | undefined {
	const compilerOptions = resolveTsConfigCompilerOptions();

	// Finds the plugin section
	if (compilerOptions != null && "plugins" in compilerOptions) {
		const plugins = compilerOptions.plugins as ({ name: string } & Partial<LitAnalyzerConfig>)[];
		const tsLitPluginOptions = plugins.find(plugin => plugin.name === "ts-lit-plugin");
		if (tsLitPluginOptions != null) {
			return tsLitPluginOptions;
		}
	}

	return undefined;
}
