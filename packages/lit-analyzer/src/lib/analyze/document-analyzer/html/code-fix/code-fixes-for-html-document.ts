import { LitAnalyzerContext } from "../../../lit-analyzer-context.js";
import { HtmlDocument } from "../../../parse/document/text-document/html-document/html-document.js";
import { LitCodeFix } from "../../../types/lit-code-fix.js";
import { DocumentRange } from "../../../types/range.js";
import { arrayDefined, arrayFlat } from "../../../util/array-util.js";
import { documentRangeToSFRange, intersects } from "../../../util/range-util.js";
import { converRuleFixToLitCodeFix } from "../../../util/rule-fix-util.js";

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
