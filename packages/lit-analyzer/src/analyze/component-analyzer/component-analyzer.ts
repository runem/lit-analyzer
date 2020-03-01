import { ComponentDefinition } from "web-component-analyzer";
import { LitAnalyzerContext } from "../lit-analyzer-context";
import { LitCodeFix } from "../types/lit-code-fix";
import { LitDiagnostic } from "../types/lit-diagnostic";
import { SourceFileRange } from "../types/range";
import { arrayDefined, arrayFlat } from "../util/array-util";
import { intersects } from "../util/range-util";
import { convertRuleDiagnosticToLitDiagnostic } from "../util/rule-diagnostic-util";
import { converRuleFixToLitCodeFix } from "../util/rule-fix-util";

export class ComponentAnalyzer {
	getDiagnostics(definition: ComponentDefinition, context: LitAnalyzerContext): LitDiagnostic[] {
		return context.rules.getDiagnosticsFromDefinition(definition, context).map(d => convertRuleDiagnosticToLitDiagnostic(d, context));
	}

	getCodeFixesAtOffsetRange(definition: ComponentDefinition, range: SourceFileRange, context: LitAnalyzerContext): LitCodeFix[] {
		return arrayFlat(
			arrayDefined(
				context.rules
					.getDiagnosticsFromDefinition(definition, context)
					.filter(({ diagnostic }) => intersects(range, diagnostic.location))
					.map(({ diagnostic }) => diagnostic.fix?.())
			)
		).map(ruleFix => converRuleFixToLitCodeFix(ruleFix));
	}
}
