## Configuration

You can configure this plugin through your `tsconfig.json`. 

### Example

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "ts-lit-plugin",
        "strict": true,
        "rules": {
          "no-unknown-tag-name": "off",
          "no-unknown-event": "warn"
        }
      }
    ]
  }
}
```

### Available options

{{ load:./../../docs/readme/config-table.md }}