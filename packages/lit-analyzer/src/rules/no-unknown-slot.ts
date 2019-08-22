import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";

const rule: RuleModule = {
	name: "no-unknown-slot",
	visitHtmlNode(htmlNode, { htmlStore, document, config }) {
		const slots = htmlNode.parent && Array.from(htmlStore.getAllSlotsForTag(htmlNode.parent.tagName));

		if (slots != null && slots.length > 0) {
			const slotAttr = htmlNode.attributes.find(a => a.name === "slot");
			if (slotAttr == null) {
				const unnamedSlot = slots.find(s => s.name === "");
				if (unnamedSlot == null) {
					return [
						{
							kind: LitHtmlDiagnosticKind.MISSING_SLOT_ATTRIBUTE,
							validSlotNames: slots.map(s => s.name),
							htmlNode,
							message: `Missing slot attribute. Parent element <${htmlNode.tagName}> only allows named slots as children.`,
							severity: litDiagnosticRuleSeverity(config, "no-unknown-slot"),
							source: "no-unknown-slot",
							location: { document, ...htmlNode.location.name }
						}
					];
				}
			}
		}

		return;
	},
	visitHtmlAssignment(assignment, request) {
		if (assignment == null || assignment.kind !== HtmlNodeAttrAssignmentKind.STRING) return;
		const { htmlAttr } = assignment;

		if (htmlAttr.kind !== HtmlNodeAttrKind.ATTRIBUTE) return;
		if (htmlAttr.name !== "slot") return;

		const parent = htmlAttr.htmlNode.parent;
		if (parent != null) {
			const parentHtmlTag = request.htmlStore.getHtmlTag(parent.tagName);

			if (parentHtmlTag != null && parentHtmlTag.slots.length > 0) {
				const slotName = assignment.value;
				const slots = Array.from(request.htmlStore.getAllSlotsForTag(parentHtmlTag.tagName));
				const matchingSlot = slots.find(slot => slot.name === slotName);

				if (matchingSlot == null) {
					const validSlotNames = slots.map(s => s.name);
					const message =
						validSlotNames.length === 1 && validSlotNames[0].length === 0
							? `Invalid slot name '${slotName}'. Only the unnamed slot is valid for <${parentHtmlTag.tagName}>`
							: `Invalid slot name '${slotName}'. Valid slot names for <${parentHtmlTag.tagName}> are: ${validSlotNames
									.map(n => `'${n}'`)
									.join(" | ")}`;

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
			}
		}

		return;
	}
};

export default rule;
