import { Node } from "typescript";
import { ParseComponentFlavor, ParseVisitContextComponentDeclaration, ParseVisitContextComponentDefinition } from "../parse-component-flavor";
import { visitComponentDeclaration } from "./custom-element/visit-component-declaration";
import { visitComponentDefinitions } from "./custom-element/visit-component-definitions";
import { visitEventDefinitions } from "./custom-element/visit-event-definitions";

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

	visitEventDefinitions(node: Node, context: ParseVisitContextComponentDefinition): void {
		visitEventDefinitions(node, context);
	}
}
