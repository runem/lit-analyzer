import { isAssignableToSimpleTypeKind, isSimpleType, SimpleType, SimpleTypeKind, toSimpleType, toTypeString } from "ts-simple-type";
import { Node } from "typescript";
import { LitElementPropertyConfig } from "web-component-analyzer/lib/cjs/lit-element-property-config-a6e5ad36";
import { RuleModule } from "../analyze/types/rule/rule-module";
import { RuleModuleContext } from "../analyze/types/rule/rule-module-context";
import { joinArray } from "../analyze/util/array-util";
import { lazy } from "../analyze/util/general-util";
import { rangeFromNode } from "../analyze/util/range-util";

const rule: RuleModule = {
	id: "no-incompatible-property-type",
	meta: {
		priority: "medium"
	},
	visitComponentMember(member, context) {
		if (member.kind !== "property" || member.meta == null) return;

		// Grab the type and fallback to "any"
		const type = member.type?.() || { kind: SimpleTypeKind.ANY };

		return validateLitPropertyConfig(
			member.meta.node?.type || member.meta.node?.decorator?.expression || member.node,
			member.meta,
			{
				propName: member.propName,
				simplePropType: isSimpleType(type) ? type : toSimpleType(type, context.program.getTypeChecker())
			},
			context
		);
	}
};

/**
 * Returns a string, that can be used in a lit @property decorator for the type key, representing the simple type kind.
 * @param simpleTypeKind
 */
function toLitPropertyTypeString(simpleTypeKind: SimpleTypeKind): string {
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
}

/**
 * Prepares functions that can lazily test assignability against simple type kinds.
 * This tester function uses a cache for performance.
 * @param simpleType
 */
function prepareSimpleAssignabilityTester(
	simpleType: SimpleType
): { isAssignableTo: (kind: SimpleTypeKind) => boolean; acceptedTypeKinds: () => SimpleTypeKind[] } {
	// Test assignments to all possible type kinds
	const _isAssignableToCache = new Map<SimpleTypeKind, boolean>();
	function isAssignableTo(simpleTypeKind: SimpleTypeKind): boolean {
		if (_isAssignableToCache.has(simpleTypeKind)) {
			return _isAssignableToCache.get(simpleTypeKind)!;
		}

		const result = (() => {
			switch (simpleTypeKind) {
				case SimpleTypeKind.STRING:
					return isAssignableToSimpleTypeKind(simpleType, [SimpleTypeKind.STRING, SimpleTypeKind.STRING_LITERAL], { op: "or" });
				case SimpleTypeKind.NUMBER:
					return isAssignableToSimpleTypeKind(simpleType, [SimpleTypeKind.NUMBER, SimpleTypeKind.NUMBER_LITERAL], { op: "or" });
				case SimpleTypeKind.BOOLEAN:
					return isAssignableToSimpleTypeKind(simpleType, [SimpleTypeKind.BOOLEAN, SimpleTypeKind.BOOLEAN_LITERAL], { op: "or" });
				case SimpleTypeKind.ARRAY:
					return isAssignableToSimpleTypeKind(simpleType, [SimpleTypeKind.ARRAY, SimpleTypeKind.TUPLE], { op: "or" });
				case SimpleTypeKind.OBJECT:
					return isAssignableToSimpleTypeKind(simpleType, [SimpleTypeKind.OBJECT, SimpleTypeKind.INTERFACE], {
						op: "or"
					});
				case SimpleTypeKind.ANY:
					return isAssignableToSimpleTypeKind(simpleType, SimpleTypeKind.ANY);
				default:
					return false;
			}
		})();

		_isAssignableToCache.set(simpleTypeKind, result);

		return result;
	}

	// Collect type kinds that can be used in as "type" in the @property decorator
	const acceptedTypeKinds = lazy(() => {
		return [SimpleTypeKind.STRING, SimpleTypeKind.NUMBER, SimpleTypeKind.BOOLEAN, SimpleTypeKind.ARRAY, SimpleTypeKind.OBJECT, SimpleTypeKind.ANY]
			.filter(kind => kind !== SimpleTypeKind.ANY)
			.filter(kind => isAssignableTo(kind));
	});

	return { acceptedTypeKinds, isAssignableTo };
}

/**
 * Runs through a lit configuration and validates against the "simplePropType".
 * Emits diagnostics through the context.
 * @param node
 * @param litConfig
 * @param propName
 * @param simplePropType
 * @param context
 */
function validateLitPropertyConfig(
	node: Node,
	litConfig: LitElementPropertyConfig,
	{ propName, simplePropType }: { propName: string; simplePropType: SimpleType },
	context: RuleModuleContext
) {
	// Check if "type" is one of the built in default type converter hint
	if (typeof litConfig.type === "string" && !litConfig.hasConverter) {
		context.report({
			location: rangeFromNode(node),
			message: `'${litConfig.type}' is not a valid type for the default converter.`,
			fixMessage: litConfig.attribute !== false ? "Have you considered '{attribute: false}' instead?" : "Have you considered removing 'type'?"
		});
	}

	// Don't continue if we don't know the property type (eg if we are in a js file)
	// Don't continue if this property has a custom converter (because then we don't know how the value will be converted)
	if (simplePropType == null || litConfig.hasConverter || typeof litConfig.type === "string") {
		return;
	}

	const { acceptedTypeKinds, isAssignableTo } = prepareSimpleAssignabilityTester(simplePropType);

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

				context.report({
					location: rangeFromNode(node),
					message: `@property type should be ${potentialKindText} instead of '${toLitPropertyTypeString(litConfig.type.kind)}'`
				});
			}

			// If no suggesting can be provided, report that they are not assignable
			// The OBJECT @property type is an escape from this error
			else if (litConfig.type.kind !== SimpleTypeKind.OBJECT) {
				context.report({
					location: rangeFromNode(node),
					message: `@property type '${toTypeString(litConfig.type)}' is not assignable to the actual type '${toTypeString(simplePropType)}'`
				});
			}
		}
	}

	// If no type has been specified, suggest what to use as the @property type
	else if (litConfig.attribute !== false) {
		// Don't do anything if there are multiple possibilities for a type.
		if (isAssignableTo(SimpleTypeKind.ANY)) {
			return;
		}

		// Don't report errors because String conversion is default
		else if (isAssignableTo(SimpleTypeKind.STRING)) {
			return;
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

			context.report({
				location: rangeFromNode(node),
				message: `Missing ${acceptedTypeText} on @property decorator for '${propName}'`
			});
		} else {
			context.report({
				location: rangeFromNode(node),
				message: `The built in converter doesn't handle the property type '${toTypeString(simplePropType)}'.`,
				fixMessage: `Please add '{attribute: false}' on @property decorator for '${propName}'`
			});
		}
	}

	// message: `You need to add '{attribute: false}' to @property decorator for '${propName}' because '${toTypeString(simplePropType)}' type is not a primitive`
}

export default rule;
