# Contributing

Hi there, I really appreciate you considering contributing to this repository! This readme hopefully contains what you need to get started. If you have any questions please open an issue or PM me on twitter [@RuneMehlsen](https://twitter.com/RuneMehlsen).

1. Clone the monorepo: `git clone https://github.com/runem/lit-analyzer.git`
2. Install dependencies: `npm install`
3. Bootstrap packages: `npm run bootstrap`
4. Build libraries: `npm run watch`
5. Run tests: `npm run test`

## Contributing to readmes

Readme's are built because a lot of information is repeated in individual readmes. If you want to change something in a readme, please change files in [/docs/readme](/docs/readme), [/packages/lit-analyzer/readme](/packages/lit-analyzer/readme), [/packages/ts-lit-plugin/readme](/packages/ts-lit-plugin/readme), [/packages/vscode-lit-plugin/readme](/packages/vscode-lit-plugin/readme). Never change the README.md directly because it will be overwritten.

Please run `npm run readme` when you want to rebuild all readme files.

## Contributing to lit-analyzer or ts-lit-plugin

### Debugging the CLI

You can always try out the CLI by running `./cli.js path-to-a-file.js` from `packages/lit-analyzer`.

### Debugging the language service

You can try out changes to lit-analyzer and/or ts-lit-plugin directly from the Typescript Language Service in VS Code:

1. Run `npm run dev` from `/` to open a playground in VS Code (lit-plugin is disabled in that session to prevent interference).
2. Run `npm run dev:logs` from `/` to watch logs in real time.

### `npm run watch` / `npm run build`

You can run either `npm run watch` or `npm run build` from the repository root or from any subpackage.

## Contributing to vscode-lit-plugin

### Debugging

In order to debug `vscode-lit-plugin` you can open vscode from `packages/vscode-lit-plugin` and press the **start debugging** button in vscode.

### `npm run package`

You can use this script if you want to generate an installable package of vscode-lit-plugin. You can install the bundled package from vscode.

### `npm run install:safe`

Some dependencies are installed directly from Github URLs (see [syntaxes](#syntaxes)). In order to prevent `postinstall` scripts to run when installing these dependencies (which will crash), they are installed with `--ignore-scripts`. `npm run bootstrap` will make sure to execute `install:safe` when running.

### `npm run copylink` (main package.json)

VS Code doesn't support debugging symlinked dependencies. Therefore there are no symlinked dependencies in `packages/vscode-lit-plugin`. This means that local changes to `lit-analyzer` are not automatically reflected when debugging `vscode-lit-plugin`.

Therefore you will have to run `npm run copylink` (from the main package.json) in order to test local changes. This script copies local js files directly from `lit-analyzer` into `packages/vscode-lit-plugin/node_modules/lit-analyzer`.

### Syntaxes

All syntaxes come from [vscode-lit-html](https://github.com/mjbvz/vscode-lit-html) and [vscode-styled-components](https://github.com/styled-components/vscode-styled-components). Because these repositories are not published as npm-packages, they are instead installed from Github URLs. Therefore, as of now, changes to syntaxes must be upstreamed to one of these repositories.
