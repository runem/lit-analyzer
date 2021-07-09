import { isSimpleType, SimpleType, toSimpleType } from "ts-simple-type";
import { TypeChecker } from "typescript";
import { AnalyzerResult, ComponentDeclaration, ComponentDefinition, ComponentFeatures } from "web-component-analyzer";
import { lazy } from "../util/general-util.js";
import { HtmlDataCollection, HtmlDataFeatures, HtmlMemberBase, HtmlTag } from "./parse-html-data/html-tag.js";

export interface AnalyzeResultConversionOptions {
	addDeclarationPropertiesAsAttributes?: boolean;
	checker: TypeChecker;
}

export function convertAnalyzeResultToHtmlCollection(result: AnalyzerResult, options: AnalyzeResultConversionOptions): HtmlDataCollection {
	const tags = result.componentDefinitions.map(definition => convertComponentDeclarationToHtmlTag(definition.declaration, definition, options));

	const global = result.globalFeatures == null ? {} : convertComponentFeaturesToHtml(result.globalFeatures, { checker: options.checker });

	return {
		tags,
		global
	};
}

export function convertComponentDeclarationToHtmlTag(
	declaration: ComponentDeclaration | undefined,
	definition: ComponentDefinition | undefined,
	{ checker, addDeclarationPropertiesAsAttributes }: AnalyzeResultConversionOptions
): HtmlTag {
	const tagName = definition?.tagName ?? "";

	const builtIn = definition == null || (declaration?.sourceFile || definition.sourceFile).fileName.endsWith("lib.dom.d.ts");

	if (declaration == null) {
		return {
			tagName,
			builtIn,
			attributes: [],
			events: [],
			properties: [],
			slots: [],
			cssParts: [],
			cssProperties: []
		};
	}

	const htmlTag: HtmlTag = {
		declaration,
		tagName,
		builtIn,
		description: declaration.jsDoc?.description,
		...convertComponentFeaturesToHtml(declaration, { checker, builtIn, fromTagName: tagName })
	};

	if (addDeclarationPropertiesAsAttributes && !builtIn) {
		for (const htmlProp of htmlTag.properties) {
			if (htmlProp.declaration != null && htmlProp.declaration.attrName == null && htmlProp.declaration.node.getSourceFile().isDeclarationFile) {
				htmlTag.attributes.push({
					...htmlProp,
					kind: "attribute"
				});
			}
		}
	}

	return htmlTag;
}

export function convertComponentFeaturesToHtml(
	features: ComponentFeatures,
	{ checker, builtIn, fromTagName }: { checker: TypeChecker; builtIn?: boolean; fromTagName?: string }
): HtmlDataFeatures {
	const result: HtmlDataFeatures = {
		attributes: [],
		events: [],
		properties: [],
		slots: [],
		cssParts: [],
		cssProperties: []
	};

	for (const event of features.events) {
		result.events.push({
			declaration: event,
			description: event.jsDoc?.description,
			name: event.name,
			getType: lazy(() => {
				const type = event.type?.();

				if (type == null) {
					return { kind: "ANY" };
				}

				return isSimpleType(type) ? type : toSimpleType(type, checker);
			}),
			fromTagName,
			builtIn
		});

		result.attributes.push({
			kind: "attribute",
			name: `on${event.name}`,
			description: event.jsDoc?.description,
			getType: lazy(() => ({ kind: "STRING" } as SimpleType)),
			declaration: {
				attrName: `on${event.name}`,
				jsDoc: event.jsDoc,
				kind: "attribute",
				node: event.node,
				type: () => ({ kind: "ANY" })
			},
			builtIn,
			fromTagName
		});
	}

	for (const cssPart of features.cssParts) {
		result.cssParts.push({
			declaration: cssPart,
			description: cssPart.jsDoc?.description,
			name: cssPart.name || "",
			fromTagName
		});
	}

	for (const cssProp of features.cssProperties) {
		result.cssProperties.push({
			declaration: cssProp,
			description: cssProp.jsDoc?.description,
			name: cssProp.name || "",
			typeHint: cssProp.typeHint,
			fromTagName
		});
	}

	for (const slot of features.slots) {
		result.slots.push({
			declaration: slot,
			description: slot.jsDoc?.description,
			name: slot.name || "",
			fromTagName
		});
	}

	for (const member of features.members) {
		// Only add public members
		if (member.visibility != null && member.visibility !== "public") {
			continue;
		}

		// Only add non-static members
		if (member.modifiers?.has("static")) {
			continue;
		}

		// Only add writable members
		if (member.modifiers?.has("readonly")) {
			continue;
		}

		const base: HtmlMemberBase = {
			declaration: member,
			description: member.jsDoc?.description,
			getType: lazy(() => {
				const type = member.type?.();

				if (type == null) {
					return { kind: "ANY" };
				}

				return isSimpleType(type) ? type : toSimpleType(type, checker);
			}),
			builtIn,
			fromTagName
		};

		if (member.kind === "property") {
			result.properties.push({
				...base,
				kind: "property",
				name: member.propName,
				required: member.required
			});
		}

		if ("attrName" in member && member.attrName != null) {
			result.attributes.push({
				...base,
				kind: "attribute",
				name: member.attrName,
				required: member.required
			});
		}
	}

	return result;
}
