import { isSimpleType, SimpleType, SimpleTypeKind, toSimpleType } from "ts-simple-type";
import { TypeChecker } from "typescript";
import { AnalyzeComponentsResult, ComponentDeclaration, ComponentDefinition, JsDoc } from "web-component-analyzer";
import { lazy } from "../util/general-util";
import { HtmlDataCollection, HtmlMemberBase, HtmlTag } from "./parse-html-data/html-tag";

export interface AnalyzeResultConversionOptions {
	addDeclarationPropertiesAsAttributes?: boolean;
	checker: TypeChecker;
}

export function convertAnalyzeResultToHtmlCollection(result: AnalyzeComponentsResult, options: AnalyzeResultConversionOptions): HtmlDataCollection {
	const tags = result.componentDefinitions.map(definition => convertComponentDeclarationToHtmlTag(definition.declaration, definition, options));

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
	const tagName = (definition && definition.tagName) || "";

	const builtIn = definition == null || definition.fromLib;

	const htmlTag: HtmlTag = {
		declaration,
		tagName,
		builtIn,
		description: descriptionFromJsDoc(declaration.jsDoc),
		attributes: [],
		properties: [],
		slots: [],
		events: []
	};

	for (const event of declaration.events) {
		htmlTag.events.push({
			declaration: event,
			description: descriptionFromJsDoc(event.jsDoc),
			name: event.name,
			getType: lazy(() => (isSimpleType(event.type) ? event.type : toSimpleType(event.type, checker))),
			fromTagName: tagName,
			builtIn
		});

		htmlTag.attributes.push({
			kind: "attribute",
			name: `on${event.name}`,
			description: descriptionFromJsDoc(event.jsDoc),
			getType: lazy(() => ({ kind: SimpleTypeKind.STRING } as SimpleType)),
			fromTagName: tagName,
			declaration: {
				attrName: `on${event.name}`,
				jsDoc: event.jsDoc,
				kind: "attribute",
				node: event.node,
				type: { kind: SimpleTypeKind.ANY }
			},
			builtIn
		});
	}

	for (const slot of declaration.slots) {
		htmlTag.slots.push({
			declaration: slot,
			description: descriptionFromJsDoc(slot.jsDoc),
			name: slot.name || "",
			fromTagName: tagName
		});
	}

	for (const member of declaration.members) {
		const base: HtmlMemberBase = {
			declaration: member,
			description: descriptionFromJsDoc(member.jsDoc),
			getType: lazy(() => (isSimpleType(member.type) ? member.type : toSimpleType(member.type, checker))),
			fromTagName: tagName,
			builtIn
		};

		if (member.kind === "method") continue;

		if (member.kind === "property") {
			htmlTag.properties.push({
				...base,
				kind: "property",
				name: member.propName,
				required: member.required
			});

			if (!("attrName" in member) && addDeclarationPropertiesAsAttributes && (definition != null && !definition.fromLib)) {
				if (declaration.node.getSourceFile().isDeclarationFile) {
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

function descriptionFromJsDoc(jsDoc: JsDoc | undefined): string | undefined {
	return (jsDoc && jsDoc.comment) || undefined;
}
