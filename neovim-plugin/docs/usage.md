# Usage

The plugin exposes a single entry point:

```lua
local templater = require('chatgpt_search_templater')
local payload = templater.setup({
  spec_path = vim.fn.stdpath('config') .. '/chatgpt/spec.json', -- optional
})

print(vim.inspect(payload.placeholders))
print(vim.inspect(payload.default_templates))
```

`payload.spec` mirrors the JSON stored in `shared/spec.json` so Neovim scripts
can generate requests that stay in sync with the Chrome extension. Use
`payload.placeholders` to render placeholder tooltips or validations and
`payload.default_templates` to seed UI components inside Neovim.
