import { SourceFile } from "typescript";
import { Range } from "../../types/range";
import { TsModule } from "../../types/ts-module";
import { findParent, getNodeAtPosition } from "../../util/ast-util";
import { HTMLDocument } from "./html-document";

export class HtmlDocumentCollection {
	constructor(public sourceFile: SourceFile, public htmlDocuments: HTMLDocument[], private ts: TsModule) {}

	intersectingHtmlDocument(position: number | Range): HTMLDocument | undefined {
		const token = getNodeAtPosition(this.sourceFile, position);
		const node = findParent(token, this.ts.isTaggedTemplateExpression);

		if (node != null) {
			const start = node.getStart();
			return this.htmlDocuments.find(htmlDocument => htmlDocument.location.start === start);
		}
	}
}
