import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { tsTest } from "../helpers/ts-test";

tsTest("Cannot use 'ifDefined' directive in boolean attribute binding", t => {
	const { diagnostics } = getDiagnostics('type ifDefined = Function; html`<input ?maxlength="${ifDefined({} as number | undefined)}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-directive-binding");
});

tsTest("Can use 'ifDefined' directive in attribute binding", t => {
	const { diagnostics } = getDiagnostics('type ifDefined = Function; html`<input maxlength="${ifDefined({} as number | undefined)}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Cannot use 'ifDefined' directive in property binding", t => {
	const { diagnostics } = getDiagnostics('type ifDefined = Function; html`<input .maxLength="${ifDefined({} as number | undefined)}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-directive-binding");
});

tsTest("Cannot use 'ifDefined' directive in event listener binding", t => {
	const { diagnostics } = getDiagnostics('type ifDefined = Function; html`<input @max="${ifDefined(() => {})}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-directive-binding");
});

tsTest("Cannot use 'live' directive in attribute binding with non-string type", t => {
	const { diagnostics } = getDiagnostics('type live = Function; html`<input value="${live(123)}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-directive-binding");
});

tsTest("Can use 'live' directive in attribute binding with string type", t => {
	const { diagnostics } = getDiagnostics("type live = Function; html`<input value=\"${live('test')}\" />`");
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Can use 'live' directive in property binding", t => {
	const { diagnostics } = getDiagnostics('type live = Function; html`<input .maxLength="${live(123)}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Can use 'classMap' directive on class attribute", t => {
	const { diagnostics } = getDiagnostics('type classMap = Function; html`<input class="${classMap({foo: true})}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Cannot use 'classMap' directive on non-class attribute", t => {
	const { diagnostics } = getDiagnostics('type classMap = Function; html`<input notclass="${classMap({foo: true})}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-directive-binding");
});

tsTest("Cannot use 'classMap' directive in property binding", t => {
	const { diagnostics } = getDiagnostics('type classMap = Function; html`<input .class="${classMap({foo: true})}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-directive-binding");
});

tsTest("Can use 'styleMap' directive on style attribute", t => {
	const { diagnostics } = getDiagnostics('type styleMap = Function; html`<input style="${styleMap({color: "white"})}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Cannot use 'styleMap' directive on non-style attribute", t => {
	const { diagnostics } = getDiagnostics('type styleMap = Function; html`<input nonstyle="${styleMap({color: "white"})}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-directive-binding");
});

tsTest("Cannot use 'styleMap' directive in property binding", t => {
	const { diagnostics } = getDiagnostics('type classMap = Function; html`<input .style="${styleMap({color: "white"})}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-directive-binding");
});

tsTest("Cannot use 'unsafeHTML' directive in attribute binding", t => {
	const { diagnostics } = getDiagnostics('type unsafeHTML = Function; html`<input maxlength="${unsafeHTML("<h1>Hello</h1>")}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-directive-binding");
});

tsTest("Can use 'unsafeHTML' directive text binding", t => {
	const { diagnostics } = getDiagnostics('type unsafeHTML = Function; html`<div>${unsafeHTML("<h1>Hello</h1>")}"</div>`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Can use 'unsafeSVG' directive text binding", t => {
	const { diagnostics } = getDiagnostics('type unsafeSVG = Function; html`<svg>${unsafeSVG("<circle cx="50" cy="50" r="40" fill="red" />")}"</svg>`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Can use 'templateContent' directive text binding", t => {
	const { diagnostics } = getDiagnostics(
		'const templateEl = document.querySelector("template#myContent"); type templateContent = Function; html`<div>${templateContent(templateEl)}"</div>`'
	);
	hasNoDiagnostics(t, diagnostics);
});
