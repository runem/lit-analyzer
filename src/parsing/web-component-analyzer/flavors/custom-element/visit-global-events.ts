import { SimpleTypeKind } from "ts-simple-type";
import { Node } from "typescript";
import { getExtendedModuleInterfaceKeys } from "../../util/ast-util";
import { ParseVisitContextGlobalEvents } from "../parse-component-flavor";

export function visitGlobalEvents(node: Node, context: ParseVisitContextGlobalEvents): void {
	const { ts } = context;

	// declare global { interface HTMLElementEventMap  { "my-event": CustomEvent<string>; } }
	if (ts.isModuleBlock(node)) {
		const extensions = getExtendedModuleInterfaceKeys(node, "HTMLElementEventMap", context);
		for (const [eventName] of extensions) {
			context.emitEvent({ type: { kind: SimpleTypeKind.ANY }, name: eventName, node });
		}

		return;
	}

	node.forEachChild(child => {
		visitGlobalEvents(child, context);
	});
}
