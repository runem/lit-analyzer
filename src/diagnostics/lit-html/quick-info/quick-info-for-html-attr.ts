import { descriptionForTarget, targetKindAndTypeText } from "../../../parsing/parse-html-data/html-tag";
import { HtmlNodeAttr } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-attr-types";
import { DiagnosticsContext } from "../../diagnostics-context";
import { LitQuickInfo } from "../../types/lit-quick-info";

export function quickInfoForHtmlAttr(htmlAttr: HtmlNodeAttr, { store }: DiagnosticsContext): LitQuickInfo | undefined {
	const target = store.getHtmlAttrTarget(htmlAttr);
	if (target == null) return undefined;

	return {
		range: htmlAttr.location.name,
		primaryInfo: targetKindAndTypeText(target, { modifier: htmlAttr.modifier }),
		secondaryInfo: descriptionForTarget(target, { markdown: true })
	};
}
