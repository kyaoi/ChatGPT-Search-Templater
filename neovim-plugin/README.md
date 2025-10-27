# chatgpt-search-templater.nvim

Neovim plugin companion for the Chrome extension. It loads the shared template
schema from `../shared/spec.json` and exposes helpers for reading placeholders
and default templates inside Neovim automation.

## Features

- Consume the shared ChatGPT template specification.
- Provide a `setup()` entry point that exposes templates/placeholders.
- Lightweight smoke test runnable from the command line (`make check`).

## Installation

Add the repository to your Neovim plugin manager. Example using
[`lazy.nvim`](https://github.com/folke/lazy.nvim):

```lua
{
  'your-user/chatgpt-search-templater',
  dir = vim.fn.stdpath('config') .. '/plugins/chatgpt-search-templater',
  config = function()
    require('chatgpt_search_templater').setup()
  end,
}
```

The plugin reads `shared/spec.json` relative to the repository root. When the
spec lives elsewhere (for example in a packaged release), pass an explicit path:

```lua
require('chatgpt_search_templater').setup({
  spec_path = '/path/to/spec.json',
})
```

## Development

Inside `neovim-plugin/` run:

```bash
make check
```

The smoke test requires Neovim (`nvim`) with `vim.json` support (Neovim 0.8+).
