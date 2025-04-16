const { LuaFactory } = require("wasmoon");
const { JSDOM } = require("jsdom");

// Create a shared DOM that all Lua engines will reference.
const dom = new JSDOM(`<!DOCTYPE html>
<html>
  <body>
    <div class="hi">Initial Text</div>
    <a class="link" href="https://example.com">Example</a>
  </body>
</html>`);
const document = dom.window.document;


// Allows read-only objects
function deepFreeze(obj) {
  Object.getOwnPropertyNames(obj).forEach(function (prop) {
    const value = obj[prop];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });
  return Object.freeze(obj);
}

// Legacy API functions
function legacy_get(selector, all) {
  // Try querySelector with the given selector; if not, try class lookup.
  let el = document.querySelector(selector) || document.querySelector('.' + selector);
  if (!el) {
    console.warn(`Element '${selector}' was not found.`);
    return null;
  }
  let tag = el.tagName.toLowerCase();
  return {
    key: el,
    // GETTER FUNCTIONS
    get_contents: () => el.value || el.checked || el.textContent,
    get_content: () => el.value || el.checked || el.textContent,
    get_href: () => el.getAttribute("href") || "",
    get_source: () => el.getAttribute("src") || "",
    get_opacity: () => el.style.opacity || "1",
    get_css_name: () => el.className || el.tagName,
    // SETTER FUNCTIONS
    set_contents: function(newValue) {
      if (['input', 'textarea'].includes(tag)) {
        el.value = newValue;
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

  /**
   * Runs Lua code using a newly-created Lua engine with the provided API.
   * @param {string} code - The Lua code to execute.
   * @param {string} api - The type of API to inject ("legacy", "v2", etc.).
   */
  async runLua(code, api) {
    const lua = await new LuaFactory().createEngine();
    this.luaInstances.push(lua);

    // Set common globals. printE is global because the error handler needs it. there isnt a better way.
    lua.global.set("printe", printError);
    lua.global.set("print", print);

    // LEGACY API
    if (api === "legacy") {
      lua.global.set("get", legacy_get);
      lua.global.set("fetch", legacy_fetch)
      lua.global.set("window", deepFreeze({ browser: "bussinga", true_browser: "yab" }));
      code = code.replaceAll(/fetch\(\s*?\{([^¬]|¬)*?\}\s*?\)/g, (match) => `${match}:await()`);
    } else if (api === "v2") {
      // NEW API STUFF
      lua.global.set("printw", printWarn);

    }

    // Count lines
    const countLines = (str) => (str === '' ? 0 : str.split('\n').length);
    const userCodeLineCount = countLines(code);

    // Lua error-handling wrapper
    const wrappedCode = `local function runScript()
    ${code}
end

local function extract_line_number(traceback)
  for line in traceback:gmatch("[^\\r\\n]+") do
    local lineno = line:match('%[string ".-"%]:(%d+):')
    if lineno then
      return tonumber(lineno)
    end
  end
  return nil
end

local function errorHandler(err)
  local info = debug.getinfo(2, "Sl") or { source = "?", currentline = 0 }
  local tb = debug.traceback("", 2)
  local filtered = {}
  for line in tb:gmatch("[^\\r\\n]+") do
    if not line:find("^%s*%[C%]") then
      table.insert(filtered, line)
    end
  end
  local filteredTraceback = table.concat(filtered, " | ")
  return string.format("%s - %s", extract_line_number(filteredTraceback) - 1 or "?", tostring(err))
end

local ok, errMsg = xpcall(runScript, errorHandler)
if not ok then
  printe("Error at line " .. errMsg)
end
`;

    try {
      await lua.doString(wrappedCode);
    } catch (error) {
      // Sometimes errors can be catched within LUA especially naming errors, meanwhile syntax errors are catched outside (most, not all)
      const regex = /:(\d+):\s*(.*)/;
      const match = regex.exec(error);
      if (match) {
        const errorLine = parseInt(match[1], 10);
        // im trying to get the proper line here since the users code starts on line 1. we have to deduct 1 to get the real errorline
        if (errorLine < 1 || errorLine > (userCodeLineCount + 1)) {
          printError('Error outside of user scope, is something intervening? - ' + error);
        } else {
          printError('Error at line ' + errorLine - 1 + ' - ' + match[2]);
        }
      } else {
        // theres like so many types of errors, this is basically for anything else
        printError('Error - ' + error);
      }
    }
  }

  // closes all if that hasnt already happened. it might throw insignificant errors if its already closed
  async endAll() {
    for (const lua of this.luaInstances) {
      try {
        await lua.global.close();
      } catch (err) {
        // ignore
      }
    }
    // Reset the list.
    this.luaInstances = [];
  }
}


(async () => {
  const runner = new LuaRunner();

  const legacyCode = `
  local item = get("hi")
    if item == nil then
      print("Element 'hi' not found!")
    else
      print("Original contents:", item.get_contents())
      item.set_contents("Hello, Lua!")
      print("Updated contents:", item.get_contents())
    end

    local link = get("link")
    if link == nil then
      print("Element 'link' not found!")
    else
      print("Original href:", link.get_href())
      link.set_href("buss://dingle.it")
      print("Updated href:", link.get_href())
    end

    local response = fech({
      url = "https://dummyjson.com/test",
      method = "GET",
      headers = { ["Content-Type"] = "application/json" }
    })
    print("Fetched response:", response)
  `;

  // Run Lua code
  await runner.runLua(legacyCode, "legacy");

  // await runner.runLua(otherCode, "otherAPI");
})();