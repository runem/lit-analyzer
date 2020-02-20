## Rules

The default severity of each rule depend on the `strict` [configuration option](#-configuration). Strict mode is disabled as default.

Each rule can have severity of `off`, `warning` or `error`. You can toggle rules as you like.

**Validating custom elements**

<!-- prettier-ignore -->
| Rule    | Description | Severity normal | Severity strict |
| :------ | ----------- | --------------- | --------------- |
| [no-unknown-tag-name](#-no-unknown-tag-name) | The existence of tag names are checked. Be aware that not all custom elements from libraries will be found out of the box. | off | warning |
| [no-missing-import](#-no-missing-import)    | When using custom elements in HTML it is checked if the element has been imported and is available in the current context. | off | warning |
| [no-unclosed-tag](#-no-unclosed-tag)         | Unclosed tags, and invalid self closing tags like custom elements tags, are checked. | warning | error |


**Validating binding names**

<!-- prettier-ignore -->
| Rule    | Description | Severity normal | Severity strict |
| :------ | ----------- | --------------- | --------------- |
| [no-unknown-attribute](#-no-unknown-attribute-no-unknown-property)<br> [no-unknown-property](#-no-unknown-attribute-no-unknown-property) | You will get a warning whenever you use an unknown attribute or property within your `lit-html` template. | off | warning |
| [no-unknown-event](#-no-unknown-event)       | When using event bindings it's checked that the event names are fired. | off | off |
| [no-unknown-slot](#-no-unknown-slot)         | Using the "@slot" jsdoc tag on your custom element class, you can tell which slots are accepted for a particular element. | off | warning |


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
| [no-unintended-mixed-binding](#-no-unintended-mixed-binding)   | Disallow mixed value bindings where a character `'`, `"`, `}` or `/` is unintentionally included in the binding. | warn | warn |

**Validating LitElement**

<!-- prettier-ignore -->
| Rule    | Description | Severity normal | Severity strict |
| :------ | ----------- | --------------- | --------------- |
| [no-incompatible-property-type](#-no-incompatible-property-type) | When using the @property decorator in Typescript, the property option `type` is checked against the declared property Typescript type | error | error |
| [no-invalid-attribute-name](#-no-invalid-attribute-name)         | When using the property option `attribute`, the value is checked to make sure it's a valid attribute name. | error | error |
| [no-invalid-tag-name](#-no-invalid-tag-name)                     | When defining a custom element the tag name is checked to make sure it's valid. | error | error |

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
```js
// No import of "my-element"
html`<my-element></my-element>`
```

The following example is not considered a warning:
```js
import "my-element.js";
html`<my-element></my-element>`
```


#### ☯ no-unclosed-tag

Unclosed tags, and invalid self closing tags like custom elements tags, are checked.

The following examples are considered warnings:
```js
html`<div>`
html`<video />`
html`<custom-element />`
```

The following examples are not considered warnings:
```js
html`<div></div>`
html`<custom-element></custom-element>`
html`<video></video>`
html`<input />`
```

### Validating binding names

Attributes, properties and events are picked up on custom elements using [web-component-analyzer](https://github.com/runem/web-component-analyzer) which supports native custom elements and web components built with LitElement.

#### ✅ no-unknown-attribute, no-unknown-property

You will get a warning whenever you use an unknown attribute or property. This check is made on both custom elements and built in elements. 

**The following example is considered a warning:**
```js
html`<input .valuuue="${value}" unknownattribute="button" />`
```

**The following example is not considered a warning:**
```js
html`<input .value="${value}" type="button" />`
```

#### ⚡️ no-unknown-event

You can opt in to check for unknown event names. Using the `@fires` jsdoc or the statement `this.dispatch(new CustomElement("my-event))` will make the event name available. All event names are accepted globally because events bubble. 

The following example is considered a warning:
```js
html`<input @iinput="${console.log}" />`
```

The following example is not considered a warning:
```js
html`<input @input="${console.log}" />`
```

#### 📬 no-unknown-slot

Using the "@slot" jsdoc tag on your custom element class, you can tell which slots are accepted for a particular element. Then you will get warnings for invalid slot names and if you forget to add the slot attribute on elements without an unnamed slot.

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
```js
html`
<my-element>
  <div slot="not a slot name"></div>
</my-element>
`
```

The following example is not considered a warning:
```js
html`
<my-element>
  <div></div>
  <div slot="right"></div>
  <div slot="left"></div>
</my-element>
`
```


### Validating binding types

Be aware that many checks involving analyzing bindings will work better in Typescript files because we have more information about the values being bound.

#### ❓ no-invalid-boolean-binding

It never makes sense to use the boolean attribute binding on a non-boolean type.

The following example is considered a warning:
```js
html`<input ?type="${"button"}" />`
```

The following example is not considered a warning:
```js
html`<input ?disabled="${isDisabled}" />`
```

#### ⚫️ no-expressionless-property-binding

Because of how `lit-html` [parses bindings internally](https://github.com/Polymer/lit-html/issues/843) you cannot use the property binding without an expression.

The following example is considered a warning:
```js
html`<input .value="text" />`
```

The following example is not considered a warning:
```js
html`<input .value="${text}" />`
```

#### 🌀 no-noncallable-event-binding

It's a common mistake to incorrectly call the function when setting up an event handler binding instead of passing a reference to the function. This makes the function call whenever the code evaluates. 

The following examples are considered warnings:
```js
html`<button @click="${myEventHandler()}">Click</button>`
html`<button @click="${{hannndleEvent: console.log()}}">Click</button>`
```

The following examples are not considered warnings:
```js
html`<button @click="${myEventHandler}">Click</button>`
html`<button @click="${{handleEvent: console.log}}">Click</button>`
```

#### 😈 no-boolean-in-attribute-binding

You should not be binding to a boolean type using an attribute binding because it could result in binding the string "true" or "false". Instead you should be using a **boolean** attribute binding.

This error is particular tricky, because the string "false" is truthy when evaluated in a conditional.

The following example is considered a warning:
```js
html`<input disabled="${isDisabled}" />`
```

The following example is not considered a warning:
```js
html`<input ?disabled="${isDisabled}" />`
```

#### ☢️ no-complex-attribute-binding

Binding an object using an attribute binding would result in binding the string "[object Object]" to the attribute. In this cases it's probably better to use a property binding instead.

The following example is considered a warning:
```js
html`<my-list listitems="${listItems}"></my-list>`
```

The following example is not considered a warning:
```js
html`<my-list .listItems="${listItems}"></my-list>`
```


#### ⭕️ no-nullable-attribute-binding 

Binding `undefined` or `null` in an attribute binding will result in binding the string "undefined" or "null". Here you should probably wrap your expression in the "ifDefined" directive.

The following examples are considered warnings:
```js
html`<input value="${maybeUndefined}" />`
html`<input value="${maybeNull}" />`
```

The following examples are not considered warnings:
```js
html`<input value="${ifDefined(maybeUndefined)}" />`
html`<input value="${ifDefined(maybeNull === null ? undefined : maybeNull)}" />`
```

#### 💔 no-incompatible-type-binding

Assignments in your HTML are typed checked just like it would be in Typescript.

The following examples are considered warnings:
```js
html`<input type="wrongvalue" />`
html`<input placeholder />`
html`<input max="${"hello"}" />`
html`<my-list .listItems="${123}"></my-list>`
```

The following examples are not considered warnings:
```js
html`<input type="button" />`
html`<input placeholder="a placeholder" />`
html`<input max="${123}" />`
html`<my-list .listItems="${listItems}"></my-list>`
```

#### 💥 no-invalid-directive-binding

Directives are checked to make sure that the following rules are met: 
* `ifDefined` is only used in an attribute binding.
* `class` is only used in an attribute binding on the 'class' attribute.
* `style` is only used in an attribute binding on the 'style' attribute.
* `unsafeHTML`, `cache`, `repeat`, `asyncReplace` and `asyncAppend` are only used within a text binding.

The directives already make these checks on runtime, so this will help you catch errors before runtime.

The following examples are considered warnings:
```js
html`<input value="${unsafeHTML(html)}" />`
html`<input .value="${ifDefined(myValue)}" />`
html`<div role="${class(classMap)}"></div>`
```

The following examples are not considered warnings:
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
```js
html`<input .value=${"myvalue"}" />`
html`<input value=${"myvalue"}} />`
html`<input value=${"myvalue"}/>`
html`<input ?required=${true}/>`
```

The following examples are not considered warnings:
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
```js
@customElement("wrongElementName")
class MyElement extends LitElement {
}

customElements.define("alsoWrongName", MyElement);
```

The following example is not considered a warning:
```js
@customElement("my-element")
class MyElement extends LitElement {
}

customElements.define("correct-element-name", MyElement);
```

### Validating CSS

`lit-analyzer` uses [vscode-css-languageservice](https://github.com/Microsoft/vscode-css-languageservice) to validate CSS.

#### 💅 no-invalid-css

CSS within the tagged template literal `css` will be validated. 

The following example is considered a warning:
```js
css`
  button
    background: red;
  }
`
```

The following example is not considered a warning:
```js
css`
  button {
    background: red;
  }
`
```
