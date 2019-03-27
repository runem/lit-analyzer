import { LitElement, property, html } from "lit-element";

/**
 * hfhhdf
 * @customElement my-custom-element
 * @event submit
 * @attr {red|green} color
 * @attr size
 */
export class MyBase extends LitElement {
	baseProp!: string;

	click() {
		this.dispatchEvent(new CustomEvent("my-event", { detail: "hehehehe" }));
	}
}

/**
 * Hello
 * @event my-event
 * @attr disabled
 */
class Test extends LitElement {
	sdlkfjsldkfj!: string;

	@property({ type: String }) text!: number;

	@property({ type: Boolean }) hehehehe!: string;

	mynumber!: number;
}

customElements.define("my-test", Test);

declare global {
	interface HTMLElementTagNameMap {
		"my-card": Test;
	}

	interface HTMLElementEventMap {
		"my-event": CustomEvent<string>;
	}
}
