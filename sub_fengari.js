// subprocess.js
const process = require('process');
const fengari = require("fengari");
const lua = fengari.lua;
const lauxlib = fengari.lauxlib;
const lualib = fengari.lualib;
const to_jsstring = fengari.to_jsstring;
const to_luastring = fengari.to_luastring;
const { JSDOM } = require("jsdom");

// Set process title
process.title = `ElectronSubProcess-${Date.now()}`;

// Handle messages from main process
process.on('begin', async (data) => {
    console.log(message);
});


// Setup fake DOM environment
const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="hi">e</div></body></html>`);
const document = dom.window.document;
// Create a new Lua state
const L = lauxlib.luaL_newstate();

// Open standard libraries
lualib.luaL_openlibs(L);

function print(...args) {
    console.log(args.map(String).join("\t"));
}

function legacy_get(id) {
    console.log(document.getElementById(id))
    return document.getElementById(id);
}

// Helper to expose a JS function to Lua
function exposeFunction(name, fn, argCount) {
    lua.lua_pushjsfunction(L, function(L) {
        const args = [];
        for (let i = 1; i <= argCount; i++) {
            if (lua.lua_isnumber(L, i)) {
                args.push(lua.lua_tonumber(L, i));
            } else if (lua.lua_isstring(L, i)) {
                args.push(to_jsstring(lua.lua_tolstring(L, i)));
            }
        }
        const result = fn(...args);
        if (typeof result === 'number') {
            lua.lua_pushnumber(L, result);
            return 1;
        } else if (typeof result === 'string') {
            lua.lua_pushstring(L, to_luastring(result));
            return 1;
        }
        return 0;
    });
    lua.lua_setglobal(L, to_luastring(name));
}

// Expose functions to Lua
const api = "legacy";
if (api == "legacy") {
    exposeFunction("get", legacy_get, 1);
}

// Special case for print (variadic)
lua.lua_pushjsfunction(L, function(L) {
    const n = lua.lua_gettop(L);
    const args = [];
    for (let i = 1; i <= n; i++) {
        args.push(to_jsstring(lua.lua_tolstring(L, i)));
    }
    print(...args);
    return 0;
});
lua.lua_setglobal(L, to_luastring("print"));


// Define Lua script that uses the exposed functions
const luaScript = `
    local my_item = get("my_item")
`;

// Execute the Lua script
if (lauxlib.luaL_dostring(L, to_luastring(luaScript)) !== lua.LUA_OK) {
    const errMsg = to_jsstring(lua.lua_tostring(L, -1));
    console.error("Lua error:", errMsg);
} else {
    console.log("success");
}
