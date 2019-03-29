import { isAssignableToSimpleTypeKind, SimpleType, SimpleTypeKind } from "ts-simple-type";
import { LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER, LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER, LIT_HTML_PROP_ATTRIBUTE_MODIFIER } from "../../../constants";
import { HtmlAttrTarget, isHtmlAttr, isHtmlEvent, isHtmlProp, documentationForTarget } from "../../../parsing/parse-html-data/html-tag";
import { HtmlNode } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-types";
import { DocumentPositionContext } from "../../../util/get-html-position";
import { iterableFilter, iterableMap } from "../../../util/iterable-util";
import { lazy } from "../../../util/util";
import { DiagnosticsContext } from "../../diagnostics-context";
import { LitCompletion } from "../../types/lit-completion";

export function completionsForHtmlAttrs(htmlNode: HtmlNode, location: DocumentPositionContext, { store }: DiagnosticsContext): LitCompletion[] {
	// Code completions for ".[...]";
	if (location.word.startsWith(LIT_HTML_PROP_ATTRIBUTE_MODIFIER)) {
		const alreadyUsedPropNames = htmlNode.attributes.filter(a => a.modifier === LIT_HTML_PROP_ATTRIBUTE_MODIFIER).map(a => a.name);
		const unusedProps = iterableFilter(store.getAllPropertiesForTag(htmlNode), prop => !alreadyUsedPropNames.includes(prop.name));
		return Array.from(iterableMap(unusedProps, prop => targetToCompletion(prop, { modifier: LIT_HTML_PROP_ATTRIBUTE_MODIFIER })));
	}

	// Code completions for "?[...]";
	else if (location.word.startsWith(LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER)) {
		const alreadyUsedAttrNames = htmlNode.attributes.filter(a => a.modifier === LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER || a.modifier == null).map(a => a.name);
		const unusedAttrs = iterableFilter(store.getAllAttributesForTag(htmlNode), prop => !alreadyUsedAttrNames.includes(prop.name));
		const booleanAttributes = iterableFilter(unusedAttrs, prop => isAssignableToBoolean(prop.getType()));
		return Array.from(iterableMap(booleanAttributes, attr => targetToCompletion(attr, { modifier: LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER })));
	}

	// Code completions for "@[...]";
	else if (location.word.startsWith(LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER)) {
		const alreadyUsedEventNames = htmlNode.attributes.filter(a => a.modifier === LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER).map(a => a.name);
		const unusedEvents = iterableFilter(store.getAllEventsForTag(htmlNode), prop => !alreadyUsedEventNames.includes(prop.name));
		return Array.from(iterableMap(unusedEvents, prop => targetToCompletion(prop, { modifier: LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER })));
	}

	const alreadyUsedAttrNames = htmlNode.attributes.filter(a => a.modifier == null).map(a => a.name);
	const unusedAttrs = iterableFilter(store.getAllAttributesForTag(htmlNode), prop => !alreadyUsedAttrNames.includes(prop.name));
	return Array.from(iterableMap(unusedAttrs, prop => targetToCompletion(prop, { modifier: "" })));
}

function isAssignableToBoolean(type: SimpleType, { matchAny } = { matchAny: true }): boolean {
	return isAssignableToSimpleTypeKind(type, [SimpleTypeKind.BOOLEAN, SimpleTypeKind.BOOLEAN_LITERAL], {
		op: "or",
		matchAny
	});
}

function targetToCompletion(target: HtmlAttrTarget, { modifier, insertModifier }: { modifier?: string; insertModifier?: boolean }): LitCompletion {
	if (modifier == null) {
		if (isHtmlAttr(target)) {
			if (isAssignableToBoolean(target.getType(), { matchAny: false })) {
				modifier = LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER;
			} else {
				modifier = "";
			}
		} else if (isHtmlProp(target)) {
			modifier = LIT_HTML_PROP_ATTRIBUTE_MODIFIER;
		} else if (isHtmlEvent(target)) {
			modifier = LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER;
		}
	}

	const isGlobal = target.fromTagName == null;
	const isBuiltIn = target.builtIn;
	const hasDeclaration = target.declaration != null;

	return {
		name: `${modifier || ""}${target.name}${"required" in target && target.required ? "!" : ""}`,
		insert: `${insertModifier ? modifier : ""}${target.name}`,
		kind: isBuiltIn || isGlobal ? "constElement" : hasDeclaration ? "member" : "label",
		importance: isBuiltIn || isGlobal ? "low" : hasDeclaration ? "high" : "medium",
		documentation: lazy(() => documentationForTarget(target, { modifier }))
	};
}
