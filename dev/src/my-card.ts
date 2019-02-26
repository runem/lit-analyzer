import { LitElement, property } from "lit-element";
import "@polymer/app-layout/app-drawer/app-drawer";

/**
 * hfhhdf
 * @fire MyCustomEvent#my-event
 * @attr color
 * @attr size
 */
export class MyBase extends LitElement {
	baseProp!: string;
}

/**
 * Hello
 * @fire MyCustomEvent#my-event
 * @attr disabled
 */
class Test extends MyBase {
	sdlkfjsldkfj!: string;
	@property() baseProp: string = "jek";
	lol!: number;
}

customElements.define("my-test", Test);

declare global {
	interface HTMLElementTagNameMap {
		"my-card": Test;
	}

	/*interface HTMLElementEventMap {
		"my-event": CustomEvent<string>;
	}*/
}
