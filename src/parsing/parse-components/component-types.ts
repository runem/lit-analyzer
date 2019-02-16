import { Type } from "typescript";

export type ComponentTagName = string;

export interface ICustomElementSourceCodeLocation {
	start: number;
	end: number;
}

export interface IComponentDeclarationJsDocTag {
	tag: string;
	comment?: string;
}

export interface IComponentDeclarationJsDoc {
	comment?: string;
	tags?: IComponentDeclarationJsDocTag[];
}

export interface IComponentDeclarationProp {
	name: string;
	type: Type;
	default?: string;
	required: boolean;
	jsDoc?: IComponentDeclarationJsDoc;
	location: ICustomElementSourceCodeLocation;
}

export interface IComponentDeclarationMeta {
	className?: string;
	jsDoc?: IComponentDeclarationJsDoc;
}

export interface IComponentDeclaration {
	fileName: string;
	meta: IComponentDeclarationMeta;
	props: IComponentDeclarationProp[];
	location: ICustomElementSourceCodeLocation;
}

export interface IComponentDefinition {
	fileName: string;
	tagName: string;
	declaration: IComponentDeclaration;
}

export interface IComponentsInFile {
	fileName: string;
	components: Map<ComponentTagName, IComponentDeclaration>;
}
