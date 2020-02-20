/*import { isAssignableToSimpleTypeKind, SimpleType, SimpleTypeKind, toSimpleType, toTypeString } from "ts-simple-type";
import { Node } from "typescript";
import { ComponentMember } from "web-component-analyzer";
import { LitElementPropertyConfig } from "web-component-analyzer/lib/cjs/lit-element-property-config-a6e5ad36";
import { LitAnalyzerRequest } from "../analyze/lit-analyzer-context";
import { LitHtmlDiagnostic } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";
import { lazy } from "../analyze/util/general-util";

const rule: RuleModule = {
	name: "no-invalid-property",

	visitComponentMember(member: ComponentMember, request: LitAnalyzerRequest): LitHtmlDiagnostic[] | void {
		if (member.meta == null) return;

		const checker = request.program.getTypeChecker();
		validateLitPropertyConfig(
			member.node,
			member.meta,
			{
				propName: member.propName || "",
				simplePropType: toSimpleType(member.node, checker)
			},
			request
		);

		return [];
	}
};*/

/**
 * Returns a string, that can be used in a lit @property decorator for the type key, representing the simple type kind.
 * @param simpleTypeKind
 */
/*function toLitPropertyTypeString(simpleTypeKind: SimpleTypeKind): string {
	switch (simpleTypeKind) {
		case SimpleTypeKind.STRING:
			return "String";
		case SimpleTypeKind.NUMBER:
			return "Number";
		case SimpleTypeKind.BOOLEAN:
			return "Boolean";
		case SimpleTypeKind.ARRAY:
			return "Array";
		case SimpleTypeKind.OBJECT:
			return "Object";
		default:
			return "";
	}
}*/

/**
 * Runs through a lit configuration and validates against the "simplePropType".
 * Emits diagnostics through the context.
 * @param node
 * @param litConfig
 * @param propName
 * @param simplePropType
 * @param request
 */
/*function validateLitPropertyConfig(
	node: Node,
	litConfig: LitElementPropertyConfig,
	{ propName, simplePropType }: { propName: string; simplePropType: SimpleType },
	request: LitAnalyzerRequest
) {
	// Check if "type" is one of the built in default type converter hint
	if (typeof litConfig.type === "string" && !litConfig.hasConverter) {
		console.log({ message: `'${litConfig.type}' is not a valid type for the default converter. Have you considered {attribute: false} instead?` });
		/*context.emitDiagnostics({
			node: (litConfig.node && litConfig.node.type) || node,
			message: `'${litConfig.type}' is not a valid type for the default converter. Have you considered {attribute: false} instead?`,
			severity: "warning"
		});
		return;
	}

	// Don't continue if we don't know the property type (eg if we are in a js file)
	// Don't continue if this property has a custom converter (because then we don't know how the value will be converted)
	if (simplePropType == null || litConfig.hasConverter || typeof litConfig.type === "string") {
		return;
	}

	// Test assignments to all possible type kinds
	const _isAssignableToCache = new Map<SimpleTypeKind, boolean>();
	function isAssignableTo(simpleTypeKind: SimpleTypeKind): boolean {
		if (_isAssignableToCache.has(simpleTypeKind)) {
			return _isAssignableToCache.get(simpleTypeKind)!;
		}

		if (simplePropType == null) {
			return false;
		}

		const result = (() => {
			switch (simpleTypeKind) {
				case SimpleTypeKind.STRING:
					return isAssignableToSimpleTypeKind(simplePropType, [SimpleTypeKind.STRING, SimpleTypeKind.STRING_LITERAL], { op: "or" });
				case SimpleTypeKind.NUMBER:
					return isAssignableToSimpleTypeKind(simplePropType, [SimpleTypeKind.NUMBER, SimpleTypeKind.NUMBER_LITERAL], { op: "or" });
				case SimpleTypeKind.BOOLEAN:
					return isAssignableToSimpleTypeKind(simplePropType, [SimpleTypeKind.BOOLEAN, SimpleTypeKind.BOOLEAN_LITERAL], { op: "or" });
				case SimpleTypeKind.ARRAY:
					return isAssignableToSimpleTypeKind(simplePropType, [SimpleTypeKind.ARRAY, SimpleTypeKind.TUPLE], { op: "or" });
				case SimpleTypeKind.OBJECT:
					return isAssignableToSimpleTypeKind(simplePropType, [SimpleTypeKind.OBJECT, SimpleTypeKind.INTERFACE], {
						op: "or"
					});
				case SimpleTypeKind.ANY:
					return isAssignableToSimpleTypeKind(simplePropType, SimpleTypeKind.ANY);
				default:
					return false;
			}
		})();

		_isAssignableToCache.set(simpleTypeKind, result);

		return result;
	}
	/*const isAssignableTo: Partial<Record<SimpleTypeKind, () => boolean>> = {
		[SimpleTypeKind.STRING]: lazy(() =>
			isAssignableToSimpleTypeKind(simplePropType, [SimpleTypeKind.STRING, SimpleTypeKind.STRING_LITERAL], { op: "or" })
		),
		[SimpleTypeKind.NUMBER]: lazy(() =>
			isAssignableToSimpleTypeKind(simplePropType, [SimpleTypeKind.NUMBER, SimpleTypeKind.NUMBER_LITERAL], { op: "or" })
		),
		[SimpleTypeKind.BOOLEAN]: lazy(() =>
			isAssignableToSimpleTypeKind(simplePropType, [SimpleTypeKind.BOOLEAN, SimpleTypeKind.BOOLEAN_LITERAL], { op: "or" })
		),
		[SimpleTypeKind.ARRAY]: lazy(() => isAssignableToSimpleTypeKind(simplePropType, [SimpleTypeKind.ARRAY, SimpleTypeKind.TUPLE], { op: "or" })),
		[SimpleTypeKind.OBJECT]: lazy(() =>
			isAssignableToSimpleTypeKind(simplePropType, [SimpleTypeKind.OBJECT, SimpleTypeKind.INTERFACE], {
				op: "or"
			})
		),
		[SimpleTypeKind.ANY]: lazy(() => isAssignableToSimpleTypeKind(simplePropType, SimpleTypeKind.ANY))
	};/

	// Collect type kinds that can be used in as "type" in the @property decorator
	const acceptedTypeKinds = lazy(() => {
		return [SimpleTypeKind.STRING, SimpleTypeKind.NUMBER, SimpleTypeKind.BOOLEAN, SimpleTypeKind.ARRAY, SimpleTypeKind.OBJECT, SimpleTypeKind.ANY]
			.filter(kind => kind !== SimpleTypeKind.ANY)
			.filter(kind => isAssignableTo(kind));
	});

	// Test the @property type against the actual type if a type has been provided
	if (litConfig.type != null) {
		// Report error if the @property type is not assignable to the actual type
		if (!isAssignableTo(litConfig.type.kind) && !isAssignableTo(SimpleTypeKind.ANY)) {
			// Suggest what to use instead
			if (acceptedTypeKinds().length >= 1) {
				const potentialKindText = joinArray(
					acceptedTypeKinds().map(kind => `'${toLitPropertyTypeString(kind)}'`),
					", ",
					"or"
				);

				console.log({ message: `@property type should be ${potentialKindText} instead of '${toLitPropertyTypeString(litConfig.type.kind)}'` });
				/*context.emitDiagnostics({
					node: (litConfig.node && litConfig.node.type) || node,
					message: `@property type should be ${potentialKindText} instead of '${toLitPropertyTypeString(litConfig.type.kind)}'`,
					severity: "warning"
				});/
			}

			// If no suggesting can be provided, report that they are not assignable
			// The OBJECT @property type is an escape from this error
			else if (litConfig.type.kind !== SimpleTypeKind.OBJECT) {
				console.log({
					message: `@property type '${toTypeString(litConfig.type)}' is not assignable to the actual type '${toTypeString(simplePropType)}'`
				});
				/*context.emitDiagnostics({
					node: (litConfig.node && litConfig.node.type) || node,
					message: `@property type '${toTypeString(litConfig.type)}' is not assignable to the actual type '${toTypeString(simplePropType)}'`,
					severity: "warning"
				});/
			}
		}
	}

	// If no type has been specified, suggest what to use as the @property type
	else if (litConfig.attribute !== false) {
		// Don't do anything if there are multiple possibilities for a type.
		if (isAssignableTo(SimpleTypeKind.ANY)) {
		}

		// Don't report errors because String conversion is default
		else if (isAssignableTo(SimpleTypeKind.STRING)) {
		}

		// Suggest what to use instead if there are multiple accepted @property types for this property
		else if (acceptedTypeKinds().length > 0) {
			// Suggest types to use and include "{attribute: false}" if the @property type is ARRAY or OBJECT
			const acceptedTypeText = joinArray(
				[
					...acceptedTypeKinds().map(kind => `'{type: ${toLitPropertyTypeString(kind)}}'`),
					...(isAssignableTo(SimpleTypeKind.ARRAY) || isAssignableTo(SimpleTypeKind.OBJECT) ? ["'{attribute: false}'"] : [])
				],
				", ",
				"or"
			);

			console.log({ message: `Missing ${acceptedTypeText} on @property decorator for '${propName}'` });
			/*context.emitDiagnostics({
					node,
					severity: "warning",
					message: `Missing ${acceptedTypeText} on @property decorator for '${propName}'`
				});/
		} else {
			console.log({
				message: `The built in converter doesn't handle the property type '${toTypeString(
					simplePropType
				)}'. Please add '{attribute: false}' on @property decorator for '${propName}'`
			});
			/*context.emitDiagnostics({
					node,
					severity: "warning",
					message: `The built in converter doesn't handle the property type '${toTypeString(
						simplePropType
					)}'. Please add '{attribute: false}' on @property decorator for '${propName}'`
				});/
		}
	}

	/*if (litConfig.attribute !== false && !isAssignableToPrimitiveType(simplePropType)) {
	 context.emitDiagnostics({
	 node,
	 severity: "warning",
	 message: `You need to add '{attribute: false}' to @property decorator for '${propName}' because '${toTypeString(simplePropType)}' type is not a primitive`
	 });
	 }/
}

export default rule;
*/
