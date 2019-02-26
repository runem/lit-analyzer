import * as tsModule from "typescript";
import { Node } from "typescript";
import { JsDoc } from "../types/js-doc";

export function parseJsDoc(node: Node, ts: typeof tsModule): JsDoc | undefined {
	const docs = ((node as any).jsDoc as any[]) || [];

	for (const doc of docs) {
		if (ts.isJSDoc(doc)) {
			return {
				comment: doc.comment == null ? undefined : String(doc.comment),
				tags:
					doc.tags == null
						? []
						: doc.tags.map(tag => ({
								tag: String(tag.tagName.escapedText),
								comment: tag.comment == null ? undefined : String(tag.comment)
						  }))
			};
		}
	}
}
