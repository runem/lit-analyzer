## Installation

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

Finally, restart you Typescript Language Service, and you should start getting diagnostics from `ts-lit-plugin`.

**Note:**
* If you use Visual Studio Code you can also install the [lit-plugin](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin) extension. 
* If you would rather use a CLI, you can install the [lit-analyzer](https://github.com/runem/lit-analyzer/blob/master/packages/lit-analyzer).