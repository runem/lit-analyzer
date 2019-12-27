import { ExecutionContext } from "ava";
import test from "ava";

import { compileFiles } from "../../helpers/compile-files";
import { findTaggedTemplates } from "../../../src/analyze/parse/tagged-template/find-tagged-templates";
import { CssDocument } from "../../../src/analyze/parse/document/text-document/css-document/css-document";
import { VirtualAstCssDocument } from "../../../src/analyze/parse/document/virtual-document/virtual-css-document";

function createCssDocument(testFile: string) {
	const { sourceFile } = compileFiles(testFile);
	const taggedTemplates = findTaggedTemplates(sourceFile, ["css"]);
	return new CssDocument(new VirtualAstCssDocument(taggedTemplates[0]));
}

function isTemplateText(t: ExecutionContext, text: string, testFile: string) {
	t.is(text, createCssDocument(testFile).virtualDocument.text);
}

test("Substitute for template followed by percent", t => {
	isTemplateText(t, "{ div { transform-origin: 0000% 0000%; } }", "css`{ div { transform-origin: ${x}% ${y}%; } }`");
});

test("Substitute for template last in css list", t => {
	isTemplateText(t, "{ div { border: 2px solid ________; } }", "css`{ div { border: 2px solid ${COLOR}; } }`");
});

test("Substitute for template first in css list", t => {
	isTemplateText(t, "{ div { border: ________ solid #ffffff; } }", "css`{ div { border: ${WIDTH} solid #ffffff; } }`");
});

test("Substitute for template middle in css list", t => {
	isTemplateText(t, "{ div { border: 2px ________ #ffffff; } }", "css`{ div { border: 2px ${STYLE} #ffffff; } }`");
});

test("Substitute for template css key-value pair", t => {
	isTemplateText(t, "{ div { $_:_______________________; } }", "css`{ div { ${unsafeCSS('color: red')}; } }`");
});

test("Substitute for template css value only", t => {
	isTemplateText(t, "{ div { color: ___________________; } }", "css`{ div { color: ${unsafeCSS('red')}; } }`");
});

test("Substitute for template css key only", t => {
	isTemplateText(t, "{ div { $____________________: red; } }", "css`{ div { ${unsafeCSS('color')}: red; } }`");
});
