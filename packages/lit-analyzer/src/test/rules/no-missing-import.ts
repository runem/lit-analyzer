import { getDiagnostics, getCodeFixesAtRange } from "../helpers/analyze.js";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert.js";
import { makeElement } from "../helpers/generate-test-file.js";
import { tsTest } from "../helpers/ts-test.js";
import { TestFile } from "../helpers/compile-files.js";

tsTest("Report missing imports of custom elements", t => {
	const { diagnostics } = getDiagnostics([makeElement({}), "html`<my-element></my-element>`"], { rules: { "no-missing-import": true } });
	hasDiagnostic(t, diagnostics, "no-missing-import");
});

tsTest("Don't report missing imports when the custom element has been imported 1", t => {
	const { diagnostics } = getDiagnostics([makeElement({}), "import './my-element'; html`<my-element></my-element>`"], {
		rules: { "no-missing-import": true }
	});
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Don't report missing imports when the custom element has been imported 2", t => {
	const { diagnostics } = getDiagnostics(
		[
			makeElement({}),
			{
				fileName: "file2.ts",
				text: "import './my-element'"
			},
			"import './file2'; html`<my-element></my-element>`"
		],
		{ rules: { "no-missing-import": true } }
	);
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Suggest adding correct import statement", t => {
	const fileContentWithMissingImport = "html`<my-element></my-element>`";
	const elementTagWithoutImport = "my-element";

	// the range has to point to the name of an element. In this case it is 6 to 15.
	// html`<my-element></my-element>`
	// 0123456789012345678901234567891
	//       |--------|
	//       my-element
	const start = fileContentWithMissingImport.indexOf(elementTagWithoutImport);
	const end = start + elementTagWithoutImport.length - 1;

	const { codeFixes } = getCodeFixesAtRange(
		[makeElement({}), fileContentWithMissingImport],
		{ start, end },
		{ rules: { "no-missing-import": true } }
	);
	const correctCodeFixCreated = codeFixes.some(litCodeFix =>
		litCodeFix.actions.some(litCodeFixAction => litCodeFixAction.newText === '\nimport "./my-element";')
	);

	t.true(correctCodeFixCreated);
});

tsTest("Suggest adding correct import statement for element in nested folder", t => {
	const fileContentWithMissingImport = "html`<my-element></my-element>`";
	const elementTagWithoutImport = "my-element";

	// the range has to point to the name of an element. In this case it is 6 to 15.
	// html`<my-element></my-element>`
	// 0123456789012345678901234567891
	//       |--------|
	//       my-element
	const start = fileContentWithMissingImport.indexOf(elementTagWithoutImport);
	const end = start + elementTagWithoutImport.length - 1;
	const nestedElement: TestFile = {
		fileName: "1/2/3/4/5/my-element.ts",
		text: `
		class MyElement extends HTMLElement {
		};
		customElements.define("my-element", MyElement);
		`
	};
	const { codeFixes } = getCodeFixesAtRange([nestedElement, fileContentWithMissingImport], { start, end }, { rules: { "no-missing-import": true } });

	const correctCodeFixCreated = codeFixes.some(litCodeFix =>
		litCodeFix.actions.some(litCodeFixAction => litCodeFixAction.newText === '\nimport "./1/2/3/4/5/my-element";')
	);

	t.true(correctCodeFixCreated);
});
