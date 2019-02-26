import { Node } from "typescript";
import { logger } from "../../../../util/logger";
import { ParseVisitContext } from "../parse-component-flavor";
import { getExtendedModuleInterfaceKeys } from "../../util/ast-util";

export function visitEventDefinitions(node: Node, context: ParseVisitContext): void {
	const { ts } = context;

	// declare global { interface HTMLElementEventMap  { "my-event": CustomEvent<string>; } }
	if (ts.isModuleBlock(node)) {
		const extensions = getExtendedModuleInterfaceKeys(node, "HTMLElementEventMap", context);
		for (const [eventName, declaration] of extensions) {
			logger.debug("Found event!", eventName, declaration.getText());
		}

		return;
	}

	node.forEachChild(child => {
		visitEventDefinitions(child, context);
	});
}
