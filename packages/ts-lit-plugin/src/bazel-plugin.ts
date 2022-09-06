import { DefaultLitAnalyzerContext, LitAnalyzer, LitAnalyzerConfig, LitAnalyzerContext, makeConfig } from "lit-analyzer";
import ts, { Diagnostic } from "typescript";
import { translateDiagnostics } from "./ts-lit-plugin/translate/translate-diagnostics.js";

// See https://github.com/bazelbuild/rules_typescript/blob/master/internal/tsc_wrapped/plugin_api.ts
interface DiagnosticPlugin {
	readonly name: string;
	getDiagnostics(sourceFile: ts.SourceFile): Readonly<ts.Diagnostic>[];
}

/**
 * Implements bazel's DiagnosticPlugin interface, so that we can run
 * the ts-lit-plugin checks as part of bazel compilation.
 */
export class Plugin implements DiagnosticPlugin {
	public readonly name = "lit";

	private readonly context: LitAnalyzerContext;
	private readonly analyzer: LitAnalyzer;

	constructor(program: ts.Program, config: LitAnalyzerConfig) {
		this.name = "lit";
		const context = new DefaultLitAnalyzerContext({
			getProgram() {
				return program;
			}
		});
		context.updateConfig(makeConfig(config));
		this.context = context;
		this.analyzer = new LitAnalyzer(context);
	}

	getDiagnostics(sourceFile: ts.SourceFile): Diagnostic[] {
		const litDiagnostics = this.analyzer.getDiagnosticsInFile(sourceFile);

		const diagnostics = translateDiagnostics(litDiagnostics, sourceFile, this.context);
		for (const diagnostic of diagnostics) {
			if (diagnostic.category === ts.DiagnosticCategory.Warning) {
				// In bazel something is either an error that breaks the build, or
				// we don't want to report it at all.
				diagnostic.category = ts.DiagnosticCategory.Error;
			}
		}
		return diagnostics;
	}
}
