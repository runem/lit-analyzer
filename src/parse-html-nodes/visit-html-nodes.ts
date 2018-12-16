import { Node, TaggedTemplateExpression, Type, TypeChecker } from "typescript";
import { TsHtmlPluginStore } from "../state/store";
import { getFragmentSourceCodeLocation, getFragmentText, ITemplateFragment, makeTemplateFragment } from "./i-template-fragment";
import { parseHtmlTemplate } from "./parse-html-template/parse-html-template";
import { IHtmlTemplate } from "./types/html-node-types";

export interface IVisitContext {
	store: TsHtmlPluginStore;
	checker: TypeChecker;
	emitHtmlTemplate(template: IHtmlTemplate): void;
}

/**
 * Visits html nodes recursively searching for tagged template expressions.
 * @param astNode
 * @param context
 */
export function visitHtmlNodes(astNode: Node, context: IVisitContext) {
	if (context.store.ts.isTaggedTemplateExpression(astNode)) {
		visitTaggedTemplateExpression(astNode, context);
	}

	astNode.forEachChild(child => visitHtmlNodes(child, context));
}

/**
 * Visits a tagged template expression and pares it into a html template.
 * @param astNode
 * @param context
 */
function visitTaggedTemplateExpression(astNode: TaggedTemplateExpression, context: IVisitContext) {
	const { checker, store } = context;

	const templateTag = astNode.tag.getText();
	if (store.config.tags.includes(templateTag)) {
		const fragments = getFragmentsFromTaggedTemplateExpression(astNode, context);
		const html = fragments.map(getFragmentText).join("");

		const template = parseHtmlTemplate({
			store,
			html,
			astNode,
			getSourceCodeLocation(htmlOffset: number) {
				return getFragmentSourceCodeLocation(fragments, htmlOffset) || 0;
			},
			getTypeFromExpressionId(id: string): Type | undefined {
				const fragment = fragments.find(f => f.id === id);
				if (!fragment) return undefined;
				return checker.getTypeAtLocation(fragment.node);
			}
		});

		context.emitHtmlTemplate(template);
	}
}

/**
 * Parses a tagged template expression returning template fragments.
 * @param astNode
 * @param context
 */
function getFragmentsFromTaggedTemplateExpression(astNode: TaggedTemplateExpression, context: IVisitContext): ITemplateFragment[] {
	const { store } = context;

	const templateTag = astNode.tag.getText();
	if (store.config.tags.includes(templateTag)) {
		const fragments: ITemplateFragment[] = [];

		const template = astNode.template;
		if (store.ts.isTemplateExpression(template)) {
			fragments.push(makeTemplateFragment(template.head));

			for (const templateSpan of template.templateSpans) {
				const expression = templateSpan.expression;

				// Visit the expression in order to find nested templates
				visitHtmlNodes(expression, context);
				fragments.push(makeTemplateFragment(expression, { isExpression: true }));
				fragments.push(makeTemplateFragment(templateSpan.literal));
			}
		} else if (store.ts.isNoSubstitutionTemplateLiteral(template)) {
			fragments.push(makeTemplateFragment(template));
		}

		return fragments;
	}

	return [];
}
