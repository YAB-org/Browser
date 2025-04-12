const { lua, lauxlib, lualib, to_luastring } = require("fengari");
const interop = require("fengari-interop");
const { JSDOM } = require("jsdom");

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="hi">e</div></body></html>`);
const document = dom.window.document;

// make not editable
function deepFreeze(obj) {
  Object.getOwnPropertyNames(obj).forEach(function (prop) {
    const value = obj[prop];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });
  return Object.freeze(obj);
}

// browser obj
const browser = {
  name: "yab",
  agent: "e",
  version: "1.0",
  api: {
    get: true,
    fetch: true,
  }
};
deepFreeze(browser);

// Create a Lua state with Fengari and open std or whatever this shit is supposed to be
const L = lauxlib.luaL_newstate();
lualib.luaL_openlibs(L);

// load interop to make it like, interop
lauxlib.luaL_requiref(L, to_luastring("js"), interop.luaopen_js, 1);
lua.lua_pop(L, 1);

// PUSH!
interop.push(L, browser);
lua.lua_setglobal(L, to_luastring("browser"));

  // example stuff
function legacy_get(id) {
  const element = document.getElementById(id);
  if (!element) {
    return null;
  }
  return {
    get href() {
      return element.getAttribute("href") || "";
    },
    set href(value) {
      element.setAttribute("href", value);
    },
    get source() {
      return element.getAttribute("source") || "";
    },
    set source(value) {
      element.setAttribute("source", value);
    }
  };
}

// Expose the legacy_get 
interop.push(L, legacy_get);
lua.lua_setglobal(L, to_luastring("get"));

// Define the Lua script as a string. This script checks if the browser supports the 'get' API,
// prints messages, and then attempts to modify a frozen property.
const luaScript = `
  if browser.api.get then
    print("Browser supports 'get' API.")
  else
    print("Browser does not support 'get' API.")
  end
  print("hi")
  browser.api.get = false
`;

// Execute the Lua script
const status = lauxlib.luaL_dostring(L, to_luastring(luaScript));
if (status !== lua.LUA_OK) {
  const errMsg = lua.lua_tojsstring(L, -1);
  console.error("Error running Lua script:", errMsg);
  lua.lua_pop(L, 1); // this is required apparently
}