import { Node } from "typescript";
import { tsModule } from "../ts-module";
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

/**
 * Checks whether a leading comment includes a given search string.
 * @param text
 * @param context
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
