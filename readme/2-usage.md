## Usage

`lit-analyzer` analyses an optional `input glob` and emits the output to the console as default. When the `input glob` is omitted it will find all components in `src`.

<!-- prettier-ignore -->
```bash
$ lit-analyzer src
$ lit-analyzer "src/**/*.{js,ts}"
$ lit-analyzer my-element.js
$ lit-analyzer --outFile result.txt
```