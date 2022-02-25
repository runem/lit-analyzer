import { isAssignableToSimpleTypeKind, SimpleType } from "ts-simple-type";
import {
	LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER,
	LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER,
	LIT_HTML_PROP_ATTRIBUTE_MODIFIER
} from "../../../constants.js";
import { documentationForTarget, HtmlAttrTarget, isHtmlAttr, isHtmlEvent, isHtmlProp } from "../../../parse/parse-html-data/html-tag.js";
import { HtmlNode } from "../../../types/html-node/html-node-types.js";
import { DocumentPositionContext } from "../../../util/get-position-context-in-document.js";
import { iterableFilter, iterableMap } from "../../../util/iterable-util.js";
import { lazy } from "../../../util/general-util.js";
import { LitAnalyzerContext } from "../../../lit-analyzer-context.js";
import { LitCompletion } from "../../../types/lit-completion.js";

export function completionsForHtmlAttrs(htmlNode: HtmlNode, location: DocumentPositionContext, { htmlStore }: LitAnalyzerContext): LitCompletion[] {
	const onTagName = htmlNode.tagName;

	// Code completions for ".[...]";
	if (location.word.startsWith(LIT_HTML_PROP_ATTRIBUTE_MODIFIER)) {
		const alreadyUsedPropNames = htmlNode.attributes.filter(a => a.modifier === LIT_HTML_PROP_ATTRIBUTE_MODIFIER).map(a => a.name);
		const unusedProps = iterableFilter(htmlStore.getAllPropertiesForTag(htmlNode), prop => !alreadyUsedPropNames.includes(prop.name));
		return Array.from(
			iterableMap(unusedProps, prop =>
				targetToCompletion(prop, {
					modifier: LIT_HTML_PROP_ATTRIBUTE_MODIFIER,
					onTagName
				})
			)
		);
	}

	// Code completions for "?[...]";
	else if (location.word.startsWith(LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER)) {
		const alreadyUsedAttrNames = htmlNode.attributes
			.filter(a => a.modifier === LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER || a.modifier == null)
			.map(a => a.name);
		const unusedAttrs = iterableFilter(htmlStore.getAllAttributesForTag(htmlNode), prop => !alreadyUsedAttrNames.includes(prop.name));
		const booleanAttributes = iterableFilter(unusedAttrs, prop => isAssignableToBoolean(prop.getType()));
		return Array.from(
			iterableMap(booleanAttributes, attr =>
				targetToCompletion(attr, {
					modifier: LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER,
					onTagName
				})
			)
		);
	}

	// Code completions for "@[...]";
	else if (location.word.startsWith(LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER)) {
		const alreadyUsedEventNames = htmlNode.attributes.filter(a => a.modifier === LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER).map(a => a.name);
		const unusedEvents = iterableFilter(htmlStore.getAllEventsForTag(htmlNode), prop => !alreadyUsedEventNames.includes(prop.name));
		return Array.from(
			iterableMap(unusedEvents, prop =>
				targetToCompletion(prop, {
					modifier: LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER,
					onTagName
				})
			)
		);
	}

	const alreadyUsedAttrNames = htmlNode.attributes.filter(a => a.modifier == null).map(a => a.name);
	const unusedAttrs = iterableFilter(htmlStore.getAllAttributesForTag(htmlNode), prop => !alreadyUsedAttrNames.includes(prop.name));
	return Array.from(iterableMap(unusedAttrs, prop => targetToCompletion(prop, { modifier: "", onTagName })));
}

function isAssignableToBoolean(type: SimpleType, { matchAny } = { matchAny: true }): boolean {
	return isAssignableToSimpleTypeKind(type, ["BOOLEAN", "BOOLEAN_LITERAL"], {
		matchAny
	});
}

function targetToCompletion(
	target: HtmlAttrTarget,
	{ modifier, insertModifier, onTagName }: { modifier?: string; insertModifier?: boolean; onTagName?: string }
): LitCompletion {
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

	const isMember = onTagName && target.fromTagName === onTagName;
	const isBuiltIn = target.builtIn;

	return {
		name: `${modifier || ""}${target.name}${"required" in target && target.required ? "!" : ""}`,
		insert: `${insertModifier ? modifier : ""}${target.name}`,
		kind: isBuiltIn ? "enumElement" : isMember ? "member" : "label",
		importance: isBuiltIn ? "low" : isMember ? "high" : "medium",
		documentation: lazy(() => documentationForTarget(target, { modifier }))
	};
}
