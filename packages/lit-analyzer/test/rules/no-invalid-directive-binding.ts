import test from "ava";
import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";

test("Cannot use 'ifDefined' directive in boolean attribute binding", t => {
	const { diagnostics } = getDiagnostics('type ifDefined = Function; html`<input ?maxlength="${ifDefined({} as number | undefined)}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-directive-binding");
});

test("Can use 'ifDefined' directive in attribute binding", t => {
	const { diagnostics } = getDiagnostics('type ifDefined = Function; html`<input maxlength="${ifDefined({} as number | undefined)}" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Cannot use 'ifDefined' directive in property binding", t => {
	const { diagnostics } = getDiagnostics('type ifDefined = Function; html`<input .maxLength="${ifDefined({} as number | undefined)}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-directive-binding");
});

test("Cannot use 'ifDefined' directive in event listener binding", t => {
	const { diagnostics } = getDiagnostics('type ifDefined = Function; html`<input @max="${ifDefined(() => {})}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-directive-binding");
});

test("Can use 'classMap' directive on class attribute", t => {
	const { diagnostics } = getDiagnostics('type classMap = Function; html`<input class="${classMap({foo: true})}" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Cannot use 'classMap' directive on non-class attribute", t => {
	const { diagnostics } = getDiagnostics('type classMap = Function; html`<input notclass="${classMap({foo: true})}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-directive-binding");
});

test("Cannot use 'classMap' directive in property binding", t => {
	const { diagnostics } = getDiagnostics('type classMap = Function; html`<input .class="${classMap({foo: true})}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-directive-binding");
});

test("Can use 'styleMap' directive on style attribute", t => {
	const { diagnostics } = getDiagnostics('type styleMap = Function; html`<input style="${styleMap({color: "white"})}" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Cannot use 'styleMap' directive on non-style attribute", t => {
	const { diagnostics } = getDiagnostics('type styleMap = Function; html`<input nonstyle="${styleMap({color: "white"})}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-directive-binding");
});

test("Cannot use 'styleMap' directive in property binding", t => {
	const { diagnostics } = getDiagnostics('type classMap = Function; html`<input .style="${styleMap({color: "white"})}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-directive-binding");
});

test("Cannot use 'unsafeHTML' directive in attribute binding", t => {
	const { diagnostics } = getDiagnostics('type unsafeHTML = Function; html`<input maxlength="${unsafeHTML("<h1>Hello</h1>")}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-directive-binding");
});

test("Can use 'unsafeHTML' directive text binding", t => {
	const { diagnostics } = getDiagnostics('type unsafeHTML = Function; html`<div>${unsafeHTML("<h1>Hello</h1>")}"</div>`');
	hasNoDiagnostics(t, diagnostics);
});
