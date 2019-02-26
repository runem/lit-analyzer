import { Type, Node } from "typescript";
import { SimpleType } from "ts-simple-type";
import { ComponentDeclarationJsDoc } from "./js-doc";

export interface ComponentDeclarationProp {
	name: string;
	node: Node;
	type: Type | SimpleType;
	default?: string;
	required?: boolean;
	jsDoc?: ComponentDeclarationJsDoc;
}

export interface ComponentDeclarationAttr {
	name: string;
	node: Node;
	type: Type | SimpleType;
	default?: string;
	required?: boolean;
	jsDoc?: ComponentDeclarationJsDoc;
}

export interface ComponentDeclaration {
	node: Node;
	className?: string;
	jsDoc?: ComponentDeclarationJsDoc;
	properties: ComponentDeclarationProp[];
	attributes: ComponentDeclarationAttr[];
}

export interface ComponentDefinition {
	node: Node;
	tagName: string;
	declaration: ComponentDeclaration;
}

export interface CustomEventDeclaration {
	fileName: string;
}

export interface CustomEventDefinition {
	fileName: string;
	eventName: string;
	declaration: CustomEventDeclaration;
}

export interface ComponentParsingDiagnostic {
	message: string;
	severity: "low" | "medium" | "high";
	node: Node;
}

export interface ComponentParsingResult {
	fileName: string;
	componentDefinitions: ComponentDefinition[];
	eventsDefinitions: CustomEventDefinition[];
	diagnostics: ComponentParsingDiagnostic[];
}
