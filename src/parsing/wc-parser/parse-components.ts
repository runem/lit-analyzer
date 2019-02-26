import { isAssignableToSimpleTypeKind, SimpleTypeKind } from "ts-simple-type";
import { Node, SourceFile, TypeChecker } from "typescript";
import { tsModule } from "../../ts-module";
import { logger } from "../../util/logger";
import { ComponentDeclaration, ComponentDeclarationAttr, ComponentDeclarationProp, ComponentParsingDiagnostic, ComponentParsingResult } from "./component-types";
import { CustomElementFlavor } from "./flavors/custom-element-flavor";
import { LitElementFlavor } from "./flavors/lit-element-flavor";
import { ParseComponentFlavor, ParseVisitContext, ParseVisitContextComponentDeclaration, ParseVisitContextComponentDefinition, VisitComponentDefinitionResult } from "./parse-component-flavor";

export function parseComponentInFile(sourceFile: SourceFile, checker: TypeChecker): ComponentParsingResult {
	const flavors = [new CustomElementFlavor(), new LitElementFlavor()];
	const context: ParseVisitContext = {
		checker,
		ts: tsModule.ts,
		emitDiagnostics(diagnostic: ComponentParsingDiagnostic): void {
			logger.error("Diagnostic", diagnostic.message, diagnostic.node.getSourceFile().fileName);
		}
	};

	const cmpDefResults = parseComponentDefinitionResults(sourceFile, flavors, context);
	logger.debug(cmpDefResults.map(r => r.name));
	const decl: ComponentDeclaration[] = [];
	for (const definition of cmpDefResults) {
		const declaration = parseComponentDeclaration(definition.declarationNode, flavors, context);
		decl.push(declaration);
	}

	logger.debug(decl.map(d => d.attributes.map(a => ({ ...a, node: {} as any }))));
	//parseEventDefinitions(sourceFile, flavors, context);

	return {
		fileName: sourceFile.fileName,
		componentDefinitions: [],
		eventsDefinitions: [],
		diagnostics: []
	};
}

export function mergeAttributes(existingAttributes: ComponentDeclarationAttr[], newAttr: ComponentDeclarationAttr, context: ParseVisitContext): ComponentDeclarationAttr[] {
	const existingAttr = existingAttributes.find(attr => attr.name.toLowerCase() === newAttr.name.toLowerCase());
	if (existingAttr == null) return [...existingAttributes, newAttr];
	const merged = mergePropOrAttr(existingAttr, newAttr, context.checker);
	return [...existingAttributes.filter(attr => attr !== existingAttr), merged];
}

export function mergePropOrAttr(existing: ComponentDeclarationAttr, newest: ComponentDeclarationAttr, checker: TypeChecker): ComponentDeclarationAttr;
export function mergePropOrAttr(existing: ComponentDeclarationProp, newest: ComponentDeclarationProp, checker: TypeChecker): ComponentDeclarationProp;
export function mergePropOrAttr(
	existing: ComponentDeclarationAttr | ComponentDeclarationProp,
	newest: ComponentDeclarationAttr | ComponentDeclarationProp,
	checker: TypeChecker
): ComponentDeclarationAttr | ComponentDeclarationProp {
	const merged = {
		...existing,
		node: newest.node,
		default: newest.default || existing.default,
		required: newest.required || existing.required
	};

	if (!isAssignableToSimpleTypeKind(newest.type, SimpleTypeKind.ANY, checker)) {
		merged.type = newest.type;
	}

	return merged;
}

export function mergeProps(existingProps: ComponentDeclarationProp[], newProp: ComponentDeclarationProp, context: ParseVisitContext): ComponentDeclarationProp[] {
	const existingProp = existingProps.find(attr => attr.name === newProp.name);
	if (existingProp == null) return [...existingProps, newProp];
	const merged = mergePropOrAttr(existingProp, newProp, context.checker);
	return [...existingProps.filter(attr => attr !== existingProp), merged];
}

export function parseComponentDeclaration(node: Node, flavors: ParseComponentFlavor[], context: ParseVisitContext): ComponentDeclaration {
	const declaration: ComponentDeclaration = {
		className: "",
		attributes: [],
		properties: [],
		jsDoc: {},
		node
	};

	const declarationContext: ParseVisitContextComponentDeclaration = {
		...context,
		emitClassJsDoc(className: string): void {},
		emitClassName(className: string): void {
			declaration.className = className;
		},
		emitAttr(attr: ComponentDeclarationAttr): void {
			declaration.attributes = mergeAttributes(declaration.attributes, attr, context);
		},
		emitProp(prop: ComponentDeclarationProp): void {
			declaration.properties = mergeProps(declaration.properties, prop, context);
		},
		emitExtends(node: Node): void {}
	};

	for (const flavor of flavors) {
		if (flavor.visitComponentDeclaration == null) continue;

		flavor.visitComponentDeclaration(node, declarationContext);
	}

	return declaration;
}

export function parseEventDefinitions(node: Node, flavors: ParseComponentFlavor[], context: ParseVisitContext): string[] {
	for (const flavor of flavors) {
		if (flavor.visitEventDefinitions == null) continue;

		flavor.visitEventDefinitions(node, context);
	}
	return [];
}

export function parseComponentDefinitionResults(node: Node, flavors: ParseComponentFlavor[], context: ParseVisitContext): VisitComponentDefinitionResult[] {
	const allResults: VisitComponentDefinitionResult[] = [];

	const definitionContext: ParseVisitContextComponentDefinition = {
		...context,
		emitDefinition(tagName: string, definitionNode: Node, declarationNode: Node): void {
			if (tagName !== "min-test") return;
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
