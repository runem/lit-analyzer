import { ComponentDeclaration, ComponentEvent, ComponentMember } from "web-component-analyzer";
import { SourceFileRange } from "./range";

export enum DefinitionKind {
	COMPONENT = "COMPONENT",
	MEMBER = "MEMBER",
	EVENT = "EVENT"
}

export interface DefinitionBase {
	fromRange: SourceFileRange;
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
	target: ComponentEvent;
}

export type LitDefinition = DefinitionComponent | DefinitionMember | DefinitionEvent;
