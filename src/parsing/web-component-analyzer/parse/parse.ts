import { Node, SourceFile } from "typescript";
import {
	ParseComponentFlavor,
	ParseVisitContext,
	ParseVisitContextComponentDeclaration,
	ParseVisitContextComponentDefinition,
	VisitComponentDefinitionResult
} from "../flavors/parse-component-flavor";
import { extendComponentDeclarationWithJsDoc } from "../js-doc/extend-with-js-doc";
import { ComponentDeclaration, AttributeDeclaration, PropertyDeclaration, ComponentDefinition } from "../types/component-types";
import { EventDeclaration } from "../types/event-types";
import { isNodeInLib } from "../util/ast-util";
import { mergeAttributes, mergeProps } from "./merge";

export function parseComponentDeclaration(node: Node, flavors: ParseComponentFlavor[], context: ParseVisitContext): ComponentDeclaration {
	const declaration: ComponentDeclaration = {
		attributes: [],
		properties: [],
		events: [],
		jsDoc: {},
		node
	};

	const declarationContext: ParseVisitContextComponentDeclaration = {
		...context,
		emitEvent(event: EventDeclaration): void {
			if (declaration.events.find(e => e.name === event.name)) return;
			declaration.events = [...declaration.events, event];
		},
		emitDeclarationNode(node: Node, name?: string): void {
			declaration.name = name;
			declaration.node = node;
		},
		emitAttr(attr: AttributeDeclaration): void {
			declaration.attributes = mergeAttributes(declaration.attributes, attr, context);
		},
		emitProp(prop: PropertyDeclaration): void {
			declaration.properties = mergeProps(declaration.properties, prop, context);
		},
		emitExtends(node: Node): void {
			declaration.extends = Array.from(new Set([...(declaration.extends || []), node]));
		}
	};
	for (const flavor of flavors) {
		if (flavor.visitComponentDeclaration == null) continue;

		flavor.visitComponentDeclaration(node, declarationContext);
	}

	return extendComponentDeclarationWithJsDoc(declaration, context.ts);
}

export function parseGlobalEvents(node: Node, flavors: ParseComponentFlavor[], context: ParseVisitContext): EventDeclaration[] {
	const globalEvents: EventDeclaration[] = [];

	for (const flavor of flavors) {
		if (flavor.visitGlobalEvents == null) continue;

		flavor.visitGlobalEvents(node, {
			...context,
			emitEvent(event: EventDeclaration): void {
				globalEvents.push(event);
			}
		});
	}

	return globalEvents;
}

export function parseComponentDefinitions(sourceFile: SourceFile, flavors: ParseComponentFlavor[], context: ParseVisitContext): ComponentDefinition[] {
	const componentDefinitions: ComponentDefinition[] = [];

	const definitionResults = parseComponentDefinitionResults(sourceFile, flavors, context);

	for (const definitionResult of definitionResults) {
		const declaration = parseComponentDeclaration(definitionResult.declarationNode, flavors, context);

		componentDefinitions.push({
			fromLib: isNodeInLib(sourceFile),
			tagName: definitionResult.name,
			node: definitionResult.definitionNode,
			declaration
		});
	}

	return componentDefinitions;
}

export function parseComponentDefinitionResults(node: Node, flavors: ParseComponentFlavor[], context: ParseVisitContext): VisitComponentDefinitionResult[] {
	const allResults: VisitComponentDefinitionResult[] = [];

	const definitionContext: ParseVisitContextComponentDefinition = {
		...context,
		emitDefinition(tagName: string, definitionNode: Node, declarationNode: Node): void {
			const existingDefinition = allResults.find(result => result.name === tagName);
			if (existingDefinition == null) {
				allResults.push({ declarationNode, definitionNode, name: tagName });
			}
		}
	};

	for (const flavor of flavors) {
		if (flavor.visitComponentDefinitions == null) continue;

		flavor.visitComponentDefinitions(node, definitionContext);
	}

	return allResults;
}
