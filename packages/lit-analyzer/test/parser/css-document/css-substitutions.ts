import { ExecutionContext } from "ava";
import { CssDocument } from "../../../src/analyze/parse/document/text-document/css-document/css-document";
import { VirtualAstCssDocument } from "../../../src/analyze/parse/document/virtual-document/virtual-css-document";
import { findTaggedTemplates } from "../../../src/analyze/parse/tagged-template/find-tagged-templates";

import { compileFiles } from "../../helpers/compile-files";
import { tsTest } from "../../helpers/ts-test";

function createCssDocument(testFile: string) {
	const { sourceFile } = compileFiles(testFile);
	const taggedTemplates = findTaggedTemplates(sourceFile, ["css"]);
	return new CssDocument(new VirtualAstCssDocument(taggedTemplates[0]));
}

function isTemplateText(t: ExecutionContext, text: string, testFile: string) {
	t.is(text, createCssDocument(testFile).virtualDocument.text);
}

tsTest("Substitute for template followed by percent", t => {
	isTemplateText(t, "{ div { transform-origin: 00% 01%; } }", "css`{ div { transform-origin: ${x}% ${y}%; } }`");
});

tsTest("Substitute for template last in css list", t => {
	isTemplateText(t, "{ div { border: 2px solid _0; } }", "css`{ div { border: 2px solid ${COLOR}; } }`");
});

tsTest("Substitute for template first in css list", t => {
	isTemplateText(t, "{ div { border: _0 solid #ffffff; } }", "css`{ div { border: ${WIDTH} solid #ffffff; } }`");
});

tsTest("Substitute for template middle in css list", t => {
	isTemplateText(t, "{ div { border: 2px _0 #ffffff; } }", "css`{ div { border: 2px ${STYLE} #ffffff; } }`");
});

tsTest("Substitute for template css key-value pair", t => {
	isTemplateText(t, "{ div { $_:_0; } }", "css`{ div { ${unsafeCSS('color: red')}; } }`");
});

tsTest("Substitute for template css value only", t => {
	isTemplateText(t, "{ div { color: _0; } }", "css`{ div { color: ${unsafeCSS('red')}; } }`");
});

tsTest("Substitute for template css key only", t => {
	isTemplateText(t, "{ div { $_0: red; } }", "css`{ div { ${unsafeCSS('color')}: red; } }`");
});
