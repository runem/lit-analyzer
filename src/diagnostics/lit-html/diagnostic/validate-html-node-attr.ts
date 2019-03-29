import { HtmlAttrTarget, litAttributeModifierForTarget } from "../../../parsing/parse-html-data/html-tag";
import { HtmlNodeAttr, HtmlNodeAttrKind } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-attr-types";
import { HtmlNodeKind } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-types";
import { TsLitPluginStore } from "../../../state/store";
import { findBestMatch } from "../../../util/find-best-match";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../../types/lit-diagnostic";

/**
 * Returns html reports for unknown html attributes.
 * @param htmlAttr
 * @param store
 */
export function validateHtmlAttr(htmlAttr: HtmlNodeAttr, store: TsLitPluginStore): LitHtmlDiagnostic[] {
	// Ignore "style" and "svg" attrs because I don't yet have all data for them.
	if (htmlAttr.htmlNode.kind !== HtmlNodeKind.NODE) return [];

	const htmlAttrTarget = store.getHtmlAttrTarget(htmlAttr);
	if (htmlAttrTarget == null) {
		// Check if we need to skip this check
		switch (htmlAttr.kind) {
			case HtmlNodeAttrKind.ATTRIBUTE:
			case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
				if (store.config.skipUnknownAttributes) return [];
				break;
			case HtmlNodeAttrKind.PROPERTY:
				if (!store.config.skipUnknownProperties) return [];
				break;
			case HtmlNodeAttrKind.EVENT_LISTENER:
				if (!store.config.checkUnknownEvents) return [];
				break;
		}

		// Ignore unknown "data-" attributes
		if (htmlAttr.name.startsWith("data-")) return [];

		const htmlTag = store.getHtmlTag(htmlAttr.htmlNode);

		const suggestedTarget = suggestTargetForHtmlAttr(htmlAttr, store);
		const suggestedMemberName = (suggestedTarget && `${litAttributeModifierForTarget(suggestedTarget)}${suggestedTarget.name}`) || undefined;

		const definition = store.getDefinitionForTagName(htmlAttr.htmlNode.tagName);

		const tagHasDeclaration = htmlTag != null && htmlTag.declaration != null;
		const tagIsBuiltIn = htmlTag != null && htmlTag.builtIn;
		const tagIsFromLibrary = definition != null && definition.declaration.node.getSourceFile().isDeclarationFile;

		const tip = (() => {
			switch (htmlAttr.kind) {
				case HtmlNodeAttrKind.EVENT_LISTENER:
					return suggestedMemberName != null
						? `Did you mean '${suggestedMemberName}'? `
						: `Please consider adding a '@event' tag to the jsdoc on a component class, adding it to 'globalHtmlEvents' or removing 'checkUnknownEvents' from the plugin configuration.`;
				case HtmlNodeAttrKind.PROPERTY:
					return suggestedMemberName != null
						? `Did you mean '${suggestedMemberName}'? `
						: tagIsBuiltIn
						? `This is a built in tag. Please consider adding "skipUnknownProperties" to the plugin configuration.`
						: tagIsFromLibrary
						? `If you are not the author of this component please consider adding 'skipUnknownProperties' to the plugin configuration.`
						: tagHasDeclaration
						? `This plugin can't find all properties yet. Please consider adding a '@prop' tag to jsdoc on the component class or 'skipUnknownProperties' to the plugin configuration.`
						: `Please consider adding 'skipUnknownProperties' to the plugin configuration.`;
				case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
				case HtmlNodeAttrKind.ATTRIBUTE:
					return suggestedMemberName != null
						? `Did you mean '${suggestedMemberName}'? `
						: tagIsBuiltIn
						? `This is a built in tag. Please consider using a 'data-*' attribute or adding 'globalHtmlAttributes' / 'skipUnknownAttributes' to the plugin configuration.`
						: tagIsFromLibrary
						? `If you are not the author of this component please consider using a 'data-*' attribute or adding 'globalHtmlAttributes' / 'skipUnknownAttributes' to the plugin configuration.`
						: tagHasDeclaration
						? `Please consider adding it as a attribute on the component, adding '@attr' tag to jsdoc on the component class or using a 'data-*' attribute instead.`
						: `Please consider using a 'data-*' attribute instead.`;
			}
		})();

		const existingKind = (() => {
			switch (htmlAttr.kind) {
				case HtmlNodeAttrKind.PROPERTY:
					return "property";
				case HtmlNodeAttrKind.ATTRIBUTE:
				case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
					return "attribute";
				case HtmlNodeAttrKind.EVENT_LISTENER:
					return "event listener";
			}
		})();

		return [
			{
				kind: LitHtmlDiagnosticKind.UNKNOWN_TARGET,
				message: `Unknown ${existingKind} "${htmlAttr.modifier || ""}${htmlAttr.name}".${tip != null ? ` ${tip}` : ""}`,
				severity: "warning",
				location: htmlAttr.location.name,
				htmlAttr,
				suggestedTarget
			}
		];
	}

	return [];
}

function suggestTargetForHtmlAttr(htmlNodeAttr: HtmlNodeAttr, store: TsLitPluginStore): HtmlAttrTarget | undefined {
	const properties = store.getAllPropertiesForTag(htmlNodeAttr.htmlNode);
	const attributes = store.getAllAttributesForTag(htmlNodeAttr.htmlNode);
	const events = store.getAllEventsForTag(htmlNodeAttr.htmlNode);

	switch (htmlNodeAttr.kind) {
		case HtmlNodeAttrKind.EVENT_LISTENER:
			return findSuggestedTarget(htmlNodeAttr.name, events);
		case HtmlNodeAttrKind.PROPERTY:
			return findSuggestedTarget(htmlNodeAttr.name, properties, attributes);
		case HtmlNodeAttrKind.ATTRIBUTE:
		case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
			return findSuggestedTarget(htmlNodeAttr.name, attributes, properties);
	}
}

function findSuggestedTarget(name: string, ...tests: Iterable<HtmlAttrTarget>[]): HtmlAttrTarget | undefined {
	for (const test of tests) {
		const match = findBestMatch(name, [...test], { matchKey: "name", caseSensitive: false });
		if (match != null) {
			return match;
		}
	}
}
