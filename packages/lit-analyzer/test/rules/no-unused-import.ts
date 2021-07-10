import { getDiagnostics, getCodeFixesAtRange } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { makeElement } from "../helpers/generate-test-file";
import { tsTest } from "../helpers/ts-test";

tsTest("Report unused imports of custom elements", t => {
	const { diagnostics } = getDiagnostics([makeElement({}), "import './my-element'"], { rules: { "no-unused-import": true } });
	hasDiagnostic(t, diagnostics, "no-unused-import");
});

tsTest("Don't report unused imports when a imported custom element has been used 1", t => {
	const { diagnostics } = getDiagnostics([makeElement({}), "import './my-element'; html`<my-element></my-element>`"], {
		rules: { "no-unused-import": true }
	});
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Don't report unused imports when a imported custom element has been used 2", t => {
	const { diagnostics } = getDiagnostics(
		[
			makeElement({}),
			{
				fileName: "file2.ts",
				text: "import './my-element'; ",
				entry: false
			},
			{
				fileName: "entry.ts",
				text: "import './file2'; html`<my-element></my-element>`",
				entry: true
			}
		],
		{ rules: { "no-unused-import": true } }
	);
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Don't report unused imports when a imported custom element has been used 3", t => {
	const { diagnostics } = getDiagnostics(
		[
			{
				fileName: "file2.ts",
				text: `
                customElements.define( "foo-element", class Foo extends HTMLElement {});
                customElements.define( "bar-element", class Bar extends HTMLElement {});
                customElements.define( "baz-element", class Baz extends HTMLElement {});
                `,
				entry: false
			},
			{
				fileName: "entry.ts",
				text: "import './file2'; html`<bar-element></bar-element>`",
				entry: true
			}
		],
		{ rules: { "no-unused-import": true } }
	);
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Suggest removing unused import statement", t => {
	const unusedImportStatement = "import './unused-element';";
	const fileContentWithUnusedImport = `import './my-element';
    import './unused-element';
    import './used-element';

    html\`<my-element></my-element><used-element></used-element>\`
    `;

	const start = fileContentWithUnusedImport.indexOf(unusedImportStatement);
	const end = start + unusedImportStatement.length - 1;

	const { codeFixes } = getCodeFixesAtRange(
		[
			makeElement({}),
			{
				fileName: "file2.ts",
				text: "import './my-element'"
			},
			{
				fileName: "entry.ts",
				text: fileContentWithUnusedImport,
				entry: true
			}
		],
		{ start, end },
		{ rules: { "no-unused-import": true } }
	);

	const correctCodeFixCreated = codeFixes.some(litCodeFix => litCodeFix.actions.some(litCodeFixAction => litCodeFixAction.newText === ""));

	t.true(correctCodeFixCreated);
});
