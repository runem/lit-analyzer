/**
 * @slot - Unnamed slot
 * @slot right - Right slot
 * @slot left - Right slot
 */
export class MyElement2 extends HTMLElement {
	constructor() {
		super();

		this.foo = "foo";
	}
}

customElements.define("my-element2", MyElement2);
