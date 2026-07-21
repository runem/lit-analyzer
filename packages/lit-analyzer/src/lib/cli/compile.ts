import { existsSync, readFileSync } from "fs";
import { dirname } from "path";
import {
	CompilerOptions,
	convertCompilerOptionsFromJson,
	parseJsonConfigFileContent,
	sys,
	createProgram,
	findConfigFile,
	ModuleKind,
	ModuleResolutionKind,
	Program,
	readConfigFile,
	ScriptTarget,
	SourceFile
} from "typescript";
import { LitAnalyzerConfig } from "../analyze/lit-analyzer-config.js";

const requiredCompilerOptions: CompilerOptions = {
	noEmitOnError: false,
	noEmit: true,
	allowJs: true,
	//maxNodeModuleJsDepth: 3,
	strictNullChecks: true, // Type checking will remove all "null" and "undefined" from types if "strictNullChecks" is false
	skipLibCheck: true
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
	allowUnusedLabels: true,
	lib: ["lib.esnext.d.ts", "lib.dom.d.ts"]
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
	const compilerOptions = resolveProjectCompilerOptions();

	// If we found existing compiler options, merged "required compiler options" into it.
	if (compilerOptions != null) {
		const options = {
			...compilerOptions,
			...requiredCompilerOptions
		};
		// set module resolution to nodejs if it is classic
		// but if the user has set it to something else, don't override it
		if (!options.moduleResolution || options.moduleResolution === ModuleResolutionKind.Classic) {
			options.moduleResolution = ModuleResolutionKind.NodeJs;
		}
		return options;
	}

	// Return default compiler options if no compiler options were found
	return defaultCompilerOptions;
}

type ProjectConfigKind = "tsconfig" | "deno";

interface ProjectConfig {
	filePath: string;
	kind: ProjectConfigKind;
}

/** Shape of the parts of a Deno "deno.json" this tool reads. */
export interface DenoConfig {
	compilerOptions?: Record<string, unknown>;
	nodeModulesDir?: unknown;
	litAnalyzer?: Partial<LitAnalyzerConfig>;
}

/**
 * Finds the nearest project config. A "tsconfig.json" is preferred; a Deno
 * "deno.json"/"deno.jsonc" is used when no "tsconfig.json" is found.
 */
function findProjectConfig(): ProjectConfig | undefined {
	const tsConfigFilePath = findConfigFile(process.cwd(), existsSync, "tsconfig.json");
	if (tsConfigFilePath != null) {
		return { filePath: tsConfigFilePath, kind: "tsconfig" };
	}

	for (const fileName of ["deno.json", "deno.jsonc"]) {
		const denoConfigFilePath = findConfigFile(process.cwd(), existsSync, fileName);
		if (denoConfigFilePath != null) {
			return { filePath: denoConfigFilePath, kind: "deno" };
		}
	}

	return undefined;
}

/**
 * Resolves the nearest "tsconfig.json" (or Deno "deno.json") and returns its CompilerOptions
 */
export function resolveProjectCompilerOptions(): CompilerOptions | undefined {
	const projectConfig = findProjectConfig();
	if (projectConfig == null) {
		return undefined;
	}

	// readConfigFile tolerates comments and trailing commas, so it also reads "deno.jsonc"
	const parsedConfig = readConfigFile(projectConfig.filePath, path => readFileSync(path, "utf8"));
	if (parsedConfig?.config == null) {
		return undefined;
	}

	if (projectConfig.kind === "deno") {
		warnUnlessNodeModulesResolvable(projectConfig.filePath, parsedConfig.config);
		return convertDenoCompilerOptions(parsedConfig.config, dirname(projectConfig.filePath));
	}

	// Parse the tsconfig.json file
	const parsedJson = parseJsonConfigFileContent(parsedConfig.config, sys, process.cwd());
	return parsedJson?.options;
}

/**
 * Adapts the "compilerOptions" from a Deno "deno.json" into TypeScript CompilerOptions.
 *
 * Deno keeps its TypeScript settings in "deno.json" rather than "tsconfig.json". The
 * "compilerOptions" shapes mostly overlap, but "lib" may name Deno's own libraries
 * ("deno.ns", "deno.window", ...). TypeScript doesn't recognize those: it discards each
 * and records an error for it. Dropping them up front keeps the intent explicit and the
 * conversion error-free, instead of leaning on TypeScript to quietly discard them.
 */
export function convertDenoCompilerOptions(config: DenoConfig, basePath: string): CompilerOptions {
	const rawCompilerOptions: Record<string, unknown> = { ...(config.compilerOptions ?? {}) };

	const lib = rawCompilerOptions.lib;
	if (Array.isArray(lib)) {
		rawCompilerOptions.lib = lib.filter(entry => typeof entry === "string" && !entry.startsWith("deno."));
	}

	const { options } = convertCompilerOptionsFromJson(rawCompilerOptions, basePath);

	// Lit templates are type checked against the DOM, so fall back to a "dom"+"esnext" lib
	// when the project declared only Deno libs (which were just filtered away).
	if (options.lib == null || options.lib.length === 0) {
		options.lib = ["lib.esnext.d.ts", "lib.dom.d.ts"];
	}

	return options;
}

/**
 * TypeScript resolves npm dependencies — Lit's element definitions among them — through
 * a local "node_modules" directory. Deno only creates one when "nodeModulesDir" is "auto"
 * or "manual" (or the legacy `true`). Otherwise dependencies stay in a global cache
 * TypeScript can't see, every custom element reads as an unknown tag, and the analyzer
 * silently reports nothing. This warns rather than fails, so a project that resolves its
 * dependencies some other way still runs.
 */
function warnUnlessNodeModulesResolvable(filePath: string, config: DenoConfig): void {
	const value = config.nodeModulesDir;
	if (value === "auto" || value === "manual" || value === true) {
		return;
	}

	const shown = value === undefined ? "not set" : JSON.stringify(value);
	// eslint-disable-next-line no-console
	console.warn(
		`lit-analyzer: "nodeModulesDir" is ${shown} in ${filePath}. Set it to "auto" or "manual" and ` +
			`install dependencies (e.g. run "deno install") so npm packages resolve; otherwise custom ` +
			`elements defined in packages won't be found.`
	);
}

/**
 * Resolves the nearest "tsconfig.json" (or Deno "deno.json") and returns the
 * configuration seed for "ts-lit-plugin".
 */
export function readLitAnalyzerConfigFromProject(): Partial<LitAnalyzerConfig> | undefined {
	const projectConfig = findProjectConfig();
	if (projectConfig == null) {
		return undefined;
	}

	const parsedConfig = readConfigFile(projectConfig.filePath, path => readFileSync(path, "utf8"));
	if (parsedConfig?.config == null) {
		return undefined;
	}

	if (projectConfig.kind === "deno") {
		// Deno ignores top-level fields it doesn't recognize, so ts-lit-plugin settings live
		// under a "litAnalyzer" key beside the compiler options the project already declares.
		const denoConfig = parsedConfig.config as DenoConfig;
		return denoConfig.litAnalyzer ?? undefined;
	}

	// Finds the plugin section within the parsed "tsconfig.json"
	const parsedJson = parseJsonConfigFileContent(parsedConfig.config, sys, process.cwd());
	const compilerOptions = parsedJson?.options;
	if (compilerOptions != null && "plugins" in compilerOptions) {
		const plugins = compilerOptions.plugins as ({ name: string } & Partial<LitAnalyzerConfig>)[];
		const tsLitPluginOptions = plugins.find(plugin => plugin.name === "ts-lit-plugin");
		if (tsLitPluginOptions != null) {
			return tsLitPluginOptions;
		}
	}

	return undefined;
}
