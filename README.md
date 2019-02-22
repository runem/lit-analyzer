<p align="center">
  <img src="https://raw.githubusercontent.com/runem/ts-lit-plugin/master/documentation/asset/lit-plugin@256w.png" alt="Logo" width="200" height="auto" />
</p>
<h1 align="center">ts-lit-plugin</h1>
<p align="center">
		<a href="https://npmcharts.com/compare/ts-lit-plugin?minimal=true"><img alt="Downloads per month" src="https://img.shields.io/npm/dm/ts-lit-plugin.svg" height="20"/></a>
<a href="https://www.npmjs.com/package/ts-lit-plugin"><img alt="NPM Version" src="https://img.shields.io/npm/v/ts-lit-plugin.svg" height="20"/></a>
<a href="https://david-dm.org/runem/ts-lit-plugin"><img alt="Dependencies" src="https://img.shields.io/david/runem/ts-lit-plugin.svg" height="20"/></a>
<a href="https://github.com/runem/ts-lit-plugin/graphs/contributors"><img alt="Contributors" src="https://img.shields.io/github/contributors/runem/ts-lit-plugin.svg" height="20"/></a>
<a href="https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin"><img alt="Publish at vscode marketplace" src="https://vsmarketplacebadge.apphb.com/version/runem.lit-plugin.svg" height="20"/></a>
	</p>


<p align="center">
  <img src="https://raw.githubusercontent.com/runem/ts-lit-plugin/master/documentation/asset/lit-plugin.gif" alt="Lit plugin GIF"/>
</p>


![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

## ➤ Table of Contents

* [➤ Installation](#-installation)
	* [Visual Studio Code](#visual-studio-code)
	* [Other](#other)
* [➤ Features](#-features)
	* [✅ Attribute type checking](#-attribute-type-checking)
	* [🔍 Automatically pick up on lit-elements](#-automatically-pick-up-on-lit-elements)
	* [🌎 Support for dependencies that extend the global HTMLElementTagNameMap](#-support-for-dependencies-that-extend-the-global-htmlelementtagnamemap)
	* [📣 Report missing imports of custom elements](#-report-missing-imports-of-custom-elements)
	* [🚶Goto definition for html tags and attributes](#goto-definition-for-html-tags-and-attributes)
	* [✏️ Code completions for css and html](#-code-completions-for-css-and-html)
	* [📖 Quick info on hover for html tags and attributes](#-quick-info-on-hover-for-html-tags-and-attributes)
	* [⚠️ Warning if required attributes are not included](#-warning-if-required-attributes-are-not-included)
	* [🙈 Support for @ts-ignore comments inside html](#-support-for-ts-ignore-comments-inside-html)
	* [💅 Reformat html](#-reformat-html)
	* [🚪 Auto close tags](#-auto-close-tags)
* [➤ Configuring the plugin](#-configuring-the-plugin)
	* [disable](#disable)
	* [htmlTemplateTags](#htmltemplatetags)
	* [cssTemplateTags](#csstemplatetags)
	* [globalHtmlTags](#globalhtmltags)
	* [globalHtmlAttributes](#globalhtmlattributes)
	* [skipMissingImports](#skipmissingimports)
	* [skipUnknownHtmlTags](#skipunknownhtmltags)
	* [skipUnknownHtmlAttributes](#skipunknownhtmlattributes)
	* [skipTypeChecking](#skiptypechecking)
	* [format.disable](#formatdisable)
* [➤ Contributors](#-contributors)
* [➤ License](#-license)

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

## ➤ Installation

### Visual Studio Code

If you use Visual Studio Code you can simply install the [lit-plugin](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin) extension.

```bash
code --install-extension runem.lit-plugin
```

### Other

First, install the plugin:

```bash
npm install ts-lit-plugin -D
```

Then add a `plugins` section to your [`tsconfig.json`](http://www.typescriptlang.org/docs/handbook/tsconfig-json.html):

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "ts-lit-plugin"
      }
    ]
  }
}
```

See [Configuring the plugin](#configuring-the-plugin) for more information regarding how to configure the plugin.


![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

## ➤ Features

### ✅ Attribute type checking

`lit-plugin` type checks all attributes assignment, both on your own elements, library elements and built in elements. You will also get the following warnings:

-   Warning if you assign a complex type without using the `.` modifier.
-   Warning if you use the `?` modifier on a non-boolean type.

### 🔍 Automatically pick up on lit-elements

If you define a `lit-element` custom element somewhere in your code `lit-plugin` will automatically pick up on it. Then it will provide auto-import functionality, type checking and code completion out of the box by looking at `@property` decorators on the element.

I'm working on supporting `static get properties()` and picking up "non-lit-element" custom elements by looking at `static get observedAttributes()`.

### 🌎 Support for dependencies that extend the global HTMLElementTagNameMap

<img src="https://user-images.githubusercontent.com/5372940/53271293-4fc5f300-36ee-11e9-9ed9-31f1e50f898c.gif" width="500" />

If a dependency extends the global `HTMLElementTagNameMap` this plugin will pick up on the map between the tag name and the class. Below you will see an example of what to add to your library typescript definition files if you want type checking support for a given html tag.

```typescript
declare global {
  interface HTMLElementTagNameMap {
    "my-element": MyElement;
  }
}
```

**Two limitations using this approach as of now**

-   By using this approach the plugin wont see detailed information about a given element as (e.g @property decorators and initializers) because it can only read public fields and their corresponding types. Therefore all properties on custom elements imported from libraries are optional and wont respect meta information in @property decorators.
-   `lit-plugin` will only be able two find your elements if you somewhere in the code imports the file. Before your import the file it will complain that the element is unknown not that it can be imported. This due to the constraint that Typescript only adds library files to the array of program files once the file has been imported.

I'm working on integrating support for the proposed [web-components.json](https://github.com/w3c/webcomponents/issues/776) file.

### 📣 Report missing imports of custom elements

When using custom elements `lit-plugin` checks if the element has been imported and is available in the current context. It's considered imported if any file in the path of imports defines the custom element. You can disable this check by setting `skipMissingImports` to true in the configuration (see [Configuring the plugin](#configuring-the-plugin)). Be aware that dependencies need to extend the global `HTMLElementTagNameMap` in order for this plugin to pick up on them.

### 🚶Goto definition for html tags and attributes

`Cmd+Click (Mac)` / `Ctrl+Click (Windows)` on a tag name or an attribute name and goto the definition.

### ✏️ Code completions for css and html

<img src="https://user-images.githubusercontent.com/5372940/53271979-4f2e5c00-36f0-11e9-98a6-f9b7996d841c.gif" width="500" />

Press `Ctrl+Space` in an html or css context and to get code completions for html tags and attributes.


### 📖 Quick info on hover for html tags and attributes

Hover above a html tag or attribute and see more information about the identifier such as type and jsdoc.

### ⚠️ Warning if required attributes are not included

<img src="https://user-images.githubusercontent.com/5372940/53272219-f612f800-36f0-11e9-98d2-2810f8b14c60.gif" width="500" />


`lit-plugin` will warn you if you forget to set any required attributes on a given html tag. Right now this is based on the assumption that the property is required if it doesn't have an initializer and isn't assignable to `undefined` or `null`. Be aware that right now the plugin doesn't check if you assign it else where (for example in the constructor).

**lit-plugin will think that the following is a required property**:

```typescript
@customElement("my-element")
export class MyElement extends LitElement {
  @property({ type: String }) text!: string;
}
```

### 🙈 Support for @ts-ignore comments inside html

Add "@ts-ignore" comments to make `lit-plugin` quiet.

**In front of html template tags:**
This will make `lit-plugin` opt out of any checking inside the html template tag, but not the nested html template tags.

```javascript
// @ts-ignore
html`this is not checked ${html`this is checked`} `;
```

**Inside HTML:**
This will make `lit-plugin` opt out of any checking inside the div tag.

```javascript
return html`
  <h1>Foo</h1>

  <!-- @ts-ignore -->
  <div>
      <my-element></my-element>
  </div>

  <h1>Bar</h1>
`;
```

### 💅 Reformat html

`lit-plugin` will reformat html when you reformat code using your IDE. Keep in mind that right now there is an issue where the plugin does not take the current indentation of the html template tag into account. This means that the especially nested html template tags will look weird.

**For example**:

```javascript
return html`<div>${html`<h1>Foo</h1> <h2>Bar</h2>`}</div>`;
```

**Will become**:

```javascript
return html`
<div>
  ${html`<h1>Foo</h1>
<h2>Bar</h2>`}
</div>`;
```

**And not:**:

```javascript
return html`
  <div>
    ${html`
      <h1>Foo</h1>
      <h2>Bar</h2>
    `}
  </div>`;
```

### 🚪 Auto close tags

When typing html inside a template tag `lit-plugin` auto-closes tags as you would expect.


![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

## ➤ Configuring the plugin

If you are using the vscode plugin you can configure these options directly from extension settings. If not you can add the options directly to the `compilerOptions.plugins` section of your `ts-config.json` file.

### disable
 
-   **Type**: boolean
-   **Default**: false
-   **Description**: Completely disable this plugin.
 
### htmlTemplateTags
 
-   **Type**: string[]
-   **Default**: ["html", "raw"]
-   **Description**: List of template tags to enable html support in.
 
### cssTemplateTags
 
-   **Type**: string[]
-   **Default**: ["css"]
-   **Description**: List of template tags to enable css support in.
 
### globalHtmlTags
 
-   **Type**: string[]
-   **Default**: []
-   **Description**: List of html tag names that you expect to be present at all times.
 
### globalHtmlAttributes
 
-   **Type**: string[]
-   **Default**: []
-   **Description**: List of html attributes names that you expect to be present at all times. These attributes are not checked at all.
 
### skipMissingImports
 
-   **Type**: boolean
-   **Default**: false
-   **Description**: Skip reporting missing imports of custom elements.
 
### skipUnknownHtmlTags
 
-   **Type**: boolean
-   **Default**: false
-   **Description**: Skip reporting unknown html tags.
 
### skipUnknownHtmlAttributes
 
-   **Type**: boolean
-   **Default**: false
-   **Description**: Skip reporting unknown html attributes.
 
### skipTypeChecking
 
-   **Type**: boolean
-   **Default**: false
-   **Description**: Skip type checking of attributes.
 
### format.disable
 
-   **Type**: boolean
-   **Default**: false
-   **Description**: Disable formatting the HTML on code reformat.

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

## ➤ Contributors
	
|[<img alt="Rune Mehlsen" src="https://avatars2.githubusercontent.com/u/5372940?s=460&v=4" width="100">](https://twitter.com/runemehlsen) | [<img alt="Andreas Mehlsen" src="https://avatars1.githubusercontent.com/u/6267397?s=460&v=4" width="100">](https://twitter.com/andreasmehlsen) | [<img alt="You?" src="https://joeschmoe.io/api/v1/random" width="100">](https://github.com/runem/ts-lit-plugin/blob/master/CONTRIBUTING.md)|
|:---: | :---: | :---:|
|[Rune Mehlsen](https://twitter.com/runemehlsen) | [Andreas Mehlsen](https://twitter.com/andreasmehlsen) | [You?](https://github.com/runem/ts-lit-plugin/blob/master/CONTRIBUTING.md)|

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

## ➤ License
	
Licensed under [MIT](https://opensource.org/licenses/MIT).
