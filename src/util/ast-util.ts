import { Node } from "typescript";
import { Range } from "../types/range";
import { intersects } from "./util";

/**
 * Tests nodes recursively walking up the tree using parent nodes.
 * @param node
 * @param test
 */
export function findParent(node: Node | undefined, test: (node: Node) => boolean): Node | undefined {
	if (node == null) return;
	return test(node) ? node : findParent(node.parent, test);
}

/**
 * Returns a node at a specific position.
 * @param node
 * @param position
 */
export function getNodeAtPosition(node: Node, position: number | Range): Node | undefined {
	if (!intersects(position, { start: node.pos, end: node.end })) {
		return;
	}

	return node.forEachChild(child => getNodeAtPosition(child, position)) || node;
}
