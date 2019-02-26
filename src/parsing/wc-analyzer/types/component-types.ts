import { SimpleType } from "ts-simple-type";
import { Node, Type } from "typescript";
import { JsDoc } from "./js-doc";

export interface ComponentDeclarationProp {
	name: string;
	node: Node;
	type: Type | SimpleType;
	default?: string;
	required?: boolean;
	jsDoc?: JsDoc;
}

export interface ComponentDeclarationAttr {
	name: string;
	node: Node;
	type: Type | SimpleType;
	default?: string;
	required?: boolean;
	jsDoc?: JsDoc;
}

export interface ComponentDeclaration {
	node: Node;
	extends?: Node[];
	properties: ComponentDeclarationProp[];
	attributes: ComponentDeclarationAttr[];
	name?: string;
	jsDoc?: JsDoc;
}

export interface ComponentDefinition {
	node: Node;
	tagName: string;
	declaration: ComponentDeclaration;
}
