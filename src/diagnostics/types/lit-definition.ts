import { AttributeDeclaration, ComponentDeclaration, PropertyDeclaration } from "../../parsing/web-component-analyzer/types/component-types";
import { EventDeclaration } from "../../parsing/web-component-analyzer/types/event-types";
import { Range } from "../../types/range";

export enum DefinitionKind {
	COMPONENT = "COMPONENT",
	ATTRIBUTE = "ATTRIBUTE",
	PROPERTY = "PROPERTY",
	EVENT = "EVENT"
}

export interface DefinitionBase {
	fromRange: Range;
}

export interface DefinitionComponent extends DefinitionBase {
	kind: DefinitionKind.COMPONENT;
	target: ComponentDeclaration;
}

export interface DefinitionAttribute extends DefinitionBase {
	kind: DefinitionKind.ATTRIBUTE;
	target: AttributeDeclaration;
}

export interface DefinitionProperty extends DefinitionBase {
	kind: DefinitionKind.PROPERTY;
	target: PropertyDeclaration;
}

export interface DefinitionEvent extends DefinitionBase {
	kind: DefinitionKind.EVENT;
	target: EventDeclaration;
}

export type LitDefinition = DefinitionComponent | DefinitionAttribute | DefinitionProperty | DefinitionEvent;
