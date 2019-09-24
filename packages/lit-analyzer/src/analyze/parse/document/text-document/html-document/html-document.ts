import { Range } from "../../../../types/range";
import { intersects } from "../../../../util/general-util";
import { VirtualAstHtmlDocument } from "../../virtual-document/virtual-html-document";
import { TextDocument } from "../text-document";
import { HtmlNodeAttr } from "../../../../types/html-node/html-node-attr-types";
import { HtmlNode } from "../../../../types/html-node/html-node-types";

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
			return;
		});
	}

	htmlAttrAssignmentAtOffset(offset: number | Range): HtmlNodeAttr | undefined {
		return this.findAttr(attr =>
			attr.assignment != null && attr.assignment.location != null ? intersects(offset, attr.assignment.location) : false
		);
	}

	htmlAttrNameAtOffset(offset: number | Range): HtmlNodeAttr | undefined {
		return this.findAttr(attr => intersects(offset, attr.location.name));
	}

	htmlNodeNameAtOffset(offset: number | Range): HtmlNode | undefined {
		return this.findNode(
			node => intersects(offset, node.location.name) || (node.location.endTag != null && intersects(offset, node.location.endTag))
		);
	}

	htmlNodeOrAttrAtOffset(offset: number | Range): HtmlNode | HtmlNodeAttr | undefined {
		const htmlNode = this.htmlNodeNameAtOffset(offset);
		if (htmlNode != null) return htmlNode;

		const htmlAttr = this.htmlAttrNameAtOffset(offset);
		if (htmlAttr != null) return htmlAttr;
		return;
	}

	/**
	 * Finds the closest node to offset.
	 * This method can be used to find out which tag to close in the HTML.
	 * @param offset
	 */
	htmlNodeClosestToOffset(offset: number): HtmlNode | undefined {
		let closestNode: HtmlNode | undefined = undefined;

		// Use 'findNode' to iterate nodes. Keep track of the closest node.
		this.findNode(node => {
			if (offset < node.location.startTag.end) {
				// Break as soon as we find a node that starts AFTER the offset.
				// The closestNode would now be the previous found node.
				return true;
			} else if (node.location.endTag == null || offset < node.location.endTag.end) {
				// Save closest node if the node doesn't have an end tag of the node ends AFTER the offset.
				closestNode = node;
			}
			return false;
		});

		return closestNode;
	}

	findAttr(test: (node: HtmlNodeAttr) => boolean): HtmlNodeAttr | undefined {
		return this.mapFindOne(node => {
			for (const attr of node.attributes) {
				if (test(attr)) return attr;
			}
			return;
		});
	}

	findNode(test: (node: HtmlNode) => boolean): HtmlNode | undefined {
		return this.mapFindOne(node => {
			if (test(node)) return node;
			return;
		});
	}

	mapNodes<T>(map: (node: HtmlNode) => T): T[] {
		const items: T[] = [];

		function childrenLoop(node: HtmlNode) {
			items.push(map(node));
			node.children.forEach(childNode => childrenLoop(childNode));
		}

		this.rootNodes.forEach(rootNode => childrenLoop(rootNode));

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
			return;
		}

		for (const rootNode of this.rootNodes || []) {
			const found = innerTest(rootNode);
			if (found != null) {
				return found;
			}
		}
		return;
	}
}
