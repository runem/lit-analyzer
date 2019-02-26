import { isAssignableToSimpleTypeKind, SimpleTypeKind } from "ts-simple-type";
import { ParseVisitContext } from "../flavors/parse-component-flavor";
import { ComponentDeclarationAttr, ComponentDeclarationProp } from "../types/component-types";
import { TypeChecker } from "typescript";

function mergePropOrAttr(existing: ComponentDeclarationAttr, newest: ComponentDeclarationAttr, checker: TypeChecker): ComponentDeclarationAttr;
function mergePropOrAttr(existing: ComponentDeclarationProp, newest: ComponentDeclarationProp, checker: TypeChecker): ComponentDeclarationProp;
function mergePropOrAttr(
	existing: ComponentDeclarationAttr | ComponentDeclarationProp,
	newest: ComponentDeclarationAttr | ComponentDeclarationProp,
	checker: TypeChecker
): ComponentDeclarationAttr | ComponentDeclarationProp {
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

export function mergeProps(existingProps: ComponentDeclarationProp[], newProp: ComponentDeclarationProp, context: ParseVisitContext): ComponentDeclarationProp[] {
	const existingProp = existingProps.find(attr => attr.name === newProp.name);
	if (existingProp == null) return [...existingProps, newProp];
	const merged = mergePropOrAttr(existingProp, newProp, context.checker);
	return [...existingProps.filter(attr => attr !== existingProp), merged];
}

export function mergeAttributes(existingAttributes: ComponentDeclarationAttr[], newAttr: ComponentDeclarationAttr, context: ParseVisitContext): ComponentDeclarationAttr[] {
	const existingAttr = existingAttributes.find(attr => attr.name.toLowerCase() === newAttr.name.toLowerCase());
	if (existingAttr == null) return [...existingAttributes, newAttr];
	const merged = mergePropOrAttr(existingAttr, newAttr, context.checker);
	return [...existingAttributes.filter(attr => attr !== existingAttr), merged];
}
