import { html, render } from "lit-html";
import { ifDefined } from "lit-html/directives/if-defined";
import "@ideanote/atoms/lib/chunk-48d4e365";
import "@material/mwc-button/mwc-button";
import "./my-element";
import "./my-component";
import { MyBase } from "./my-card";

(async () => {
	await import("./my-card");
})();

const src = "hello.png" as string | undefined;

const myApp = (text: string, disabled: boolean) => html`
	<img src="${ifDefined(src)}" />

	<style>
		my-button {
			color: ${"green"};
		}

		a {
			color: rebeccapurple;
			additive-symbols: cross-fade();
		}
	</style>

	<lkjsldkfj></lkjsldkfj>

	<a .href="" target="_blank" download="hello"></a>

	<my-component @submit="" hello="green green red" onsubmit=""></my-component>

	<sldkfjlskjdf></sldkfjlskjdf>

	<my-tsconfig-element></my-tsconfig-element>
	<at-card @change="${() => {}}" globalattribute>
		<slot></slot>
	</at-card>

	<at-card></at-card>

	<video playsinline muted preload="metadata" aria-pressed="undefined" aria-readonly="true"></video>

	<my-hehehe-hehehe>
		<div slot="myslot"></div>
	</my-hehehe-hehehe>

	<mwc-button dense></mwc-button>

	<div role="heading" .scrollTop="${123}">
		<my-button this-is-an-attr size="${"small"}" text="123"></my-button>
	</div>

	<my-card></my-card>
	<my-element></my-element>

	<mwc-button .dense="${true}"></mwc-button>

	<my-external-tag draggable="false"></my-external-tag>

	<mwc-button label="" dense role="math" aria-checked="true" .accessKey="${"hejsa"}" onsubmit="" .dlfkjsdlfkjsdlfkj="${"test"}" @my-event=""></mwc-button>

	<div @hello="${console.log}">
		<div @change="${() => {}}" @hello="${console.log}" @test-event="${() => {}}" @loadstart="${() => {}}" @hello="${() => {}}">
			<my-element data-looolz="" onmy-change-event="" a b c .minSetter="${""}" .prop1="${"hello"}" my-attr-hehehe="" @test-event="${() => true}">
				<div slot=""></div>
				<div slot="hello"></div>
			</my-element>
		</div>
	</div>

	<input .value="${null}" .disabled="${true}" type="email" maxlength="1" tabindex="${1 === 1 ? "-1" : "0"}" />
	<just-testing></just-testing>
`;

render(myApp("Hello", false), document.body);
