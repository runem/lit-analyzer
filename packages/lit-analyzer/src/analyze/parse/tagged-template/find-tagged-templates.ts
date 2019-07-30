import { Node, SourceFile, TaggedTemplateExpression } from "typescript";
import { tsModule } from "../../ts-module";
import { findParent, getNodeAtPosition } from "../../util/ast-util";

/**
 * Returns all virtual documents in a given file.
 * @param sourceFile
 * @param templateTags
 */
export function findTaggedTemplates(sourceFile: SourceFile, templateTags: string[]): TaggedTemplateExpression[];
export function findTaggedTemplates(sourceFile: SourceFile, templateTags: string[], position?: number): TaggedTemplateExpression | undefined;
export function findTaggedTemplates(
	sourceFile: SourceFile,
	templateTags: string[],
	position?: number
): TaggedTemplateExpression[] | TaggedTemplateExpression | undefined {
	if (position != null) {
		const token = getNodeAtPosition(sourceFile, position);
		const node = findParent(token, tsModule.ts.isTaggedTemplateExpression);

		if (node != null && tsModule.ts.isTaggedTemplateExpression(node)) {
			if (templateTags.includes(node.tag.getText())) {
				return node;
			}
		}

		return undefined;
	} else {
		const taggedTemplates: TaggedTemplateExpression[] = [];

		visitTaggedTemplateNodes(sourceFile, {
			shouldCheckTemplateTag(templateTag: string) {
				return templateTags.includes(templateTag);
			},
			emitTaggedTemplateNode(node: TaggedTemplateExpression) {
				taggedTemplates.push(node);
			}
		});

		return taggedTemplates;
	}
}

export interface TaggedTemplateVisitContext {
	parent?: TaggedTemplateExpression;
	emitTaggedTemplateNode(node: TaggedTemplateExpression): void;
	shouldCheckTemplateTag(templateTag: string): boolean;
}

export function visitTaggedTemplateNodes(astNode: Node, context: TaggedTemplateVisitContext) {
	const newContext = { ...context };
	if (tsModule.ts.isTaggedTemplateExpression(astNode) && context.shouldCheckTemplateTag(astNode.tag.getText())) {
		// Only visit the template expression if the leading comments does not include the ts-ignore flag.
		//if (!leadingCommentsIncludes(astNode.getSourceFile().getText(), astNode.getFullStart(), TS_IGNORE_FLAG)) {
		newContext.parent = astNode;
		context.emitTaggedTemplateNode(astNode);
	}

	astNode.forEachChild(child => visitTaggedTemplateNodes(child, context));
}
