import { isAssignableToSimpleTypeKind, SimpleTypeKind } from "ts-simple-type";
import { ParseVisitContext } from "../flavors/parse-component-flavor";
import { AttributeDeclaration, PropertyDeclaration } from "../types/component-types";
import { TypeChecker } from "typescript";

function mergePropOrAttr(existing: AttributeDeclaration, newest: AttributeDeclaration, checker: TypeChecker): AttributeDeclaration;
function mergePropOrAttr(existing: PropertyDeclaration, newest: PropertyDeclaration, checker: TypeChecker): PropertyDeclaration;
function mergePropOrAttr(existing: AttributeDeclaration | PropertyDeclaration, newest: AttributeDeclaration | PropertyDeclaration, checker: TypeChecker): AttributeDeclaration | PropertyDeclaration {
	const merged = {
		...existing,
		node: newest.node,
		default: newest.default || existing.default,
		required: newest.required || existing.required
	};

	if (!isAssignableToSimpleTypeKind(newest.type, SimpleTypeKind.ANY, checker)) {
		merged.type = newest.type;
	}

	return merged;
}

export function mergeProps(existingProps: PropertyDeclaration[], newProp: PropertyDeclaration, context: ParseVisitContext): PropertyDeclaration[] {
	const existingProp = existingProps.find(attr => attr.name === newProp.name);
	if (existingProp == null) return [...existingProps, newProp];
	const merged = mergePropOrAttr(existingProp, newProp, context.checker);
	return [...existingProps.filter(attr => attr !== existingProp), merged];
}

export function mergeAttributes(existingAttributes: AttributeDeclaration[], newAttr: AttributeDeclaration, context: ParseVisitContext): AttributeDeclaration[] {
	const existingAttr = existingAttributes.find(attr => attr.name.toLowerCase() === newAttr.name.toLowerCase());
	if (existingAttr == null) return [...existingAttributes, newAttr];
	const merged = mergePropOrAttr(existingAttr, newAttr, context.checker);
	return [...existingAttributes.filter(attr => attr !== existingAttr), merged];
}
