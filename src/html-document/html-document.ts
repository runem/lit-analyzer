import { TaggedTemplateExpression } from "typescript";
import { Range } from "../types/range";
import { intersects } from "../util/util";
import { VirtualDocument } from "../virtual-document/virtual-document";
import { IHtmlAttrBase } from "./types/html-attr-types";
import { IHtmlNodeBase } from "./types/html-node-types";

export class HTMLDocument {
	constructor(public virtualDocument: VirtualDocument, public astNode: TaggedTemplateExpression, public rootNodes: IHtmlNodeBase[], public location: Range) {}

	htmlAttrAreaAtPosition(position: number | Range): IHtmlNodeBase | undefined {
		return this.mapFindOne(node => {
			if (position > node.location.name.end && intersects(position, node.location.startTag)) {
				// Check if the position intersects any attributes. Break if so.
				for (const htmlAttr of node.attributes) {
					if (intersects(position, htmlAttr.location)) {
						return undefined;
					}
				}

				return node;
			}
		});
	}

	htmlAttrAssignmentAtPosition(position: number | Range): IHtmlAttrBase | undefined {
		return this.findAttr(attr => intersects(position, attr.location) && !intersects(position, attr.location.name));
	}

	htmlAttrAtPosition(position: number | Range): IHtmlAttrBase | undefined {
		return this.findAttr(attr => intersects(position, attr.location.name));
	}

	htmlNodeAtPosition(position: number | Range): IHtmlNodeBase | undefined {
		return this.findNode(node => intersects(position, node.location.name) || (node.location.endTag != null && intersects(position, node.location.endTag)));
	}

	htmlNodeOrAttrAtPosition(position: number | Range): IHtmlNodeBase | IHtmlAttrBase | undefined {
		const htmlNode = this.htmlNodeAtPosition(position);
		if (htmlNode != null) return htmlNode;

		const htmlAttr = this.htmlAttrAtPosition(position);
		if (htmlAttr != null) return htmlAttr;
	}

	findAttr(test: (node: IHtmlAttrBase) => boolean): IHtmlAttrBase | undefined {
		return this.mapFindOne(node => {
			for (const attr of node.attributes) {
				if (test(attr)) return attr;
			}
		});
	}

	findNode(test: (node: IHtmlNodeBase) => boolean): IHtmlNodeBase | undefined {
		return this.mapFindOne(node => {
			if (test(node)) return node;
		});
	}

	mapNodes<T>(map: (node: IHtmlNodeBase) => T): T[] {
		const items: T[] = [];

		function innerTest(node: IHtmlNodeBase) {
			items.push(map(node));
			node.children.forEach(childNode => innerTest(childNode));
		}

		this.rootNodes.forEach(rootNode => innerTest(rootNode));

		return items;
	}

	private mapFindOne<T>(map: (node: IHtmlNodeBase) => T | undefined): T | undefined {
		function innerTest(node: IHtmlNodeBase): T | undefined {
			const res = map(node);
			if (res) return res;

			for (const childNode of node.children || []) {
				const found = innerTest(childNode);
				if (found != null) return found;
			}
		}

		for (const rootNode of this.rootNodes || []) {
			const found = innerTest(rootNode);
			if (found != null) {
				return found;
			}
		}
	}
}
