import { isSimpleType, SimpleType, SimpleTypeKind, toSimpleType } from "ts-simple-type";
import { TypeChecker } from "typescript";
import { AnalyzerResult, ComponentDeclaration, ComponentDefinition } from "web-component-analyzer";
import { isCustomElementTagName, lazy } from "../util/general-util";
import { iterableFirst } from "../util/iterable-util";
import { HtmlDataCollection, HtmlMemberBase, HtmlTag } from "./parse-html-data/html-tag";

export interface AnalyzeResultConversionOptions {
	addDeclarationPropertiesAsAttributes?: boolean;
	checker: TypeChecker;
}

export function convertAnalyzeResultToHtmlCollection(result: AnalyzerResult, options: AnalyzeResultConversionOptions): HtmlDataCollection {
	const tags = result.componentDefinitions.map(definition => convertComponentDeclarationToHtmlTag(definition.declaration(), definition, options));

	return {
		tags,
		events: [],
		attrs: []
	};
}

export function convertComponentDeclarationToHtmlTag(
	declaration: ComponentDeclaration,
	definition: ComponentDefinition | undefined,
	{ checker, addDeclarationPropertiesAsAttributes }: AnalyzeResultConversionOptions
): HtmlTag {
	const tagName = definition?.tagName || "";

	const builtIn = definition == null || isCustomElementTagName(definition.tagName);

	const htmlTag: HtmlTag = {
		declaration,
		tagName,
		builtIn,
		description: declaration.jsDoc?.description,
		attributes: [],
		properties: [],
		slots: [],
		events: []
	};

	for (const event of declaration.events) {
		htmlTag.events.push({
			declaration: event,
			description: declaration.jsDoc?.description,
			name: event.name,
			getType: lazy(() => {
				const type = event.type?.();

				if (type == null) {
					return { kind: SimpleTypeKind.ANY };
				}

				return isSimpleType(type) ? type : toSimpleType(type, checker);
			}),
			fromTagName: tagName,
			builtIn
		});

		htmlTag.attributes.push({
			kind: "attribute",
			name: `on${event.name}`,
			description: declaration.jsDoc?.description,
			getType: lazy(() => ({ kind: SimpleTypeKind.STRING } as SimpleType)),
			fromTagName: tagName,
			declaration: {
				attrName: `on${event.name}`,
				jsDoc: event.jsDoc,
				kind: "attribute",
				node: event.node,
				type: () => ({ kind: SimpleTypeKind.ANY })
			},
			builtIn
		});
	}

	for (const slot of declaration.slots) {
		htmlTag.slots.push({
			declaration: slot,
			description: slot.jsDoc?.description,
			name: slot.name || "",
			fromTagName: tagName
		});
	}

	for (const member of declaration.members) {
		const base: HtmlMemberBase = {
			declaration: member,
			description: member.jsDoc?.description,
			getType: lazy(() => {
				const type = member.type?.();

				if (type == null) {
					return { kind: SimpleTypeKind.ANY };
				}

				return isSimpleType(type) ? type : toSimpleType(type, checker);
			}),
			fromTagName: tagName,
			builtIn
		};

		if (member.kind === "property") {
			htmlTag.properties.push({
				...base,
				kind: "property",
				name: member.propName,
				required: member.required
			});

			if (!("attrName" in member) && addDeclarationPropertiesAsAttributes && !builtIn) {
				if (iterableFirst(declaration.declarationNodes)!.getSourceFile().isDeclarationFile) {
					htmlTag.attributes.push({
						...base,
						kind: "attribute",
						name: member.propName
					});
				}
			}
		}

		if ("attrName" in member && member.attrName != null) {
			htmlTag.attributes.push({
				...base,
				kind: "attribute",
				name: member.attrName,
				required: member.required
			});
		}
	}

	return htmlTag;
}
