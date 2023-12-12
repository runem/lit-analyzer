export class MyDefinedElement extends HTMLElement {}

customElements.define("my-defined-element", MyDefinedElement);

declare global {
	interface HTMLElementTagNameMap {
		"my-defined-element": MyDefinedElement;
	}
}
