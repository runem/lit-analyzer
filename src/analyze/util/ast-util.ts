import { Node } from "typescript";
import { tsModule } from "../ts-module";
import { Range } from "../types/range";
import { intersects } from "./general-util";

/**
 * Tests nodes recursively walking up the tree using parent nodes.
 * @param node
 * @param test
 */
export function findParent<T = Node>(node: Node | undefined, test: (node: Node) => boolean): T | undefined {
	if (node == null) return;
	return test(node) ? ((node as unknown) as T) : findParent(node.parent, test);
}

export function findChild<T = Node>(node: Node | undefined, test: (node: Node) => boolean): T | undefined {
	if (!node) return;
	if (test(node)) return (node as unknown) as T;
	return node.forEachChild(child => findChild(child, test));
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

export function nodeIntersects(nodeA: Node, nodeB: Node): boolean {
	return intersects(
		{
			start: nodeA.getStart(),
			end: nodeA.getEnd()
		},
		{
			start: nodeB.getStart(),
			end: nodeB.getEnd()
		}
	);
}

/**
 * Checks whether a leading comment includes a given search string.
 * @param text
 * @param pos
 * @param needle
 */
export function leadingCommentsIncludes(text: string, pos: number, needle: string): boolean {
	// Get the leading comments to the position.
	const leadingComments = tsModule.ts.getLeadingCommentRanges(text, pos);

	// If any leading comments exists, we check whether the needle matches the context of the comment.
	if (leadingComments != null) {
		for (const comment of leadingComments) {
			const commentText = text.substring(comment.pos, comment.end);
			if (commentText.includes(needle)) {
				return true;
			}
		}
	}
	return false;
}
