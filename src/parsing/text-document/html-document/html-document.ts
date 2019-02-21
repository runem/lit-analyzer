import { Range } from "../../../types/range";
import { intersects } from "../../../util/util";
import { VirtualAstHtmlDocument } from "../../virtual-document/virtual-html-document";
import { TextDocument } from "../text-document";
import { HtmlNodeAttr } from "./parse-html-node/types/html-node-attr-types";
import { HtmlNode } from "./parse-html-node/types/html-node-types";

export class HtmlDocument extends TextDocument {
	constructor(virtualDocument: VirtualAstHtmlDocument, public rootNodes: HtmlNode[]) {
		super(virtualDocument);
	}

	htmlAttrAreaAtOffset(offset: number | Range): HtmlNode | undefined {
		return this.mapFindOne(node => {
			if (offset > node.location.name.end && intersects(offset, node.location.startTag)) {
				// Check if the position intersects any attributes. Break if so.
				for (const htmlAttr of node.attributes) {
					if (intersects(offset, htmlAttr.location)) {
						return undefined;
					}
				}

				return node;
			}
		});
	}

	htmlAttrAssignmentAtOffset(offset: number | Range): HtmlNodeAttr | undefined {
		return this.findAttr(attr => (attr.assignment != null && attr.assignment.location != null ? intersects(offset, attr.assignment.location) : false));
	}

	htmlAttrNameAtOffset(offset: number | Range): HtmlNodeAttr | undefined {
		return this.findAttr(attr => intersects(offset, attr.location.name));
	}

	htmlNodeNameAtOffset(offset: number | Range): HtmlNode | undefined {
		return this.findNode(node => intersects(offset, node.location.name) || (node.location.endTag != null && intersects(offset, node.location.endTag)));
	}

	htmlNodeOrAttrAtOffset(offset: number | Range): HtmlNode | HtmlNodeAttr | undefined {
		const htmlNode = this.htmlNodeNameAtOffset(offset);
		if (htmlNode != null) return htmlNode;

		const htmlAttr = this.htmlAttrNameAtOffset(offset);
		if (htmlAttr != null) return htmlAttr;
	}

	findAttr(test: (node: HtmlNodeAttr) => boolean): HtmlNodeAttr | undefined {
		return this.mapFindOne(node => {
			for (const attr of node.attributes) {
				if (test(attr)) return attr;
			}
		});
	}

	findNode(test: (node: HtmlNode) => boolean): HtmlNode | undefined {
		return this.mapFindOne(node => {
			if (test(node)) return node;
		});
	}

	mapNodes<T>(map: (node: HtmlNode) => T): T[] {
		const items: T[] = [];

		function innerTest(node: HtmlNode) {
			items.push(map(node));
			node.children.forEach(childNode => innerTest(childNode));
		}

		this.rootNodes.forEach(rootNode => innerTest(rootNode));

		return items;
	}

	private mapFindOne<T>(map: (node: HtmlNode) => T | undefined): T | undefined {
		function innerTest(node: HtmlNode): T | undefined {
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
