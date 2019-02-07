import { Expression, Node, TaggedTemplateExpression, TypeChecker } from "typescript";
import { TsHtmlPluginStore } from "../state/store";
import { VirtualDocument } from "./virtual-document";

export interface VisitContext {
	store: TsHtmlPluginStore;
	checker: TypeChecker;
	parent?: VirtualDocument;
	emitTextDocument(document: VirtualDocument): void;
}

/**
 * Visits html nodes recursively searching for tagged template expressions.
 * @param astNode
 * @param context
 */
export function visitTaggedTemplateNodes(astNode: Node, context: VisitContext) {
	const newContext = { ...context };
	if (context.store.ts.isTaggedTemplateExpression(astNode)) {
		newContext.parent = visitTaggedTemplateExpression(astNode, context);
	}

	astNode.forEachChild(child => visitTaggedTemplateNodes(child, context));
}

function visitTaggedTemplateExpression(astNode: TaggedTemplateExpression, context: VisitContext): VirtualDocument | undefined {
	const { store } = context;

	const templateTag = astNode.tag.getText();
	if (store.config.tags.includes(templateTag)) {
		const expressionParts: Expression[] = [];
		const htmlParts: Node[] = [];

		const template = astNode.template;
		if (store.ts.isTemplateExpression(template)) {
			//htmlDocument.htmlParts.push(template.head.getText());
			htmlParts.push(template.head);

			for (const templateSpan of template.templateSpans) {
				const expression = templateSpan.expression;
				expressionParts.push(expression);
				htmlParts.push(templateSpan.literal);
			}
		} else if (store.ts.isNoSubstitutionTemplateLiteral(template)) {
			htmlParts.push(template);
		}

		const textDocument = new VirtualDocument(astNode, htmlParts, expressionParts, context.parent);
		context.emitTextDocument(textDocument);

		return textDocument;
	}
}
