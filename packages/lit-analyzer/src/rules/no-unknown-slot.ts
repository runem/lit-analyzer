import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";

/**
 * This rule checks validates the slot attribute
 *   and makes sure that slot names used have been defined using jsdoc.
 */
const rule: RuleModule = {
	name: "no-unknown-slot",
	visitHtmlNode(htmlNode, { htmlStore, document, config }) {
		// This visitor function validates that a "slot" attribute is present on children elements if a slot name is required.

		// Get available slot names from the parent node of this node, because this node defined what slots are available.
		// Example: <my-element><input slot="footer" /></my-element>
		const slots = htmlNode.parent && Array.from(htmlStore.getAllSlotsForTag(htmlNode.parent.tagName));

		// Validate slots for this attribute if any slots have been defined on the parent element, else opt out.
		if (slots == null || slots.length === 0) return;

		// Find out if it's possible to use an unnamed slot.
		const unnamedSlot = slots.find(s => s.name === "");
		if (unnamedSlot == null) {
			// If it's not possible to use an unnamed slot, see if there is a "slot" attribute present.
			const slotAttr = htmlNode.attributes.find(a => a.name === "slot");
			if (slotAttr == null) {
				const parentTagName = (htmlNode.parent && htmlNode.parent.tagName) || "";
				// The slot attribute is missing, and it's not possible to use an unnamed slot.
				return [
					{
						kind: LitHtmlDiagnosticKind.MISSING_SLOT_ATTRIBUTE,
						validSlotNames: slots.map(s => s.name),
						htmlNode,
						message: `Missing slot attribute. Parent element <${parentTagName}> only allows named slots as children.`,
						severity: litDiagnosticRuleSeverity(config, "no-unknown-slot"),
						source: "no-unknown-slot",
						location: { document, ...htmlNode.location.name }
					}
				];
			}
		}

		return;
	},
	visitHtmlAssignment(assignment, request) {
		// This visitor function validates that the value of a "slot" attribute is valid.
		const { htmlAttr } = assignment;

		// Only validate attributes with the name "slot"
		if (htmlAttr.name !== "slot") return;

		// Only validate attributes that are bound to the attribute
		if (htmlAttr.kind !== HtmlNodeAttrKind.ATTRIBUTE) return;

		// Only validate assignments of kind "string"
		if (assignment.kind !== HtmlNodeAttrAssignmentKind.STRING) return;

		// Grab the parent node of this attribute. The parent node defines what slot names are valid.
		const parent = htmlAttr.htmlNode.parent;
		if (parent == null) return;

		// Validate slots for this attribute if any slots have been defined on the parent element, else opt out.
		const parentHtmlTag = request.htmlStore.getHtmlTag(parent.tagName);
		if (parentHtmlTag == null || parentHtmlTag.slots.length === 0) return;

		// Grab the slot name of the "slot" attribute.
		const slotName = assignment.value;

		// Find which slots names are valid, and find if the slot name matches any of these.
		const validSlots = Array.from(request.htmlStore.getAllSlotsForTag(parentHtmlTag.tagName));
		const matchingSlot = validSlots.find(slot => slot.name === slotName);

		if (matchingSlot == null) {
			// The slot name doesn't mach any slots! Generate a diagnostic.
			const validSlotNames = validSlots.map(s => s.name);
			const message =
				validSlotNames.length === 1 && validSlotNames[0].length === 0
					? `Invalid slot name '${slotName}'. Only the unnamed slot is valid for <${parentHtmlTag.tagName}>`
					: `Invalid slot name '${slotName}'. Valid slot names for <${parentHtmlTag.tagName}> are: ${validSlotNames.map(n => `'${n}'`).join(" | ")}`;

			return [
				{
					kind: LitHtmlDiagnosticKind.INVALID_SLOT_NAME,
					message,
					validSlotNames,
					source: "no-unknown-slot",
					severity: litDiagnosticRuleSeverity(request.config, "no-unknown-slot"),
					location: { document: request.document, ...htmlAttr.location.name }
				}
			];
		}

		return;
	}
};

export default rule;
