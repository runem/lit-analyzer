import * as tsModule from "typescript";
import { Node, SourceFile, TypeChecker } from "typescript";
import { logger } from "../../util/logger";
import { parseComponentsInFile } from "../web-component-analyzer/parse-components-in-file";
import { IComponentDeclaration, IComponentDeclarationMeta, IComponentDeclarationProp, IComponentDefinition } from "./component-types";
import { CustomElementFlavor } from "./flavors/custom-element-flavor";
import { LitElementFlavor } from "./flavors/lit-element-flavor";

export interface IComponentDeclarationVisitContext {
	checker: TypeChecker;
	ts: typeof tsModule;
	addProp(prop: IComponentDeclarationProp): void;
	addMeta(meta: IComponentDeclarationMeta): void;
}

export interface IComponentDefinitionVisitContext {
	checker: TypeChecker;
	ts: typeof tsModule;
	addComponentDefinition(tagName: string, declarationNode: Node): void;
}

export interface IParseComponentFlavor {
	visitComponentDefinitions(node: Node, context: IComponentDefinitionVisitContext): void;
	visitComponentDeclaration(node: Node, context: IComponentDeclarationVisitContext): void;
}

const allFlavors: IParseComponentFlavor[] = [new LitElementFlavor(), new CustomElementFlavor()];

const cache = new WeakMap<Node, IComponentDeclaration>();

/**
 * Visits and parse component definitions and corresponding declarations.
 * @param node
 * @param checker
 * @param flavors
 */
export function parseComponents(node: Node, checker: TypeChecker, flavors = allFlavors): IComponentDefinition[] {
	const result = parseComponentsInFile(node as SourceFile, checker);
	if (result.componentDefinitions.length > 0) {
		logger.debug(result.componentDefinitions);
		logger.debug(result.componentDefinitions[0].declaration.properties.map(p => p.name));
		logger.debug(result.componentDefinitions[0].declaration.attributes.map(p => p.name));
		logger.debug(result.componentDefinitions[0].declaration.jsDoc);
	}

	if (1 === 1) return [];
	const components: IComponentDefinition[] = [];

	for (const flavor of flavors) {
		flavor.visitComponentDefinitions(node, {
			checker,
			ts: tsModule,
			addComponentDefinition(tagName: string, declarationNode: Node) {
				// Always return the same component declaration result for the same node
				// This makes it possible for multiple tag names to share the same component declaration.
				const declaration = cache.get(declarationNode) || parseComponent(declarationNode, checker, flavors);
				cache.set(declarationNode, declaration);

				components.push({
					fileName: node.getSourceFile().fileName,
					tagName,
					declaration
				});
			}
		});
	}

	return components;
}

/**
 * Parses a single component declaration from a node.
 * @param node
 * @param checker
 * @param flavors
 */
function parseComponent(node: Node, checker: TypeChecker, flavors: IParseComponentFlavor[]): IComponentDeclaration {
	const component: IComponentDeclaration = {
		fileName: node.getSourceFile().fileName,
		props: [],
		meta: {},
		location: {
			start: node.getStart(),
			end: node.getEnd()
		}
	};

	for (const flavor of flavors) {
		flavor.visitComponentDeclaration(node, {
			checker,
			ts: tsModule,
			addMeta(meta: IComponentDeclarationMeta) {
				component.meta = meta;
			},
			addProp(prop: IComponentDeclarationProp) {
				component.props.push(prop);
			}
		});
	}

	return component;
}
