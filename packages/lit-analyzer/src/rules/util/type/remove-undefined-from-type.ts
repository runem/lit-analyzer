import { isAssignableToSimpleTypeKind, SimpleType } from "ts-simple-type";

export function removeUndefinedFromType(type: SimpleType): SimpleType {
	switch (type.kind) {
		case "ALIAS":
			return {
				...type,
				target: removeUndefinedFromType(type.target)
			};
		case "UNION":
			return {
				...type,
				types: type.types.filter(t => !isAssignableToSimpleTypeKind(t, "UNDEFINED"))
			};
	}

	return type;
}
