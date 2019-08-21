import { isAssignableToSimpleTypeKind, SimpleType, SimpleTypeKind } from "ts-simple-type";

export function removeUndefinedFromType(type: SimpleType): SimpleType {
	switch (type.kind) {
		case SimpleTypeKind.ALIAS:
			return {
				...type,
				target: removeUndefinedFromType(type.target)
			};
		case SimpleTypeKind.UNION:
			return {
				...type,
				types: type.types.filter(t => !isAssignableToSimpleTypeKind(t, SimpleTypeKind.UNDEFINED))
			};
	}

	return type;
}
