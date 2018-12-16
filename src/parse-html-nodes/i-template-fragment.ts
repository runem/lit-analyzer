import { Node } from "typescript";

export interface ITemplateFragment {
	id: string;
	node: Node;
	isExpression: boolean;
}

/**
 * Creates a template fragment.
 * @param node
 * @param isExpression
 */
export function makeTemplateFragment(node: Node, { isExpression }: { isExpression: boolean } = { isExpression: false }): ITemplateFragment {
	return {
		id: Math.round(Math.random() * 100000).toString(),
		node,
		isExpression
	};
}

/**
 * Returns the text of a fragment.
 * @param fragment
 */
export function getFragmentText(fragment: ITemplateFragment): string {
	return fragment.isExpression ? `${fragment.id}` : fragment.node.getText();
}

/**
 * Returns the typescript source code location based on a template fragment.
 * @param fragments
 * @param pos
 */
export function getFragmentSourceCodeLocation(fragments: ITemplateFragment[], pos: number) {
	for (const fragment of fragments) {
		const text = getFragmentText(fragment);
		if (pos - text.length < 0) {
			return fragment.node.getStart() + pos;
		} else {
			pos -= text.length;
		}
	}
}
