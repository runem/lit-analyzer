import { ComponentDeclaration, ComponentDefinition } from "web-component-analyzer";
import { LitAnalyzerContext } from "../lit-analyzer-context";
import { ReportedRuleDiagnostic } from "../rule-collection";
import { LitCodeFix } from "../types/lit-code-fix";
import { LitDiagnostic } from "../types/lit-diagnostic";
import { SourceFileRange } from "../types/range";
import { arrayDefined, arrayFlat } from "../util/array-util";
import { intersects } from "../util/range-util";
import { convertRuleDiagnosticToLitDiagnostic } from "../util/rule-diagnostic-util";
import { converRuleFixToLitCodeFix } from "../util/rule-fix-util";

export class ComponentAnalyzer {
	getDiagnostics(definitionOrDeclaration: ComponentDefinition | ComponentDeclaration, context: LitAnalyzerContext): LitDiagnostic[] {
		return this.getRuleDiagnostics(definitionOrDeclaration, context).map(d => convertRuleDiagnosticToLitDiagnostic(d, context));
	}

	getCodeFixesAtOffsetRange(
		definitionOrDeclaration: ComponentDefinition | ComponentDeclaration,
		range: SourceFileRange,
		context: LitAnalyzerContext
	): LitCodeFix[] {
		return arrayFlat(
			arrayDefined(
				this.getRuleDiagnostics(definitionOrDeclaration, context)
					.filter(({ diagnostic }) => intersects(range, diagnostic.location))
					.map(({ diagnostic }) => diagnostic.fix?.())
			)
		).map(ruleFix => converRuleFixToLitCodeFix(ruleFix));
	}

	private getRuleDiagnostics(
		definitionOrDeclaration: ComponentDefinition | ComponentDeclaration,
		context: LitAnalyzerContext
	): ReportedRuleDiagnostic[] {
		if ("tagName" in definitionOrDeclaration) {
			return context.rules.getDiagnosticsFromDefinition(definitionOrDeclaration, context);
		} else {
			return context.rules.getDiagnosticsFromDeclaration(definitionOrDeclaration, context);
		}
	}
}
