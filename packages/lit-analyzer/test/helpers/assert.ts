import { ExecutionContext } from "ava";
import { LitAnalyzerRuleName } from "../../src/analyze/lit-analyzer-config";
import { LitDiagnostic } from "../../src/analyze/types/lit-diagnostic";

export function hasDiagnostic(t: ExecutionContext, diagnostics: LitDiagnostic[], ruleName: LitAnalyzerRuleName) {
	prettyLogDiagnostics(t, diagnostics);
	t.is(diagnostics.length, 1);
	t.is(diagnostics[0].source, ruleName);
}

export function hasNoDiagnostics(t: ExecutionContext, diagnostics: LitDiagnostic[]) {
	prettyLogDiagnostics(t, diagnostics);
	t.is(diagnostics.length, 0);
}

function prettyLogDiagnostics(t: ExecutionContext, diagnostics: LitDiagnostic[]) {
	//t.log(diagnostics.map(diagnostic => `${diagnostic.source}: ${diagnostic.message}`));
}
