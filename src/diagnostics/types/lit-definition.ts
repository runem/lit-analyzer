import { IComponentDeclaration, IComponentDeclarationProp } from "../../parsing/parse-components/component-types";
import { Range } from "../../types/range";

export enum DefinitionKind {
	COMPONENT = "COMPONENT"
}

export interface DefinitionComponent {
	kind: DefinitionKind.COMPONENT;
	fromRange: Range;
	targetClass: IComponentDeclaration;
	targetProp?: IComponentDeclarationProp;
}

export type LitDefinition = DefinitionComponent;
