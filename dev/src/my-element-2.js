export class MyElement2 extends HTMLElement {
	constructor() {
		super();

		this.foo = "foo";
	}
}

customElements.define("my-element2", MyElement2);
