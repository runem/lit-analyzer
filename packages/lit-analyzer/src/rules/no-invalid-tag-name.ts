import { ComponentDefinition } from "web-component-analyzer";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { LitAnalyzerRequest } from "../analyze/lit-analyzer-context";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";
import { isValidCustomElementName } from "../analyze/util/is-valid-name";
import { iterableFirst } from "../analyze/util/iterable-util";
import { rangeFromNode } from "../analyze/util/lit-range-util";

const rule: RuleModule = {
	name: "no-invalid-tag-name",

	visitComponentDefinition(definition: ComponentDefinition, request: LitAnalyzerRequest): LitHtmlDiagnostic[] | void {
		// Check if the tag name is invalid
		if (!isValidCustomElementName(definition.tagName)) {
			const node = iterableFirst(definition.tagNameNodes) || iterableFirst(definition.identifierNodes);

			// Only report diagnostic if the tag is not built in,
			//  because this function among other things tests for missing "-" in custom element names
			const tag = request.htmlStore.getHtmlTag(definition.tagName);
			if (node != null && tag != null && !tag.builtIn) {
				return [
					{
						kind: LitHtmlDiagnosticKind.INVALID_TAG_NAME,
						source: "no-invalid-tag-name",
						severity: litDiagnosticRuleSeverity(request.config, "no-invalid-tag-name"),
						message: `'${definition.tagName}' is not a valid custom element name.`,
						file: request.file,
						location: rangeFromNode(node)
					}
				];
			}
		}

		return [];
	}
};

export default rule;
