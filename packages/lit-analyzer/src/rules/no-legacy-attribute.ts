import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types";
import { HtmlNodeKind } from "../analyze/types/html-node/html-node-types";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";
import { suggestTargetForHtmlAttr } from "../analyze/util/attribute-util";

const LEGACY_ASSIGNMENT = /^(\[\[[^\]]+\]\]|{{[^}]+}})/;

/**
 * This rule validates that legacy Polymer attribute bindings are not used.
 */
const rule: RuleModule = {
	name: "no-legacy-attribute",
	visitHtmlAttribute(htmlAttr, { htmlStore, config, definitionStore, document }) {
		if (htmlAttr.htmlNode.kind !== HtmlNodeKind.NODE) {
			return;
		}

		if (htmlAttr.kind !== HtmlNodeAttrKind.ATTRIBUTE && htmlAttr.kind !== HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE) {
			return;
		}

		const suggestedTarget = suggestTargetForHtmlAttr(htmlAttr, htmlStore);
		const suggestedName = getSuggestedName(htmlAttr.name);

		if (suggestedName !== htmlAttr.name) {
			return [
				{
					kind: LitHtmlDiagnosticKind.LEGACY_SYNTAX,
					message: `Legacy Polymer binding syntax in attribute '${htmlAttr.name}'.`,
					fix: `Did you mean '${suggestedName}'?`,
					location: { document, ...htmlAttr.location.name },
					source: "no-legacy-attribute",
					severity: litDiagnosticRuleSeverity(config, "no-legacy-attribute"),
					suggestion: 'Legacy Polymer binding syntax is not supported in Lit.',
					suggestedTarget
				}
			];
		}

		return;
	},
	visitHtmlAssignment(assignment, { htmlStore, config, definitionStore, document }) {
		if (assignment.kind !== HtmlNodeAttrAssignmentKind.STRING) {
			return;
		}

		const htmlAttr = assignment.htmlAttr;

		if (LEGACY_ASSIGNMENT.test(assignment.value)) {
			const suggestedTarget = suggestTargetForHtmlAttr(htmlAttr, htmlStore);

			return [
				{
					kind: LitHtmlDiagnosticKind.LEGACY_SYNTAX,
					message: `Legacy Polymer binding syntax in attribute '${htmlAttr.name}'.`,
					location: { document, ...htmlAttr.location.name },
					source: "no-legacy-attribute",
					severity: litDiagnosticRuleSeverity(config, "no-legacy-attribute"),
					suggestion: 'Legacy Polymer binding syntax is not supported in Lit.' +
						' Instead you should use JavaScript interpolation, e.g. "attr=${foo}".',
					suggestedTarget
				}
			];
		}

		return;
	}
};

export default rule;

/**
 * Determines the non-legacy attribute name equivalent of the given name
 * @param name legacy name
 */
function getSuggestedName(name: string): string {
	if (name.endsWith('?')) {
		return `?${name.slice(0, -1)}`;
	}
	if (name.endsWith('$')) {
		return `${name.slice(0, -1)}`;
	}
	return name;
}
