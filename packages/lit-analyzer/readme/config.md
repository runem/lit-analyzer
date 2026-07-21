## Configuration

You can configure the CLI with arguments:

<!-- prettier-ignore -->
```bash
lit-analyzer --strict --rules.no-unknown-tag-name off --format markdown
```

**Note:** You can also configure the CLI using a `tsconfig.json` file (see [ts-lit-plugin](https://github.com/runem/lit-analyzer/blob/master/packages/ts-lit-plugin)).

### Deno projects

On a Deno project the CLI falls back to `deno.json` (or `deno.jsonc`) when no `tsconfig.json` is present. Its `compilerOptions` are used directly, and rules live under a top-level `litAnalyzer` field:

<!-- prettier-ignore -->
```json
{
  "nodeModulesDir": "auto",
  "compilerOptions": { "lib": ["deno.window", "deno.ns", "dom", "es2022"] },
  "litAnalyzer": { "strict": true, "rules": { "no-unclosed-tag": "error" } }
}
```

Set `nodeModulesDir` to `"auto"` or `"manual"` and install dependencies (`deno install`). Otherwise npm packages live in Deno's global cache where TypeScript can't see them, and custom elements defined in packages read as unknown tags. Deno-only `lib` entries (`deno.*`) are dropped, since TypeScript doesn't know them.

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
