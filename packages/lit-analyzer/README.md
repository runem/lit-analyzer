<!-- ⚠️ This README has been generated from the file(s) "readme.blueprint.md" ⚠️--><h1 align="center">lit-analyzer</h1>
<p align="center">
  <b>CLI that type checks bindings in lit-html templates</b></br>
  <sub><sub>
</p>

<br />

<p align="center">
		<a href="https://npmcharts.com/compare/lit-analyzer?minimal=true"><img alt="Downloads per month" src="https://img.shields.io/npm/dm/lit-analyzer.svg" height="20"/></a>
<a href="https://www.npmjs.com/package/lit-analyzer"><img alt="NPM Version" src="https://img.shields.io/npm/v/lit-analyzer.svg" height="20"/></a>
<a href="https://david-dm.org/runem/lit-analyzer"><img alt="Dependencies" src="https://img.shields.io/david/runem/lit-analyzer.svg" height="20"/></a>
<a href="https://github.com/runem/lit-analyzer/graphs/contributors"><img alt="Contributors" src="https://img.shields.io/github/contributors/runem/lit-analyzer.svg" height="20"/></a>
	</p>

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)](#installation)

## ➤ Installation

<!-- prettier-ignore -->
```bash
npm install lit-analyzer -g
```

**Note:**

- If you use Visual Studio Code you can also install the [lit-plugin](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin) extension.
- If you use Typescript you can also install [ts-lit-plugin](https://github.com/runem/lit-analyzer/blob/master/packages/ts-lit-plugin).

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)](#usage)

## ➤ Usage

`lit-analyzer` analyzes an optional `input glob` and emits the output to the console as default. When the `input glob` is omitted it will analyze all components in `src`.

<!-- prettier-ignore -->
```bash
lit-analyzer src
lit-analyzer "src/**/*.{js,ts}"
lit-analyzer my-element.js
lit-analyzer --format markdown --outFile result.md 
```

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)](#configuration)

## ➤ Configuration

You can configure the CLI with arguments:

<!-- prettier-ignore -->
```bash
lit-analyzer --strict --rules.no-unknown-tag-name off --format markdown
```

**Note:** You can also configure the CLI using a `tsconfig.json` file (see [ts-lit-plugin](https://github.com/runem/lit-analyzer/blob/master/packages/ts-lit-plugin)).

### Available arguments

<!-- prettier-ignore -->
| Option | Description | Type | Default |
| :----- | ----------- | ---- | ------- |
| `--help` | Print help message | `boolean` | |
| `--rules.rule-name` | Enable or disable rules (example: --rules.no-unknown-tag-name off). Severity can be "off" \| "warn" \| "error". See a list of rules [here](https://github.com/runem/lit-analyzer/blob/master/docs/readme/rules.md). | `{"rule-name": "off" \| "warn" \| "error"}` |  |
| `--strict` | Enable strict mode. This changes the default ruleset | `boolean` | |
| `--format` | Change the format of how diagnostics are reported | `code` \| `list` \| `markdown` | code |
| `--maxWarnings` | Fail only when the number of warnings is larger than this number | `number` | -1 |
| `--outFile` | Emit all output to a single file  | `filePath` |  |
| `--quiet` | Report only errors and not warnings | `boolean` |  |
| `--failFast` | Exit the process right after the first problem has been found | `boolean` | |
| `--debug` | Enable CLI debug mode | `boolean` |  |

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)](#rules)

## ➤ Rules

The default severity of each rule depend on the `strict` [configuration option](#-configuration). Strict mode is disabled as default.

Each rule can have severity of `off`, `warning` or `error`. You can toggle rules as you like.

**Validating custom elements**

<!-- prettier-ignore -->
| Rule    | Description | Severity normal | Severity strict |
| :------ | ----------- | --------------- | --------------- |
| [no-unknown-tag-name](#-no-unknown-tag-name) | The existence of tag names are checked. Be aware that not all custom elements from libraries will be found out of the box. | off | warning |
| [no-missing-import](#-no-missing-import)     | When using custom elements in HTML it is checked if the element has been imported and is available in the current context. | off | warning |
| [no-unclosed-tag](#-no-unclosed-tag)         | Unclosed tags, and invalid self closing tags like custom elements tags, are checked. | warning | error |
| [no-missing-element-type-definition](#no-missing-element-type-definition) | This rule will ensure that custom elements are registered on the `HTMLElementTagNameMap` Typescript interface. | off | off |

**Validating binding names**

<!-- prettier-ignore -->
| Rule    | Description | Severity normal | Severity strict |
| :------ | ----------- | --------------- | --------------- |
| [no-unknown-attribute](#-no-unknown-attribute-no-unknown-property)<br> [no-unknown-property](#-no-unknown-attribute-no-unknown-property) | You will get a warning whenever you use an unknown attribute or property within your `lit-html` template. | off | warning |
| [no-unknown-event](#-no-unknown-event)       | When using event bindings it's checked that the event names are fired. | off | off |
| [no-unknown-slot](#-no-unknown-slot)         | Using the "@slot" jsdoc tag on your custom element class, you can tell which slots are accepted for a particular element. | off | warning |
| [no-legacy-attribute](#no-legacy-attribute)         | Disallows use of legacy Polymer binding syntax (e.g. `foo$=`). | off | warning |

**Validating binding types**

<!-- prettier-ignore -->
| Rule    | Description | Severity normal | Severity strict |
| :------ | ----------- | --------------- | --------------- |
| [no-invalid-boolean-binding](#-no-invalid-boolean-binding)       | Disallow boolean attribute bindings on non-boolean types. | error | error |
| [no-expressionless-property-binding](#-no-expressionless-property-binding) | Disallow property bindings without an expression. | error | error |
| [no-noncallable-event-binding](#-no-noncallable-event-binding)   | Disallow event listener bindings with a noncallable type. | error | error |
| [no-boolean-in-attribute-binding](#-no-boolean-in-attribute-binding) | Disallow attribute bindings with a boolean type. | error | error |
| [no-complex-attribute-binding](#-no-complex-attribute-binding)   | Disallow attribute bindings with a complex type. | error | error |
| [no-nullable-attribute-binding](#-no-nullable-attribute-binding) | Disallow attribute bindings with nullable types such as "null" or "undefined".  | error | error |
| [no-incompatible-type-binding](#-no-incompatible-type-binding)   | Disallow incompatible type in bindings.  | error | error |
| [no-invalid-directive-binding](#-no-invalid-directive-binding)   | Disallow using built-in directives in unsupported bindings. | error | error |
| [no-unintended-mixed-binding](#-no-unintended-mixed-binding)   | Disallow mixed value bindings where a character `'`, `"`, `}` or `/` is unintentionally included in the binding. | warning | warning |

**Validating LitElement**

<!-- prettier-ignore -->
| Rule    | Description | Severity normal | Severity strict |
| :------ | ----------- | --------------- | --------------- |
| [no-incompatible-property-type](#-no-incompatible-property-type) | When using the @property decorator in Typescript, the property option `type` is checked against the declared property Typescript type | warn | error |
| [no-invalid-attribute-name](#-no-invalid-attribute-name)         | When using the property option `attribute`, the value is checked to make sure it's a valid attribute name. | error | error |
| [no-invalid-tag-name](#-no-invalid-tag-name)                     | When defining a custom element the tag name is checked to make sure it's valid. | error | error |
| [no-property-visibility-mismatch](#no-property-visibility-mismatch) | This rule will ensure public properties use `@property` and non-public properties use `@internalProperty`. | off | warn |

**Validating CSS**

<!-- prettier-ignore -->
| Rule    | Description | Severity normal | Severity strict |
| :------ | ----------- | --------------- | --------------- |
| [💅 no-invalid-css](#-no-invalid-css) | CSS within the tagged template literal `css` will be validated. | warning | error |

### Validating custom elements

All web components in your code are analyzed using [web-component-analyzer](https://github.com/runem/web-component-analyzer) which supports native custom elements and web components built with LitElement.

#### 🤷‍ no-unknown-tag-name

Web components defined in libraries need to either extend the global `HTMLElementTagNameMap` (typescript definition file) or include the "@customElement tag-name" jsdoc on the custom element class.

Below you will see an example of what to add to your library typescript definition files if you want type checking support for a given html tag name.

<!-- prettier-ignore -->
```typescript
declare global {
  interface HTMLElementTagNameMap {
    "my-element": MyElement;
  }
}
```

#### 📣 no-missing-import

When using custom elements in HTML it is checked if the element has been imported and is available in the current context. It's considered imported if any imported module (or their imports) defines the custom element.

The following example is considered a warning:

<!-- prettier-ignore -->
```js
// No import of "my-element"
html`<my-element></my-element>`
```

The following example is not considered a warning:

<!-- prettier-ignore -->
```js
import "my-element.js";
html`<my-element></my-element>`
```

#### ☯ no-unclosed-tag

Unclosed tags, and invalid self closing tags like custom elements tags, are checked.

The following examples are considered warnings:

<!-- prettier-ignore -->
```js
html`<div>`
html`<video />`
html`<custom-element />`
```

The following examples are not considered warnings:

<!-- prettier-ignore -->
```js
html`<div></div>`
html`<custom-element></custom-element>`
html`<video></video>`
html`<input />`
```

#### no-missing-element-type-definition

This rule is only applicable to Typescript files.

When sharing custom elements it's a good practice to add custom elements to the global interface `HTMLElementTagNameMap`. This rule will ensure that custom elements are registered on this interface.

The following example is considered a warning:

<!-- prettier-ignore -->
```ts
export class MyElement extends HTMLElement {

} 

customElements.define("my-element", MyElement)
```

The following example is not considered a warning:

<!-- prettier-ignore -->
```ts
export class MyElement extends HTMLElement {

} 

customElements.define("my-element", MyElement)

declare global {
  interface HTMLElementTagNameMap {
    "my-element": MyElement
  }
}
```

### Validating binding names

Attributes, properties and events are picked up on custom elements using [web-component-analyzer](https://github.com/runem/web-component-analyzer) which supports native custom elements and web components built with LitElement.

#### ✅ no-unknown-attribute, no-unknown-property

You will get a warning whenever you use an unknown attribute or property. This check is made on both custom elements and built in elements.

**The following example is considered a warning:**

<!-- prettier-ignore -->
```js
html`<input .valuuue="${value}" unknownattribute="button" />`
```

**The following example is not considered a warning:**

<!-- prettier-ignore -->
```js
html`<input .value="${value}" type="button" />`
```

#### ⚡️ no-unknown-event

You can opt in to check for unknown event names. Using the `@fires` jsdoc or the statement `this.dispatch(new CustomEvent("my-event))` will make the event name available. All event names are accepted globally because events bubble.

The following example is considered a warning:

<!-- prettier-ignore -->
```js
html`<input @iinput="${console.log}" />`
```

The following example is not considered a warning:

<!-- prettier-ignore -->
```js
html`<input @input="${console.log}" />`
```

#### 📬 no-unknown-slot

Using the "@slot" jsdoc tag on your custom element class, you can tell which slots are accepted for a particular element. Then you will get warnings for invalid slot names and if you forget to add the slot attribute on elements without an unnamed slot.

<!-- prettier-ignore -->
```js
/**
 * @slot - This is a comment for the unnamed slot
 * @slot right - Right content
 * @slot left
 */
class MyElement extends HTMLElement {
}
customElements.define("my-element", MyElement);
```

The following example is considered a warning:

<!-- prettier-ignore -->
```js
html`
<my-element>
  <div slot="not a slot name"></div>
</my-element>
`
```

The following example is not considered a warning:

<!-- prettier-ignore -->
```js
html`
<my-element>
  <div></div>
  <div slot="right"></div>
  <div slot="left"></div>
</my-element>
`
```

#### no-legacy-attribute

A common mistake when dealing with Lit in particular is to use the
legacy Polymer syntax as seen in earlier versions of Polymer (the
predecessor of Lit).

The following examples are considered warnings:

<!-- prettier-ignore -->
```js
html`<input name$=${val} />`
html`<input disabled?=${val} />`;
html`<input name="val" />`;
```

The following examples are not considered warnings:

<!-- prettier-ignore -->
```js
html`<input name=${val} />`
html`<input ?disabled=${val} />`;
html`<input name=${val} />`;
```

### Validating binding types

Be aware that many checks involving analyzing bindings will work better in Typescript files because we have more information about the values being bound.

#### ❓ no-invalid-boolean-binding

It never makes sense to use the boolean attribute binding on a non-boolean type.

The following example is considered a warning:

<!-- prettier-ignore -->
```js
html`<input ?type="${"button"}" />`
```

The following example is not considered a warning:

<!-- prettier-ignore -->
```js
html`<input ?disabled="${isDisabled}" />`
```

#### ⚫️ no-expressionless-property-binding

Because of how `lit-html` [parses bindings internally](https://github.com/Polymer/lit-html/issues/843) you cannot use the property binding without an expression.

The following example is considered a warning:

<!-- prettier-ignore -->
```js
html`<input .value="text" />`
```

The following example is not considered a warning:

<!-- prettier-ignore -->
```js
html`<input .value="${text}" />`
```

#### 🌀 no-noncallable-event-binding

It's a common mistake to incorrectly call the function when setting up an event handler binding instead of passing a reference to the function. This makes the function call whenever the code evaluates.

The following examples are considered warnings:

<!-- prettier-ignore -->
```js
html`<button @click="${myEventHandler()}">Click</button>`
html`<button @click="${{hannndleEvent: console.log()}}">Click</button>`
```

The following examples are not considered warnings:

<!-- prettier-ignore -->
```js
html`<button @click="${myEventHandler}">Click</button>`
html`<button @click="${{handleEvent: console.log}}">Click</button>`
```

#### 😈 no-boolean-in-attribute-binding

You should not be binding to a boolean type using an attribute binding because it could result in binding the string "true" or "false". Instead you should be using a **boolean** attribute binding.

This error is particular tricky, because the string "false" is truthy when evaluated in a conditional.

The following example is considered a warning:

<!-- prettier-ignore -->
```js
html`<input disabled="${isDisabled}" />`
```

The following example is not considered a warning:

<!-- prettier-ignore -->
```js
html`<input ?disabled="${isDisabled}" />`
```

#### ☢️ no-complex-attribute-binding

Binding an object using an attribute binding would result in binding the string "[object Object]" to the attribute. In this cases it's probably better to use a property binding instead.

The following example is considered a warning:

<!-- prettier-ignore -->
```js
html`<my-list listitems="${listItems}"></my-list>`
```

The following example is not considered a warning:

<!-- prettier-ignore -->
```js
html`<my-list .listItems="${listItems}"></my-list>`
```

#### ⭕️ no-nullable-attribute-binding

Binding `undefined` or `null` in an attribute binding will result in binding the string "undefined" or "null". Here you should probably wrap your expression in the "ifDefined" directive.

The following examples are considered warnings:

<!-- prettier-ignore -->
```js
html`<input value="${maybeUndefined}" />`
html`<input value="${maybeNull}" />`
```

The following examples are not considered warnings:

<!-- prettier-ignore -->
```js
html`<input value="${ifDefined(maybeUndefined)}" />`
html`<input value="${ifDefined(maybeNull === null ? undefined : maybeNull)}" />`
```

#### 💔 no-incompatible-type-binding

Assignments in your HTML are typed checked just like it would be in Typescript.

The following examples are considered warnings:

<!-- prettier-ignore -->
```js
html`<input type="wrongvalue" />`
html`<input placeholder />`
html`<input max="${"hello"}" />`
html`<my-list .listItems="${123}"></my-list>`
```

The following examples are not considered warnings:

<!-- prettier-ignore -->
```js
html`<input type="button" />`
html`<input placeholder="a placeholder" />`
html`<input max="${123}" />`
html`<my-list .listItems="${listItems}"></my-list>`
```

#### 💥 no-invalid-directive-binding

Directives are checked to make sure that the following rules are met:

- `ifDefined` is only used in an attribute binding.
- `class` is only used in an attribute binding on the 'class' attribute.
- `style` is only used in an attribute binding on the 'style' attribute.
- `unsafeHTML`, `cache`, `repeat`, `asyncReplace` and `asyncAppend` are only used within a text binding.

The directives already make these checks on runtime, so this will help you catch errors before runtime.

The following examples are considered warnings:

<!-- prettier-ignore -->
```js
html`<input value="${unsafeHTML(html)}" />`
html`<input .value="${ifDefined(myValue)}" />`
html`<div role="${class(classMap)}"></div>`
```

The following examples are not considered warnings:

<!-- prettier-ignore -->
```js
html`<button>${unsafeHTML(html)}</button>`
html`<input .value="${myValue}" />`
html`<input value="${myValue}" />`
html`<div class="${class(classMap)}"></div>`
```

#### 🕷 no-unintended-mixed-binding

Sometimes unintended characters sneak into bindings. This often indicates a typo such as `<input value=${"foo"}} />` where the expression is directly followed by a "}" which will be included in the value being bound, resulting in "foo}". Another example is self-closing tags without a space between the binding and "/" like `<input value=${"foo"}/>` which will result in binding the string "myvalue/".

This rule disallows mixed value bindings where a character `'`, `"`, `}` or `/` is unintentionally included in the binding.

The following examples are considered warnings:

<!-- prettier-ignore -->
```js
html`<input .value=${"myvalue"}" />`
html`<input value=${"myvalue"}} />`
html`<input value=${"myvalue"}/>`
html`<input ?required=${true}/>`
```

The following examples are not considered warnings:

<!-- prettier-ignore -->
```js
html`<input .value=${"myvalue"} />`
html`<input value="${"myvalue"}" />`
html`<input ?required=${true} />`
html`<input @input="${console.log}" />`
```

### Validating LitElement

#### 💞 no-incompatible-property-type

This rule checks that LitElement-controlled properties are correctly configured in accordance with the default value converter.

The following is a summary of what this rule does:

1. The `type` given to the LitElement property configuration is checked against the actual Typescript type of the property.
2. The default converter only accepts the types `String`, `Boolean`, `Number`, `Array` and `Object`, so all other values for `type` are considered warnings.
3. The absence of a `type` is only considered a warning if the property is not assignable to the `string` type.

This rule will not check for a given LitElement-controlled property if the property has custom converter configured.

The following examples are considered warnings:

<!-- prettier-ignore -->
```js
class MyElement extends LitElement {
  @property({type: Number}) text: string;
  @property({type: Boolean}) count: number;
  @property({type: String}) disabled: boolean;
  @property({type: Object}) list: ListItem[];

  static get properties () {
    return {
      callback: {
        type: Function
      },
      text: {
        type: MyElement
      }
    }
  }
}
```

The following examples are not considered warnings:

<!-- prettier-ignore -->
```js
class MyElement extends LitElement {
  @property({type: String}) text: string;
  @property({type: Number}) count: number;
  @property({type: Boolean}) disabled: boolean;
  @property({type: Array}) list: ListItem[];

  static get properties () {
    return {
      callback: {
        type: Function,
        converter: myCustomConverter
      },
      text: {
        type: String
      }
    }
  }

}
```

#### ⁉️ no-invalid-attribute-name

When using the property option `attribute`, the value is checked to make sure it's a valid attribute name.

The following example is considered a warning:

<!-- prettier-ignore -->
```js
class MyElement extends LitElement {
  static get properties () {
    return {
      text: {
        attribute: "invald=name"
      }
    }
  }
}
```

#### ⁉️ no-invalid-tag-name

When defining a custom element, the tag name is checked to make sure it's a valid custom element name.

The following example is considered a warning:

<!-- prettier-ignore -->
```js
@customElement("wrongElementName")
class MyElement extends LitElement {
}

customElements.define("alsoWrongName", MyElement);
```

The following example is not considered a warning:

<!-- prettier-ignore -->
```js
@customElement("my-element")
class MyElement extends LitElement {
}

customElements.define("correct-element-name", MyElement);
```

#### no-property-visibility-mismatch

When using the `@property` decorator, your property should be publicly visible,
expected to be exposed to consumers of the element. Private and protected
properties however, should make use of the `@internalProperty` decorator
instead.

This rule will ensure public properties use `@property` and non-public
properties use `@internalProperty`.

The following example is considered a warning:

<!-- prettier-ignore -->
```ts
class MyElement extends LitElement {
	@property() private myProperty: string;
}
```

### Validating CSS

`lit-analyzer` uses [vscode-css-languageservice](https://github.com/Microsoft/vscode-css-languageservice) to validate CSS.

#### 💅 no-invalid-css

CSS within the tagged template literal `css` will be validated.

The following example is considered a warning:

<!-- prettier-ignore -->
```js
css`
  button
    background: red;
  }
`
```

The following example is not considered a warning:

<!-- prettier-ignore -->
```js
css`
  button {
    background: red;
  }
`
```

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)](#documenting-slots-events-attributes-and-properties)

## ➤ Documenting slots, events, attributes and properties

Code is analyzed using [web-component-analyzer](https://github.com/runem/web-component-analyzer) in order to find properties, attributes and events. Unfortunately, sometimes it's not possible to analyze these things by looking at the code, and you will have to document how your component looks using `jsdoc`like this:

<!-- prettier-ignore -->
```js
/**
 * This is my element
 * @attr size
 * @attr {red|blue} color - The color of my element
 * @prop {String} value
 * @prop {Boolean} myProp - This is my property
 * @fires change
 * @fires my-event - This is my own event
 * @slot - This is a comment for the unnamed slot
 * @slot right - Right content
 * @slot left
 * @cssprop {Color} --border-color
 * @csspart header
 */
class MyElement extends HTMLElement { 
}

customElements.define("my-element", MyElement);
```

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)](#contributors)

## ➤ Contributors

| [<img alt="Rune Mehlsen" src="https://avatars2.githubusercontent.com/u/5372940?s=460&v=4" width="100">](https://twitter.com/runemehlsen) | [<img alt="Andreas Mehlsen" src="https://avatars1.githubusercontent.com/u/6267397?s=460&v=4" width="100">](https://twitter.com/andreasmehlsen) | [<img alt="You?" src="https://joeschmoe.io/api/v1/random" width="100">](https://github.com/runem/lit-analyzer/blob/master/CONTRIBUTING.md) |
| :--------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------: |
|                                             [Rune Mehlsen](https://twitter.com/runemehlsen)                                              |                                             [Andreas Mehlsen](https://twitter.com/andreasmehlsen)                                              |                                 [You?](https://github.com/runem/lit-analyzer/blob/master/CONTRIBUTING.md)                                  |

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)](#license)

## ➤ License

Licensed under [MIT](https://opensource.org/licenses/MIT).
