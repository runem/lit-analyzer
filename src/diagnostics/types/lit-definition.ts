import { ComponentDeclaration, ComponentMember, EventDeclaration } from "web-component-analyzer";
import { Range } from "../../types/range";

export enum DefinitionKind {
	COMPONENT = "COMPONENT",
	MEMBER = "MEMBER",
	EVENT = "EVENT"
}

export interface DefinitionBase {
	fromRange: Range;
}

export interface DefinitionComponent extends DefinitionBase {
	kind: DefinitionKind.COMPONENT;
	target: ComponentDeclaration;
}

export interface DefinitionMember extends DefinitionBase {
	kind: DefinitionKind.MEMBER;
	target: ComponentMember;
}

export interface DefinitionEvent extends DefinitionBase {
	kind: DefinitionKind.EVENT;
	target: EventDeclaration;
}

export type LitDefinition = DefinitionComponent | DefinitionMember | DefinitionEvent;
