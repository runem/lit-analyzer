import { type SimpleType, typeToString } from "ts-simple-type";
import { HtmlNodeAttr } from "../../../analyze/types/html-node/html-node-attr-types.js";
import { RuleModuleContext } from "../../../analyze/types/rule/rule-module-context.js";
import { rangeFromHtmlNodeAttr } from "../../../analyze/util/range-util.js";
import { isAssignableBindingUnderSecuritySystem } from "./is-assignable-binding-under-security-system.js";
import { isAssignableToType } from "./is-assignable-to-type.js";
import { type ExtractedBindingTypes } from "./extract-binding-types.js";
import { type TypeChecker, type Type, type TypeReference } from "typescript";

interface ModernTypeChecker extends TypeChecker {
	isTypeAssignableTo(typeA: Type, typeB: Type): boolean;
	getUnionType(types: Type[]): Type;
}

function isModernTypeChecker(checker: Partial<ModernTypeChecker>): checker is ModernTypeChecker {
	return typeof checker.isTypeAssignableTo === "function" && typeof checker.getUnionType === "function";
}

function isTypeScriptType(type: Type | SimpleType | undefined): type is Type {
	return type !== undefined && typeof (type as Type).flags === "number";
}

export function isAssignableInPropertyBinding(
	htmlAttr: HtmlNodeAttr,
	{ typeA, typeB, rawTypeB: typeAReal, rawTypeA: typeBReal }: ExtractedBindingTypes,
	context: RuleModuleContext
): boolean | undefined {
	const securitySystemResult = isAssignableBindingUnderSecuritySystem(htmlAttr, { typeA, typeB }, context);
	if (securitySystemResult !== undefined) {
		// The security diagnostics take precedence here,
		//   and we should not do any more checking.
		return securitySystemResult;
	}

	// Try to use the real type checker.
	let isAssignable, typeAString, typeBString;
	const checker = context.program.getTypeChecker();
	if (isTypeScriptType(typeAReal) && isTypeScriptType(typeBReal) && isModernTypeChecker(checker)) {
		// if we have two real TypeScript types, use the TypeScript type checker
		// to check if they're assignable.
		typeAReal = removeSpecialLitSymbols(typeAReal, checker);
		isAssignable = checker.isTypeAssignableTo(typeAReal, typeBReal);
		if (!isAssignable && hasUnresolvedTypeParameters(typeBReal, checker, context.ts, new Set())) {
			// If we're assigning into a generic type, we'd ideally
			// try to reify that generic type, to ensure that
			// multiple bindings are mutually consistent, and that
			// if there are constraints on the generic that we can
			// satisfy them.
			//
			// But for now, we'll just give up and allow it.
			isAssignable = true;
		}
		if (!isAssignable) {
			typeAString = checker.typeToString(typeAReal);
			typeBString = checker.typeToString(typeBReal);
		}
	} else {
		isAssignable = isAssignableToType({ typeA, typeB }, context);
		if (!isAssignable) {
			typeAString = typeToString(typeA);
			typeBString = typeToString(typeB);
		}
	}
	if (!isAssignable) {
		context.report({
			location: rangeFromHtmlNodeAttr(htmlAttr),
			message: `Type '${typeAString}' is not assignable to '${typeBString}'`
		});

		return false;
	}

	return true;
}

/**
 * Returns true if the type is the 'nothing' or 'noChange' unique symbol, or
 * a DirectiveResult, which are always permitted in any binding.
 */
function isAlwaysAllowedLitValue(type: Type) {
	if (!type.symbol) {
		return false;
	}
	const name = type.symbol.escapedName;
	if (name !== "noChange" && name !== "nothing" && name !== "DirectiveResult") {
		return false;
	}
	const declarations = type.symbol.getDeclarations();
	let declaredInLit = false;
	if (declarations != null) {
		for (let i = 0; i < declarations.length; i++) {
			const sourceFile = declarations[i].getSourceFile();
			if (sourceFile.fileName.includes("/lit-html/")) {
				declaredInLit = true;
				break;
			}
		}
	}
	if (!declaredInLit) {
		return false;
	}
	if (name === "DirectiveResult") {
		// Future enhancement: could we get the return type of the directive's render method,
		// and check that against the type of the binding?
		return true;
	}
	// The type must be a unique symbol.
	if ((type.flags & 8192) /* ts.TypeFlags.UniqueESSymbol */ !== 0) {
		return true;
	}

	return false;
}

/**
 * Returns the type with any special Lit values removed.
 *
 * So, it turns `nothing` into `any`, and `string | null | nothing` into `string | null`.
 */
function removeSpecialLitSymbols(type: Type, checker: ModernTypeChecker): Type {
	if (isAlwaysAllowedLitValue(type)) {
		// Assignable to anything.
		return checker.getAnyType();
	}
	// Otherwise we just need to remove special values from unions.
	if (!type.isUnion()) {
		return type;
	}
	// Check if any of the types are special. If so we need to return
	// a new union without.
	let hasSpecial = false;
	for (let i = 0; i < type.types.length; i++) {
		if (isAlwaysAllowedLitValue(type.types[i])) {
			hasSpecial = true;
			break;
		}
	}
	if (!hasSpecial) {
		return type;
	}
	const newUnion = [];
	for (let i = 0; i < type.types.length; i++) {
		if (!isAlwaysAllowedLitValue(type.types[i])) {
			newUnion.push(type.types[i]);
		}
	}
	if (newUnion.length === 0) {
		// Was a union of only special values, so return `any`, same as
		// if it was just a special value.
		return checker.getAnyType();
	}
	if (newUnion.length === 1) {
		return newUnion[0];
	}
	return checker.getUnionType(newUnion);
}

/**
 * Does the given type reference any unresolved type parameters?
 *
 * So, e.g. Array<string> would return false, but Array<T> on a field where T is a type
 * parameter on the class would return true.
 */
function hasUnresolvedTypeParameters(type: Type, checker: ModernTypeChecker, ts: typeof import("typescript"), visited: Set<Type> = new Set()) {
	if (visited.has(type)) {
		return false;
	}
	visited.add(type);

	// Is the type itself an unresolved type parameter? i.e. just `T`
	if ((type.flags & ts.TypeFlags.TypeParameter) !== 0) {
		return true;
	}

	// Intersections (`string & T`) and unions (`string | T`).
	if (type.isUnion()) {
		for (let i = 0; i < type.types.length; i++) {
			if (hasUnresolvedTypeParameters(type.types[i], checker, ts, visited)) {
				return true;
			}
		}
		return false;
	}
	if (type.isIntersection()) {
		for (let i = 0; i < type.types.length; i++) {
			if (hasUnresolvedTypeParameters(type.types[i], checker, ts, visited)) {
				return true;
			}
		}
		return false;
	}

	// Type args, like Array<T>.
	const typeArgs = (type as Partial<TypeReference>).typeArguments;
	if (typeArgs && typeArgs.length > 0) {
		if (typeArgs.some(t => hasUnresolvedTypeParameters(t, checker, ts, visited))) {
			return true;
		}
	}

	// Call signatures, like { (x: T): string; } or { (x: string): T; }
	const callSignature = type.getCallSignatures();
	if (callSignature != null) {
		for (let i = 0; i < callSignature.length; i++) {
			const signature = callSignature[i];
			if (signature.typeParameters != null) {
				return true;
			}
			for (let j = 0; j < signature.parameters.length; j++) {
				const paramType = checker.getTypeOfSymbol(signature.parameters[j]);
				if (hasUnresolvedTypeParameters(paramType, checker, ts, visited)) {
					return true;
				}
			}

			const returnType = signature.getReturnType();
			if (returnType) {
				if (hasUnresolvedTypeParameters(returnType, checker, ts, visited)) {
					return true;
				}
			}
		}
	}

	// Properties, like { x: T; }.
	const properties = type.getProperties();
	if (properties != null) {
		for (let i = 0; i < properties.length; i++) {
			const property = checker.getTypeOfSymbol(properties[i]);
			if (hasUnresolvedTypeParameters(property, checker, ts, visited)) {
				return true;
			}
		}
	}

	// Index signatures, like { [key: string]: T; }.
	const indexInfos = checker.getIndexInfosOfType(type);
	if (indexInfos != null) {
		for (let i = 0; i < indexInfos.length; i++) {
			const indexInfo = indexInfos[i];
			if (hasUnresolvedTypeParameters(indexInfo.keyType, checker, ts, visited)) {
				return true;
			}
			if (hasUnresolvedTypeParameters(indexInfo.type, checker, ts, visited)) {
				return true;
			}
		}
	}

	// TODO: tuples?

	return false;
}
