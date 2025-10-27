local M = {}

local cached_spec
local override_path

local function parent_dir(path, levels)
  local result = path
  for _ = 1, levels do
    result = vim.fn.fnamemodify(result, ':h')
  end
  return result
end

local function detect_repo_root()
  local source = debug.getinfo(1, 'S').source
  if source:sub(1, 1) == '@' then
    source = source:sub(2)
  end

  local module_dir = vim.fn.fnamemodify(source, ':p:h')
  local repo_root = parent_dir(module_dir, 3)
  return repo_root
end

local function read_file(path)
  local fd, open_err = io.open(path, 'r')
  if not fd then
    return nil, open_err or ('failed to open ' .. path)
  end
  local ok, content = pcall(fd.read, fd, '*a')
  fd:close()
  if not ok then
    return nil, content
  end
  return content, nil
end

local function resolve_spec_path()
  if override_path then
    return override_path
  end

  local repo_root = detect_repo_root()
  local sep = package.config:sub(1, 1)
  return table.concat({ repo_root, 'shared', 'spec.json' }, sep)
end

---@param path string|nil
function M.set_spec_path(path)
  override_path = path
  cached_spec = nil
end

---@return table
function M.load()
  if cached_spec then
    return cached_spec
  end

  local spec_path = resolve_spec_path()
  local content, err = read_file(spec_path)
  if not content then
    error(('chatgpt-search-templater: failed to read spec file %s: %s'):format(spec_path, err))
  end

  local ok, decoded = pcall(vim.json.decode, content)
  if not ok then
    error(('chatgpt-search-templater: invalid JSON in %s: %s'):format(spec_path, decoded))
  end

  cached_spec = decoded
  return cached_spec
end

---@return table
function M.default_templates()
  local spec = M.load()
  return vim.deepcopy(spec.defaultTemplates or {})
end

---@return table
function M.placeholders()
  local spec = M.load()
  return vim.deepcopy(spec.placeholders or {})
end

---@return table
function M.model_options()
  local spec = M.load()
  return vim.deepcopy(spec.templateModelOptions or {})
end

return M
