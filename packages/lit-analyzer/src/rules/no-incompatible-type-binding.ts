import { isAssignableToType, toTypeString } from "ts-simple-type";
import { RuleModule } from "../analyze/types/rule-module";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeAttr } from "../analyze/types/html-node/html-node-attr-types";
import { extractAttributeTypes } from "../analyze/util/attribute-util";

const rule: RuleModule = context => {
	return {
		enterHtmlAttribute(node: HtmlNodeAttr) {
			const { assignment } = node;

			if (assignment == null) {
				return;
			}

			const { program, document } = context;
			const htmlAttrTarget = context.htmlStore.getHtmlAttrTarget(node);

			if (htmlAttrTarget) {
				const types = extractAttributeTypes(context, node);

				if (!types) {
					return;
				}

				const { typeA, typeB } = types;
				const inJsFile = context.file.fileName.endsWith(".js");

				if (!isAssignableToType(typeA, typeB, program, inJsFile ? { strict: false } : undefined)) {
					context.reports.push({
						kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE,
						message: `Type '${toTypeString(typeB)}' is not assignable to '${toTypeString(typeA)}'`,
						severity: litDiagnosticRuleSeverity(context.config, "no-incompatible-type-binding"),
						source: "no-incompatible-type-binding",
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
