import { LitElement, property } from "lit-element";
import "@polymer/app-layout/app-drawer/app-drawer";

export interface MyBase {
	baseProp: string;
}

export interface MyCard extends MyBase, HTMLElement {}

export class Test extends LitElement implements MyBase {
	sdlkfjsldkfj!: string;
	@property() baseProp: string = "jek";
	lol!: number;
}

customElements.define("hehe-hehe", Test);

/*declare global {
	interface HTMLElementTagNameMap {
		"my-card": MyCard;
	}
}
*/
