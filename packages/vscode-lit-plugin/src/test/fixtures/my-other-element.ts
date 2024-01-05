export class MyOtherElement extends HTMLElement {}

customElements.define("my-other-element", MyOtherElement);

declare global {
	interface HTMLElementTagNameMap {
		"my-other-element": MyOtherElement;
	}
}
