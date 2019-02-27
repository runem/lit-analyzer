import { isSimpleType, toSimpleType } from "ts-simple-type";
import { TypeChecker } from "typescript";
import { HtmlTag } from "./parse-html-data/html-tag";
import { ComponentDefinition } from "./web-component-analyzer/types/component-types";

export function convertComponentDefinitionsToHtmlTags(definition: ComponentDefinition, checker: TypeChecker): HtmlTag {
	const decl = definition.declaration;

	return {
		hasDeclaration: true,
		name: definition.tagName,
		description: decl.jsDoc && decl.jsDoc.comment,
		attributes: decl.attributes.map(attr => ({
			hasProp: true,
			name: attr.name,
			description: attr.jsDoc != null ? attr.jsDoc.comment : undefined,
			required: attr.required,
			type: isSimpleType(attr.type) ? attr.type : toSimpleType(attr.type, checker)
		})),
		properties: [],
		events: []
	};
}
