import { SimpleType } from "ts-simple-type";
import { Node, Type } from "typescript";
import { EventDeclaration } from "./event-types";
import { JsDoc } from "./js-doc";

export interface PropertyDeclaration {
	name: string;
	node: Node;
	type: Type | SimpleType;
	default?: string;
	required?: boolean;
	jsDoc?: JsDoc;
}

export interface AttributeDeclaration {
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
	properties: PropertyDeclaration[];
	attributes: AttributeDeclaration[];
	events: EventDeclaration[];
	name?: string;
	jsDoc?: JsDoc;
}

export interface ComponentDefinition {
	fromLib: boolean;
	node: Node;
	tagName: string;
	declaration: ComponentDeclaration;
}
