import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { tsTest } from "../helpers/ts-test";

tsTest("Event binding: Callable value is bindable", t => {
	const { diagnostics } = getDiagnostics('html`<input @change="${() => {}}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Event binding: Non callback value is not bindable", t => {
	const { diagnostics } = getDiagnostics('html`<input @change="${(() => {})()}" />`');
	hasDiagnostic(t, diagnostics, "no-noncallable-event-binding");
});

tsTest("Event binding: Number is not bindable", t => {
	const { diagnostics } = getDiagnostics('html`<input @change="${123}" />`');
	hasDiagnostic(t, diagnostics, "no-noncallable-event-binding");
});

tsTest("Event binding: Function is bindable", t => {
	const { diagnostics } = getDiagnostics('function foo() {}; html`<input @change="${foo}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Event binding: Called function is not bindable", t => {
	const { diagnostics } = getDiagnostics('function foo() {}; html`<input @change="${foo()}" />`');
	hasDiagnostic(t, diagnostics, "no-noncallable-event-binding");
});

tsTest("Event binding: Any type is bindable", t => {
	const { diagnostics } = getDiagnostics('html`<input @change="${{} as any}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Event binding: Object with callable 'handleEvent' is bindable 1", t => {
	const { diagnostics } = getDiagnostics('html`<input @change="${{handleEvent: () => {}}}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Event binding: Object with callable 'handleEvent' is bindable 2", t => {
	const { diagnostics } = getDiagnostics('function foo() {}; html`<input @change="${{handleEvent: foo}}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Event binding: Object with called 'handleEvent' is not bindable", t => {
	const { diagnostics } = getDiagnostics('function foo() {}; html`<input @change="${{handleEvent: foo()}}" />`');
	hasDiagnostic(t, diagnostics, "no-noncallable-event-binding");
});

tsTest("Event binding: Object literal without 'handleEvent' is not bindable", t => {
	const { diagnostics } = getDiagnostics('function foo() {}; html`<input @change="${{foo: "bar"}}" />`');
	hasDiagnostic(t, diagnostics, "no-noncallable-event-binding");
});

tsTest("Event binding: Mixed value binding with first expression being callable is bindable", t => {
	const { diagnostics } = getDiagnostics('html`<input @change="foo${console.log}bar" />`');
	hasNoDiagnostics(t, diagnostics);
});
