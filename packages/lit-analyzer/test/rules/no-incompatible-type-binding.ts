import test from "ava";
import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { makeElement } from "../helpers/generate-test-file";

test("Attribute binding: 'no-incompatible-type-binding' is not emitted when the rule is turned off", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="foo" />`', { rules: { "no-incompatible-type-binding": "off" } });
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: String literal (a number) is assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="123" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: String literal (not a number) is not assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="foo" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

test("Attribute binding: Number type expression is assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${123}" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: String literal type expression (a number) is assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${"123"}" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: String literal type expression (not a number) is not assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${"foo"}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

test("Attribute binding: String type expression is not assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${{} as string}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

test("Attribute binding: Expression of type union with two string literals (numbers) is assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${{} as "123" | "321"}" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: Expression of type union with two string literals (one not being a number) is not assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${{} as "123" | "foo"}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

test("Attribute binding: String literal is assignable to string", t => {
	const { diagnostics } = getDiagnostics('html`<input placeholder="foo" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: String literal (a number) is assignable to string", t => {
	const { diagnostics } = getDiagnostics('html`<input placeholder="123" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: String literal expression is assignable to string", t => {
	const { diagnostics } = getDiagnostics('html`<input placeholder="${"foo"}" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: Number type expression is assignable to string", t => {
	const { diagnostics } = getDiagnostics('html`<input placeholder="${123}" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: String literal (0 length) is assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: String literal (0 length) is assignable to string", t => {
	const { diagnostics } = getDiagnostics('html`<input placeholder="" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: String literal (0 length) is assignable to boolean", t => {
	const { diagnostics } = getDiagnostics('html`<input required="" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: String literal is not assignable to boolean", t => {
	const { diagnostics } = getDiagnostics('html`<input required="foo" />`', { rules: { "no-boolean-in-attribute-binding": false } });
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

test("Attribute binding: Number type expression is not assignable to boolean", t => {
	const { diagnostics } = getDiagnostics('html`<input required="${123}" />`', { rules: { "no-boolean-in-attribute-binding": false } });
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

test("Attribute binding: Boolean attribute is assignable to boolean", t => {
	const { diagnostics } = getDiagnostics("html`<input required />`");
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: Boolean type expression is assignable to 'true'|'false'", t => {
	const { diagnostics } = getDiagnostics('let b = true; html`<input aria-expanded="${b}" />`', {
		rules: { "no-boolean-in-attribute-binding": false }
	});
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: Boolean type expression (true) is assignable to 'true'|'false'", t => {
	const { diagnostics } = getDiagnostics('html`<input aria-expanded="${true}" />`', { rules: { "no-boolean-in-attribute-binding": false } });
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: Boolean type expression (false) is assignable to 'true'|'false'", t => {
	const { diagnostics } = getDiagnostics('html`<input aria-expanded="${false}" />`', { rules: { "no-boolean-in-attribute-binding": false } });
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: Union of 'string | Directive' type expression is assignable to string", t => {
	const { diagnostics } = getDiagnostics('type DirectiveFn = {}; html`<input placeholder="${{} as string | DirectiveFn}" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Boolean binding: Empty string literal is not assignable in a boolean attribute binding", t => {
	const { diagnostics } = getDiagnostics('html`<input ?required="${""}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

test("Boolean binding: Boolean is assignable in a boolean attribute binding", t => {
	const { diagnostics } = getDiagnostics('html`<input ?required="${true}" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Boolean binding: String is not assignable in boolean attribute binding", t => {
	const { diagnostics } = getDiagnostics('html`<input ?required="${{} as string}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

test("Property binding: String literal type expression is not assignable to boolean property", t => {
	const { diagnostics } = getDiagnostics([makeElement({ properties: ["required = false"] }), 'html`<my-element .required="${"foo"}"></my-element>`']);
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

test("Property binding: String literal (0 length) type expression is not assignable to boolean property", t => {
	const { diagnostics } = getDiagnostics([makeElement({ properties: ["required = false"] }), 'html`<my-element .required="${""}"></my-element>`']);
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

test("Property binding: Number type expression is not assignable to boolean property", t => {
	const { diagnostics } = getDiagnostics([makeElement({ properties: ["required = false"] }), 'html`<my-element .required="${123}"></my-element>`']);
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

test("Property binding: Boolean type expression is not assignable to boolean property", t => {
	const { diagnostics } = getDiagnostics([makeElement({ properties: ["required = false"] }), 'html`<my-element .required="${true}"></my-element>`']);
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: 'ifDefined' directive correctly removes 'undefined' from the type union 1", t => {
	const { diagnostics } = getDiagnostics('type ifDefined = Function; html`<input maxlength="${ifDefined({} as number | undefined)}" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: 'ifDefined' directive correctly removes 'undefined' from the type union 2", t => {
	const { diagnostics } = getDiagnostics('type ifDefined = Function; html`<input maxlength="${ifDefined({} as number | string | undefined)}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

test("Attribute binding: 'guard' directive correctly infers correct type from the callback 1", t => {
	const { diagnostics } = getDiagnostics('type guard = Function; html`<img src="${guard([""], () => "nothing.png")}" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Attribute binding: 'guard' directive correctly infers correct type from the callback 2", t => {
	const { diagnostics } = getDiagnostics('type guard = Function; html`<input maxlength="${guard([""], () => ({} as string | number))}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});
