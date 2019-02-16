## Installation

### Visual Studio Code

If you use Visual Studio Code you can simply install the [lit-plugin](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin) extension.

```bash
code --install-extension runem.lit-plugin
```

#### Other

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
