import * as tsModule from "typescript";
import { Node, TypeChecker } from "typescript";
import { ComponentParsingDiagnostic } from "../types/component-diagnostics";
import { ComponentDeclarationAttr, ComponentDeclarationProp } from "../types/component-types";

export interface ParseVisitContext {
	checker: TypeChecker;
	ts: typeof tsModule;
	emitDiagnostics(diagnostic: ComponentParsingDiagnostic): void;
}

export interface ParseVisitContextComponentDefinition extends ParseVisitContext {
	emitDefinition(tagName: string, definitionNode: Node, declarationNode: Node): void;
}

export interface ParseVisitContextComponentDeclaration extends ParseVisitContext {
	emitDeclarationNode(node: Node, name?: string): void;
	emitProp(prop: ComponentDeclarationProp): void;
	emitAttr(attr: ComponentDeclarationAttr): void;
	emitExtends(node: Node): void;
}

export interface VisitComponentDefinitionResult {
	name: string;
	definitionNode: Node;
	declarationNode: Node;
}

export interface ParseComponentFlavor {
	visitComponentDefinitions?(node: Node, context: ParseVisitContextComponentDefinition): void;
	visitComponentDeclaration?(node: Node, context: ParseVisitContextComponentDeclaration): void;

	visitEventDefinitions?(node: Node, context: ParseVisitContext): void;
	visitEventDeclaration?(node: Node, context: ParseVisitContext): void;
}
