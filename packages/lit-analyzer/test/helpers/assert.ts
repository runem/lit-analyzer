import { ExecutionContext } from "ava";
import { LitAnalyzerRuleId } from "../../src/analyze/lit-analyzer-config";
import { LitDiagnostic } from "../../src/analyze/types/lit-diagnostic";

export function hasDiagnostic(t: ExecutionContext, diagnostics: LitDiagnostic[], ruleName: LitAnalyzerRuleId) {
	if (diagnostics.length !== 1) {
		prettyLogDiagnostics(t, diagnostics);
	}
	t.is(diagnostics.length, 1);
	t.is(diagnostics[0].source, ruleName);
}

export function hasNoDiagnostics(t: ExecutionContext, diagnostics: LitDiagnostic[]) {
	if (diagnostics.length !== 0) {
		prettyLogDiagnostics(t, diagnostics);
	}
	t.is(diagnostics.length, 0);
}

function prettyLogDiagnostics(t: ExecutionContext, diagnostics: LitDiagnostic[]) {
	t.log(diagnostics.map(diagnostic => `${diagnostic.source}: ${diagnostic.message}`));
}
