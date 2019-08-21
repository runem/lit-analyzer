import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";
import { extractBindingTypes } from "../analyze/util/type/extract-binding-types";
import { getDirective } from "../analyze/util/directive/get-directive";

const rule: RuleModule = {
	name: "no-invalid-directive-binding",
	visitHtmlAssignment(assignment, request) {
		const { htmlAttr } = assignment;

		const { typeA, typeB } = extractBindingTypes(assignment, request);

		const directive = getDirective(assignment, { typeA, typeB }, request);
		if (directive == null) return;

		const { document } = request;

		if (typeof directive.kind === "string") {
			switch (directive.kind) {
				case "ifDefined":
					// Example: html`<img src="${ifDefined(imageUrl)}">`;
					// Take the argument to ifDefined and remove undefined from the type union (if possible).
					// Then test if this result is now assignable to the attribute type.
					if (directive.args.length === 1) {
						// "ifDefined" only has an effect on "attribute" bindings
						if (htmlAttr.kind !== HtmlNodeAttrKind.ATTRIBUTE) {
							return [
								{
									kind: LitHtmlDiagnosticKind.DIRECTIVE_NOT_ALLOWED_HERE,
									source: "no-invalid-directive-binding",
									severity: litDiagnosticRuleSeverity(request.config, "no-invalid-directive-binding"),
									message: `The 'ifDefined' directive has no effect here.`,
									location: { document, ...htmlAttr.location.name }
								}
							];
						}
					}

					break;

				case "classMap":
					// Report error if "classMap" is not being used on the "class" attribute.
					if (htmlAttr.name !== "class" || htmlAttr.kind !== HtmlNodeAttrKind.ATTRIBUTE) {
						return [
							{
								kind: LitHtmlDiagnosticKind.DIRECTIVE_NOT_ALLOWED_HERE,
								message: `The 'classMap' directive can only be used in an attribute binding for the 'class' attribute`,
								source: "no-invalid-directive-binding",
								severity: litDiagnosticRuleSeverity(request.config, "no-invalid-directive-binding"),
								location: { document, ...htmlAttr.location.name }
							}
						];
					}
					break;

				case "styleMap":
					// Report error if "styleMap" is not being used on the "style" attribute.
					if (htmlAttr.name !== "style" || htmlAttr.kind !== HtmlNodeAttrKind.ATTRIBUTE) {
						return [
							{
								kind: LitHtmlDiagnosticKind.DIRECTIVE_NOT_ALLOWED_HERE,
								message: `The 'styleMap' directive can only be used in an attribute binding for the 'style' attribute`,
								source: "no-invalid-directive-binding",
								severity: litDiagnosticRuleSeverity(request.config, "no-invalid-directive-binding"),
								location: { document, ...htmlAttr.location.name }
							}
						];
					}
					break;

				case "unsafeHTML":
				case "cache":
				case "repeat":
				case "asyncReplace":
				case "asyncAppend":
					// These directives can only be used within a text binding.
					// This function validating assignments is per definition used NOT in a text binding
					return [
						{
							kind: LitHtmlDiagnosticKind.DIRECTIVE_NOT_ALLOWED_HERE,
							message: `The '${directive.kind}' directive can only be used within a text binding.`,
							source: "no-invalid-directive-binding",
							severity: litDiagnosticRuleSeverity(request.config, "no-invalid-directive-binding"),
							location: { document, ...htmlAttr.location.name }
						}
					];
			}
		} else {
			// Now we have an unknown (user defined) directive.
			// Return empty array and opt out of any more type checking for this directive
			return [];
		}

		return;
	}
};

export default rule;
