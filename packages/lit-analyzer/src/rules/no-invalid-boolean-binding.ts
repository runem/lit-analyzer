import { SimpleTypeKind, isAssignableToType, toTypeString } from "ts-simple-type";
import { RuleModule } from "../analyze/types/rule-module";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeAttr } from "../analyze/types/html-node/html-node-attr-types";
import { extractAttributeTypes } from "../analyze/util/attribute-util";
import { LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER } from "../analyze/constants";

const rule: RuleModule = context => {
	return {
		enterHtmlAttribute(node: HtmlNodeAttr) {
			const { assignment } = node;

			if (assignment == null) {
				return;
			}

			const { program, document } = context;
			const htmlAttrTarget = context.htmlStore.getHtmlAttrTarget(node);

			if (node.modifier === LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER && htmlAttrTarget) {
				const types = extractAttributeTypes(context, node);
				if (!types) {
					return;
				}

				const { typeA, typeB } = types;

				if (!isAssignableToType(typeA, { kind: SimpleTypeKind.BOOLEAN }, program)) {
					context.reports.push({
						kind: LitHtmlDiagnosticKind.BOOL_MOD_ON_NON_BOOL,
						message: `You are using a boolean binding on a non boolean type '${toTypeString(typeA)}'`,
						severity: litDiagnosticRuleSeverity(context.config, "no-invalid-boolean-binding"),
						source: "no-invalid-boolean-binding",
						location: { document, ...node.location.name },
						htmlAttr: node,
						typeA,
						typeB
					});
				}
			}
		}
	};
};

export default rule;
