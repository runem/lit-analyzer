import { RuleModule } from "../analyze/types/rule-module";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNode, HtmlNodeKind } from "../analyze/types/html-node/html-node-types";
import { HtmlNodeAttr, HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types";

const rule: RuleModule = context => {
	return {
		enterHtmlAttribute(node: HtmlNodeAttr) {
			const { assignment } = node;

			if (
				assignment == null ||
				node.kind !== HtmlNodeAttrKind.ATTRIBUTE ||
				assignment.kind !== HtmlNodeAttrAssignmentKind.STRING ||
				node.name !== "slot"
			) {
				return;
			}

			// Check for slots
			const parent = node.htmlNode.parent;

			if (parent != null) {
				const parentHtmlTag = context.htmlStore.getHtmlTag(parent.tagName);

				if (parentHtmlTag != null && parentHtmlTag.slots.length > 0) {
					const slotName = assignment.value;
					const slots = Array.from(context.htmlStore.getAllSlotsForTag(parentHtmlTag.tagName));
					const matchingSlot = slots.find(slot => slot.name === slotName);

					if (matchingSlot == null) {
						const validSlotNames = slots.map(s => s.name);
						const message =
							validSlotNames.length === 1 && validSlotNames[0].length === 0
								? `Invalid slot name '${slotName}'. Only the unnamed slot is valid for <${parentHtmlTag.tagName}>`
								: `Invalid slot name '${slotName}'. Valid slot names for <${parentHtmlTag.tagName}> are: ${validSlotNames
										.map(n => `'${n}'`)
										.join(" | ")}`;

						context.reports.push({
							kind: LitHtmlDiagnosticKind.INVALID_SLOT_NAME,
							message,
							validSlotNames,
							source: "no-unknown-slot",
							severity: litDiagnosticRuleSeverity(context.config, "no-unknown-slot"),
							location: { document: context.document, ...node.location.name }
						});
					}
				}
			}
		},
		enterHtmlNode(node: HtmlNode) {
			if (node.kind !== HtmlNodeKind.NODE) {
				return;
			}

			const slots = node.parent && Array.from(context.htmlStore.getAllSlotsForTag(node.parent.tagName));
			if (slots != null && slots.length > 0) {
				const slotAttr = node.attributes.find(a => a.name === "slot");
				if (slotAttr == null) {
					const unnamedSlot = slots.find(s => s.name === "");
					if (unnamedSlot == null) {
						context.reports.push({
							kind: LitHtmlDiagnosticKind.MISSING_SLOT_ATTRIBUTE,
							validSlotNames: slots.map(s => s.name),
							htmlNode: node,
							message: `Missing slot attribute. Parent element <${node.tagName}> only allows named slots as children.`,
							severity: litDiagnosticRuleSeverity(context.config, "no-unknown-slot"),
							source: "no-unknown-slot",
							location: { document: context.document, ...node.location.name }
						});
					}
				}
			}
		}
	};
};

export default rule;
