import { ComponentMember } from "web-component-analyzer";
import { LitAnalyzerRequest } from "../analyze/lit-analyzer-context";
import { LitHtmlDiagnostic } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";

const rule: RuleModule = {
	name: "no-invalid-attribute-name",

	visitComponentMember(member: ComponentMember, request: LitAnalyzerRequest): LitHtmlDiagnostic[] | void {
		console.log(`component member`);
		// Check if the tag name is invalid
		if (member.meta != null) {
			console.log("found meta", member.meta.attribute);
		} else if (member.kind === "attribute") {
			console.log("found attr", member.attrName);
		}

		/*const node = iterableFirst(definition.tagNameNodes) || iterableFirst(definition.identifierNodes);

			// Only report diagnostic if the tag is not builtin
			const tag = request.htmlStore.getHtmlTag(definition.tagName);
			if (node != null && tag != null && !tag.builtIn) {
				return [
					{
						kind: LitHtmlDiagnosticKind.INVALID_TAG_NAME,
						source: "no-invalid-tag-name",
						severity: litDiagnosticRuleSeverity(request.config, "no-invalid-tag-name"),
						message: `This custom element tag name is invalid.`,
						file: request.file,
						location: rangeFromNode(node)
					}
				];
			}*/

		return [];
	}
};

export default rule;
