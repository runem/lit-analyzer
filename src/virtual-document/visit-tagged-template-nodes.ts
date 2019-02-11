import { Expression, Node, TaggedTemplateExpression, TypeChecker } from "typescript";
import { TsLitPluginStore } from "../state/store";
import { leadingCommentsIncludes } from "../util/util";
import { VirtualDocument } from "./virtual-document";

const TS_IGNORE_FLAG = "@ts-ignore";

export interface VisitContext {
	store: TsLitPluginStore;
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
		// Only visit the template expression if the leading comments does not include the ts-ignore flag.
		if (!leadingCommentsIncludes(astNode.getSourceFile().getText(), astNode.getFullStart(), TS_IGNORE_FLAG, context)) {
			newContext.parent = visitTaggedTemplateExpression(astNode, context);
		}
	}

	astNode.forEachChild(child => visitTaggedTemplateNodes(child, context));
}

function visitTaggedTemplateExpression(astNode: TaggedTemplateExpression, context: VisitContext): VirtualDocument | undefined {
	const { store } = context;

	const templateTag = astNode.tag.getText();
	if (store.config.htmlTemplateTags.includes(templateTag)) {
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
