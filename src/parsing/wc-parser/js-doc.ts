import * as tsModule from "typescript";
import { Node } from "typescript";

export interface ComponentDeclarationJsDocTag {
	tag: string;
	comment?: string;
}

export interface ComponentDeclarationJsDoc {
	comment?: string;
	tags?: ComponentDeclarationJsDocTag[];
}

export function visitJsDoc(node: Node, ts: typeof tsModule): ComponentDeclarationJsDoc | undefined {
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
