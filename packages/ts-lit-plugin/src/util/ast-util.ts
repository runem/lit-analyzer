import { Identifier, Node } from "typescript";
import { tsModule } from "../ts-module";

/**
 * Returns the declaration name of a given node if possible.
 * @param node
 */
export function getNodeIdentifier(node: Node): Identifier | undefined {
	const ts = tsModule.ts;

	if (ts.isIdentifier(node)) {
		return node;
	} else if (
		(ts.isClassLike(node) ||
			ts.isInterfaceDeclaration(node) ||
			ts.isVariableDeclaration(node) ||
			ts.isMethodDeclaration(node) ||
			ts.isPropertyDeclaration(node) ||
			ts.isFunctionDeclaration(node)) &&
		node.name != null &&
		ts.isIdentifier(node.name)
	) {
		return node.name;
	}

	return undefined;
}
