import * as tsModule from "typescript";
import { Node } from "typescript";
import { ComponentDeclaration } from "../types/component-types";
import { JsDoc } from "../types/js-doc";
import { parseJsDoc } from "./parse-js-doc";

export function extendComponentDeclarationWithJsDoc(declaration: ComponentDeclaration, ts: typeof tsModule): ComponentDeclaration {
	// Keep track of already parsed jsdocs (multiple attrs/props can share the same node)
	const map = new WeakMap<Node, JsDoc | undefined>();

	let declarationJsDoc = parseJsDoc(declaration.node, ts);

	// Merge jsdoc tags from prototype chain
	for (const extendsNode of declaration.extends || []) {
		const jsDoc = parseJsDoc(extendsNode, ts);
		if (jsDoc == null || jsDoc.tags == null) continue;

		if (declarationJsDoc == null) {
			declarationJsDoc = { tags: jsDoc.tags };
		} else {
			const uniqueTags = declarationJsDoc.tags == null ? jsDoc.tags : jsDoc.tags.filter(a => declarationJsDoc!.tags!.find(b => a.tag === b.tag && a.comment === b.comment) == null);

			declarationJsDoc = {
				...declarationJsDoc,
				tags: [...(declarationJsDoc.tags || []), ...uniqueTags]
			};
		}
	}

	return {
		...declaration,
		jsDoc: declarationJsDoc,
		attributes: declaration.attributes.map(attr => {
			const jsDoc = map.has(attr.node) ? map.get(attr.node) : parseJsDoc(attr.node, ts);
			map.set(attr.node, jsDoc);
			return jsDoc == null ? attr : { ...attr, jsDoc };
		}),
		properties: declaration.properties.map(prop => {
			const jsDoc = map.has(prop.node) ? map.get(prop.node) : parseJsDoc(prop.node, ts);
			map.set(prop.node, jsDoc);
			return jsDoc == null ? prop : { ...prop, jsDoc };
		})
	};
}
