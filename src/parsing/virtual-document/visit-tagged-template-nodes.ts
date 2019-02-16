import { Expression, Node, TaggedTemplateExpression, TypeChecker } from "typescript";
import { TS_IGNORE_FLAG } from "../../constants";
import { tsModule } from "../../ts-module";
import { leadingCommentsIncludes } from "../../util/ast-util";
import { VirtualDocument } from "./virtual-document";

export interface VisitContext {
	checker: TypeChecker;
	parent?: VirtualDocument;
	emitTextDocument(document: VirtualDocument): void;
	shouldCheckTemplateTag(templateTag: string): boolean;
}

/**
 * Visits html nodes recursively searching for tagged template expressions.
 * @param astNode
 * @param context
 */
export function visitTaggedTemplateNodes(astNode: Node, context: VisitContext) {
	const newContext = { ...context };
	if (tsModule.ts.isTaggedTemplateExpression(astNode)) {
		// Only visit the template expression if the leading comments does not include the ts-ignore flag.
		if (!leadingCommentsIncludes(astNode.getSourceFile().getText(), astNode.getFullStart(), TS_IGNORE_FLAG)) {
			newContext.parent = visitTaggedTemplateExpression(astNode, context);
		}
	}

	astNode.forEachChild(child => visitTaggedTemplateNodes(child, context));
}

function visitTaggedTemplateExpression(astNode: TaggedTemplateExpression, context: VisitContext): VirtualDocument | undefined {
	const templateTag = astNode.tag.getText();
	if (context.shouldCheckTemplateTag(templateTag)) {
		const expressionParts: Expression[] = [];
		const literalParts: Node[] = [];

		const template = astNode.template;
		if (tsModule.ts.isTemplateExpression(template)) {
			literalParts.push(template.head);

			for (const templateSpan of template.templateSpans) {
				const expression = templateSpan.expression;
				expressionParts.push(expression);
				literalParts.push(templateSpan.literal);
			}
		} else if (tsModule.ts.isNoSubstitutionTemplateLiteral(template)) {
			literalParts.push(template);
		}

		const virtualDocument = new VirtualDocument(templateTag, astNode, { literalParts, expressionParts });
		context.emitTextDocument(virtualDocument);

		return virtualDocument;
	}
}
