import { JsxClosingTagInfo, SourceFile } from "typescript";
import { HtmlNode, IHtmlTemplate } from "../../parse-html-nodes/types/html-node-types";
import { TsHtmlPluginStore } from "../../state/store";
import { getHtmlPositionInSourceFile } from "../../util/get-html-position";
import { iterateHtmlTemplate } from "../../util/iterate-html-template";

/**
 * Returns closing tag information based on html templates.
 * @param sourceFile
 * @param htmlTemplates
 * @param position
 * @param store
 */
export function getClosingTagFromHtmlTemplates(sourceFile: SourceFile, htmlTemplates: IHtmlTemplate[], position: number, store: TsHtmlPluginStore): JsxClosingTagInfo | undefined {
	// Loop through html templates finding the closest unclosed tag
	let closestMatch: [number, HtmlNode] | null = null;
	iterateHtmlTemplate(htmlTemplates, {
		getNodeItems(htmlNode: HtmlNode) {
			// Only look at non-closed tags
			if (!htmlNode.selfClosed && !htmlNode.location.endTag) {
				const thisDist = position - htmlNode.location.startTag.end;
				const [closestDist] = closestMatch || [thisDist];

				if (thisDist < 0) {
					// Only look at tags to the left of the position.
					return;
				} else if (!closestMatch || thisDist < closestDist) {
					// Save the new closest match
					closestMatch = [thisDist, htmlNode];
				}
			}
		}
	});

	if (closestMatch != null) {
		const res = getHtmlPositionInSourceFile(sourceFile, position, store);

		if (res != null) {
			const { beforeWord } = res;
			const [, htmlNode] = closestMatch as [number, HtmlNode];

			return {
				newText: `${beforeWord === "/" ? "" : "</"}${htmlNode.tagName}>`
			};
		}
	}
}
