import { Node } from "typescript";
import { ComponentMember } from "web-component-analyzer";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { LitAnalyzerRequest } from "../analyze/lit-analyzer-context";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";
import { isValidAttributeName } from "../analyze/util/is-valid-name";
import { rangeFromNode } from "../analyze/util/lit-range-util";

const rule: RuleModule = {
	name: "no-invalid-attribute-name",

	visitComponentMember(member: ComponentMember, request: LitAnalyzerRequest): LitHtmlDiagnostic[] | void {
		// Check if the tag name is invalid
		let attrName: undefined | string;
		let attrNameNode: undefined | Node;

		if (member.kind === "attribute") {
			attrName = member.attrName;
			attrNameNode = member.node;
		} else if (typeof member.meta?.attribute === "string") {
			attrName = member.meta.attribute;
			attrNameNode = member.meta.node?.attribute || member.node;
		}

		if (attrName != null && attrNameNode != null && !isValidAttributeName(attrName)) {
			return [
				{
					kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_NAME,
					source: "no-invalid-attribute-name",
					severity: litDiagnosticRuleSeverity(request.config, "no-invalid-attribute-name"),
					message: `'${attrName}' is not a valid attribute name.`,
					file: request.file,
					location: rangeFromNode(attrNameNode)
				}
			];
		}
	}
};

export default rule;
