import * as tsModule from "typescript";
import { Node, TypeChecker } from "typescript";
import { ComponentParsingDiagnostic } from "../types/component-diagnostics";
import { AttributeDeclaration, PropertyDeclaration } from "../types/component-types";
import { EventDeclaration } from "../types/event-types";

export interface ParseVisitContext {
	checker: TypeChecker;
	ts: typeof tsModule;
	emitDiagnostics(diagnostic: ComponentParsingDiagnostic): void;
}

export interface ParseVisitContextComponentDefinition extends ParseVisitContext {
	emitDefinition(tagName: string, definitionNode: Node, declarationNode: Node): void;
}

export interface ParseVisitContextGlobalEvents extends ParseVisitContext {
	emitEvent(event: EventDeclaration): void;
}

export interface ParseVisitContextComponentDeclaration extends ParseVisitContext {
	emitExtends(node: Node): void;
	emitDeclarationNode(node: Node, name?: string): void;
	emitProp(prop: PropertyDeclaration): void;
	emitAttr(attr: AttributeDeclaration): void;
	emitEvent(event: EventDeclaration): void;
}

export interface VisitComponentDefinitionResult {
	name: string;
	definitionNode: Node;
	declarationNode: Node;
}

export interface ParseComponentFlavor {
	visitComponentDefinitions?(node: Node, context: ParseVisitContextComponentDefinition): void;
	visitComponentDeclaration?(node: Node, context: ParseVisitContextComponentDeclaration): void;

	visitGlobalEvents?(node: Node, context: ParseVisitContextGlobalEvents): void;
}
