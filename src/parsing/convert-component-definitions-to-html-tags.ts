import { toSimpleType } from "ts-simple-type";
import { TypeChecker } from "typescript";
import { IComponentDefinition } from "./parse-components/component-types";
import { HtmlTag } from "./parse-html-data/html-tag";

export function convertComponentDefinitionsToHtmlTags(definition: IComponentDefinition, checker: TypeChecker): HtmlTag {
	const decl = definition.declaration;

	return {
		hasDeclaration: true,
		name: definition.tagName,
		description: decl.meta.jsDoc != null ? decl.meta.jsDoc.comment : undefined,
		attributes: decl.props.map(prop => ({
			hasProp: true,
			name: prop.name,
			description: prop.jsDoc != null ? prop.jsDoc.comment : undefined,
			required: prop.required,
			type: toSimpleType(prop.type, checker)
		}))
	};
}
