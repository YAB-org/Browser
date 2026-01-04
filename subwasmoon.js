const { LuaFactory } = require('wasmoon-async-fix');
const { JSDOM } = require("jsdom");

let dom;
let document;

function deepFreeze(obj) {
  Object.getOwnPropertyNames(obj).forEach(function(prop) {
    const value = obj[prop];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });
  return Object.freeze(obj);
}


function legacy_get(selector, all) {
  let el = document.querySelector(selector) || document.querySelector('.' + selector);
  if (!el) {
    console.warn(`Element '${selector}' was not found.`);
    return null;
  }
  let tag = el.tagName.toLowerCase();
  return {
    key: el,
    get_contents: () => el.value || el.checked || el.textContent,
    get_content: () => el.value || el.checked || el.textContent,
    get_href: () => el.getAttribute("href") || "",
    get_source: () => el.getAttribute("src") || "",
    get_opacity: () => el.style.opacity || "1",
    get_css_name: () => el.className || el.tagName,
    set_contents: function(newValue) {
      if (['input', 'textarea'].includes(tag)) {
        el.value = newValue;
        process.parentPort.postMessage({ type: "editRequest/legacy/set_contents" })
        return;
      }
      el.textContent = newValue;
    },
    set_content: function(newValue) {
      if (['input', 'textarea'].includes(tag)) {
        el.value = newValue;
        return;
      }
      el.textContent = newValue;
    },
    set_href: function(newValue) {
      el.setAttribute("href", newValue);
    },
    set_source: function(newValue) {
      el.setAttribute("src", newValue);
    },
    set_opacity: function(newValue) {
      el.style.opacity = newValue;
    },
    set_value: function(newValue) {
      el.value = newValue;
    },
    // EVENTS
    on_click: (callback) => {
      el.addEventListener('click', () => {
        callback().catch(console.error);
      });
      console.log("CLICKIIIING!")
      el.click();
    },
    on_input: (callback) => {
      el.addEventListener('keyup', () => {
        callback(el.value || el.checked).catch(console.error);
      });
      el.addEventListener('change', () => {
        callback(el.value || el.checked).catch(console.error);
      });
    }
  };
}

async function legacy_fetch(params) {
  // Basic fetch implementation—headers and body modifications can be added as needed.
  let req = await fetch(params.url, {
    method: params.method ?? 'GET'
  });
  let body = await req.text();
  try {
    body = JSON.parse(body);
  } catch (err) {
    // If not JSON, return the text
  }
  return body;
}


function printError(...args) {
  console.log(args.join("\t"));
  // send to devtools
}

function printWarn(...args) {
  console.log(args.join("\t"));
  // send to devtools
}

function print(...args) {
  console.log(args.join("\t"));
  // send to devtools
}


class LuaRunner {
  constructor() {
    this.luaInstances = [];
    this.document = document;
  }

  async runLua(code, api, pid) {
    const lua = await new LuaFactory().createEngine();
    this.luaInstances.push(lua);

    lua.global.set("printe", printError);
    lua.global.set("print", print);

    if (api === "legacy") {
      lua.global.set("get", legacy_get);
      lua.global.set("fetch", legacy_fetch);
      lua.global.set("window", deepFreeze({
        browser: "bussinga",
        true_browser: "yab"
      }));
    } else if (api === "v2") {
      lua.global.set("printw", printWarn);
    }

    const wrappedCode = `local function runScript() ${code} end

local function errorHandler(err)
  -- The error message usually contains line info like: "stdin:3: attempt to call a nil value"
  -- We'll extract "stdin:3" part (or chunk name + line number)
  local lineInfo = string.match(err, ":(%d+):")
  local lineNum = tonumber(lineInfo) or -1
  return "Error at line " .. lineNum .. ": " .. err
end

local success, result = xpcall(runScript, errorHandler)
if not success then
  printe(result)
end
`;

    try {
      await lua.doString(wrappedCode);
    } catch (error) {
      console.log("UHM ERROR", error);
    }
  }

  async endAll() {
    for (const lua of this.luaInstances) {
      try {
        await lua.global.close();
      } catch (err) {
        // ignore :3
      }
    }
    this.luaInstances = [];
  }
}


const runner = new LuaRunner();


//process.parentPort.postMessage("Message from utility to main")

process.parentPort.on('message', (e) => {
  process.parentPort.postMessage("got" + e.data);

  if (e.data.type == "code") {
    runner.runLua(e.data.code, e.data.api);
  } else if (e.data.type == "html") {
    console.log(e.data.html);
    dom = new JSDOM(e.data.html);
    document = dom.window.document;
  }
});

console.log("usage", process.memoryUsage());