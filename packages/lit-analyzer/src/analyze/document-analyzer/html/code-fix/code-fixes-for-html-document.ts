import { LitAnalyzerContext } from "../../../lit-analyzer-context";
import { HtmlDocument } from "../../../parse/document/text-document/html-document/html-document";
import { LitCodeFix } from "../../../types/lit-code-fix";
import { DocumentRange } from "../../../types/range";
import { arrayDefined, arrayFlat } from "../../../util/array-util";
import { documentRangeToSFRange, intersects } from "../../../util/range-util";
import { converRuleFixToLitCodeFix } from "../../../util/rule-fix-util";

export function codeFixesForHtmlDocument(htmlDocument: HtmlDocument, range: DocumentRange, context: LitAnalyzerContext): LitCodeFix[] {
	return arrayFlat(
		arrayDefined(
			context.rules
				.getDiagnosticsFromDocument(htmlDocument, context)
				.filter(({ diagnostic }) => intersects(documentRangeToSFRange(htmlDocument, range), diagnostic.location))
				.map(({ diagnostic }) => diagnostic.fix?.())
		)
	).map(ruleFix => converRuleFixToLitCodeFix(ruleFix));
}
