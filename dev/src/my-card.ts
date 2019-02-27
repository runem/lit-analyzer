import { LitElement, property } from "lit-element";
import "@polymer/app-layout/app-drawer/app-drawer";

/**
 * hfhhdf
 * @emits submit
 * @attr color
 * @attr size
 */
export class MyBase extends LitElement {
	baseProp!: string;

	click() {
		this.dispatchEvent(new CustomEvent("my-event", { detail: "hehehehe" }));
	}
}

html`
	<my-element prop-et></my-element>
	<my-external-tag ondrag="sdlfjf"></my-external-tag>
`;

/**
 * Hello
 * @element my-custom-element
 * @fires my-event
 * @attr disabled
 */
class Test extends MyBase {
	sdlkfjsldkfj!: string;
	@property() baseProp: string = "jek";
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
