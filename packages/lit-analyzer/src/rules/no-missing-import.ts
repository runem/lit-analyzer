import { basename, dirname, posix } from "path";
import { RuleModule } from "../analyze/types/rule/rule-module";
import { isCustomElementTagName } from "../analyze/util/is-valid-name";
import { rangeFromHtmlNode } from "../analyze/util/range-util";

/**
 * This rule makes sure that all custom elements used are imported in a given file.
 */
const rule: RuleModule = {
	id: "no-missing-import",
	meta: {
		priority: "low"
	},
	visitHtmlNode(htmlNode, context) {
		const { htmlStore, config, definitionStore, dependencyStore, file } = context;

		// Return if the html tag doesn't exists or if the html tag doesn't have a declaration
		const htmlTag = htmlStore.getHtmlTag(htmlNode);
		if (htmlTag == null) return;

		// Only check if custom elements have been imported.
		const isCustomElement = isCustomElementTagName(htmlNode.tagName);
		if (!isCustomElement) return;

		// Don't continue if this tag name doesn't have a definition.
		// If the html tag doesn't have a definition we won't know how to import it.
		const definition = definitionStore.getDefinitionForTagName(htmlNode.tagName);
		if (definition == null) return;

		// Check if the tag name has been imported in the file of the template.
		const isDefinitionImported = dependencyStore.hasTagNameBeenImported(file.fileName, htmlNode.tagName);

		// Report diagnostic if the html tag hasn't been imported.
		if (!isDefinitionImported) {
			context.report({
				location: rangeFromHtmlNode(htmlNode),
				message: `Missing import for <${htmlNode.tagName}>`,
				suggestion: config.dontSuggestConfigChanges ? undefined : `You can disable this check by disabling the 'no-missing-import' rule.`,
				fix: () => {
					const importPath = getRelativePathForImport(file.fileName, definition.sourceFile.fileName);

					return {
						message: `Import <${definition.tagName}> from module "${importPath}"`,
						actions: [
							{
								kind: "addImport",
								path: importPath,
								file: context.file
							}
						]
					};
				}
			});
		}
	}
};

export default rule;

/**
 * Returns a relative path from a file path to another file path.
 * This path can be used in an import statement.
 * @param fromFileName
 * @param toFileName
 */
function getRelativePathForImport(fromFileName: string, toFileName: string): string {
	const path = posix.relative(dirname(fromFileName), dirname(toFileName));
	const filenameWithoutExt = basename(toFileName).replace(/\.[^/.]+$/, "");
	const prefix = path.startsWith("../") ? "" : "./";
	const importPath = `${prefix}${path ? `${path}/` : ""}${filenameWithoutExt}`;
	return importPath
		.replace(/^.*node_modules\//, "")
		.replace(/\.d$/, "")
		.replace(/\/index$/, "");
}
