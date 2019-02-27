import { Node } from "typescript";
import { ParseComponentFlavor, ParseVisitContextComponentDeclaration, ParseVisitContextComponentDefinition, ParseVisitContextGlobalEvents } from "../parse-component-flavor";
import { visitComponentDeclaration } from "./visit-component-declaration";
import { visitComponentDefinitions } from "./visit-component-definitions";
import { visitGlobalEvents } from "./visit-global-events";

/**
 * Flavor that can parse custom elements.
 */
export class CustomElementFlavor implements ParseComponentFlavor {
	visitComponentDefinitions(node: Node, context: ParseVisitContextComponentDefinition): void {
		visitComponentDefinitions(node, context);
	}

	visitComponentDeclaration(node: Node, context: ParseVisitContextComponentDeclaration): void {
		visitComponentDeclaration(node, context);
	}

	visitGlobalEvents(node: Node, context: ParseVisitContextGlobalEvents): void {
		visitGlobalEvents(node, context);
	}
}
