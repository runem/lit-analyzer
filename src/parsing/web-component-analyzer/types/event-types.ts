import { SimpleType } from "ts-simple-type";
import { Node, Type } from "typescript";

export interface EventDeclaration {
	node: Node;
	type: SimpleType | Type;
	name: string;
}
