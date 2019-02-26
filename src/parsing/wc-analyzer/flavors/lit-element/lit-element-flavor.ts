import { Node } from "typescript";
import { ParseComponentFlavor, ParseVisitContextComponentDeclaration, ParseVisitContextComponentDefinition } from "../parse-component-flavor";
import { visitComponentDeclaration } from "./visit-component-declaration";
import { visitComponentDefinitions } from "./visit-component-definitions";

/**
 * Flavor that can parse lit-element.
 */
export class LitElementFlavor implements ParseComponentFlavor {
	visitComponentDefinitions(node: Node, context: ParseVisitContextComponentDefinition): void {
		visitComponentDefinitions(node, context);
	}

	visitComponentDeclaration(node: Node, context: ParseVisitContextComponentDeclaration): void {
		visitComponentDeclaration(node, context);
	}
}
