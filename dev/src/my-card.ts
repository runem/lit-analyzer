import { LitElement, property, html } from "lit-element";
import { ifDefined } from "lit-html/directives/if-defined";
import { repeat } from "lit-html/directives/repeat";
import { classMap } from "lit-html/directives/class-map";
import { styleMap } from "lit-html/directives/style-map";
import { guard } from "lit-html/directives/guard";
import { Button } from "@material/mwc-button";

/**
 * hfhhdf
 * @customElement my-custom-element
 * @event submit
 * @slot myslot - My Slot
 * @attr {red|green} color
 * @attr size
 */
export class MyBase extends LitElement {
	hehe!: string;

	click() {
		this.hehe;
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

customElements.define("my-hehehe-hehehe", Test);

declare global {
	interface HTMLElementTagNameMap {
		"my-card": Test;
	}

	interface HTMLElementEventMap {
		"my-event-test": CustomEvent<string>;
	}
}

const src = "hello.png" as string | undefined;
html`
	<img src="${ifDefined(src)}" alt="${repeat([], () => html``)}" />

	<hehehe></hehehe>

	<video width="500%"></video>

	<my-element></my-element>
	<my-element></my-element>

	<div>
		${repeat([], () => html``)}
	</div>
`;

const classes = {};
html`
	<div .class="${classMap(classes)}">Classy text</div>
`;

const style = {};
html`
	<p .style="${styleMap(style)}">Hello style!</p>
`;

html`
	<img src="${guard([src], () => (Math.random() > 0.5 ? "something.png" : "nothing.png"))}" />
	<mwc-button></mwc-button>
`;

html`
	<input ?disabled="${"hello"}" />
`; /* <input disabled="true" /> */
html`
	<input ?disabled="${true}" />
`; /* <input disabled="true" /> */
html`
	<input ?disabled="${false}" />
`; /* <input disabled="false" /> */
html`
	<input ?disabled="${true}" />
`; /* <input disabled /> */
html`
	<input ?disabled="${false}" />
`; /* <input /> */
