import { LitElement, property, html } from "lit-element";

/**
 * hfhhdf
 * @customElement my-custom-element
 * @event submit
 * @slot myslot - My Slot
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
 * @event my-change-event
 * @attr disabled
 * @slot - Main content
 */
class Test extends MyBase {
	sdlkfjsldkfj!: string;

	@property({ type: Number }) text!: string;

	@property({ type: Boolean }) hehehehe!: boolean;

	mynumber!: number;
}

customElements.define("my-test", Test);

declare global {
	interface HTMLElementTagNameMap {
		"my-card": Test;
	}

	interface HTMLElementEventMap {
		"my-event-test": CustomEvent<string>;
	}
}
