import * as tsModule from "typescript";
import { Node, TypeChecker } from "typescript";
import { IComponentDeclaration, IComponentDeclarationMeta, IComponentDeclarationProp, IComponentsInFile } from "./component-types";
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

/**
 * Visits and parse component definitions and corresponding declarations.
 * @param node
 * @param checker
 * @param flavors
 */
export function parseComponents(node: Node, checker: TypeChecker, flavors = allFlavors): IComponentsInFile {
	const result: IComponentsInFile = {
		fileName: node.getSourceFile().fileName,
		components: new Map()
	};

	for (const flavor of flavors) {
		flavor.visitComponentDefinitions(node, {
			checker,
			ts: tsModule,
			addComponentDefinition(tagName: string, declarationNode: Node) {
				const element = parseComponent(declarationNode, checker, flavors);
				result.components.set(tagName, element);
			}
		});
	}

	return result;
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
