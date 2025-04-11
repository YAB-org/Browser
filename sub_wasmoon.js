const { LuaFactory } = require("wasmoon");
const { JSDOM } = require("jsdom");
const request = require("sync-request");
console.log("hi there 1")
(async () => {
    console.log("hi there")
  const lua = await new LuaFactory().createEngine();

  // fake DOM 
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <div id="hi">Initial Text</div>
    <a id="link" href="https://example.com">Example</a>
  </body></html>`);
  const document = dom.window.document;

  // intercept print for the devtools
  function print(...args) {
    console.log(args.join("\t"));
  }

  
  function legacy_get(selector, all) {
    // Try to use getElementById first (assuming selector is an id), im not sure how it works in webx
    // otherwise querySelector
    let el = document.getElementById(selector) || document.querySelector(selector);
    if (!el) {
      console.warn(`Element '${selector}' was not found.`);
      return null;
    }
    return {
      key: el,
      // GETTING FUNCTIONS
      get_contents: function() {
        return el.textContent || "";
      },
      get_href: function() {
        return el.getAttribute("href") || "";
      },
      get_opacity: function() {
        return el.style.opacity || "1";
      },
      // SETTING FUNCTIONS
      set_contents: function(newValue) {
        el.textContent = newValue;
      },
      set_href: function(newValue) {
        el.setAttribute("href", newValue);
      },
      set_opacity: function(newValue) {
        el.style.opacity = newValue;
      }
    };
  }

  function legacy_fetch(req) {
    const url = req.url;
    const method = req.method || "GET";
    const headers = req.headers || {};
    const body = req.body || null;
    try {
      // Perform a synchronous HTTP request.
      const res = request(method, url, {
        headers: headers,
        body: body
      });
      // Return the response body as a UTF8 string.
      return res.getBody("utf8");
    } catch (err) {
      console.error("Fetch error:", err);
      return "";
    }
  }

  // Overwrite the Lua print
  lua.global.set("print", print);
  // pretend to be bussinga for compatibility
  lua.global.set('window', {
    browser: "bussinga",
    true_browser: "yab"
})
  // Use the legacy API
  const api = "legacy";
  if (api === "legacy") {
    lua.global.set("get", legacy_get);
    lua.global.set("fetch", legacy_fetch);
  }

    const luaCode = `
    -- Get the element with id "hi"
    local item = get("hi")
    if item == nil then
      print("Element 'hi' not found!")
    else
      print("Original contents:", item.get_contents())
      -- Set new contents for the element.
      item.set_contents("Hello, Lua!")
      print("Updated contents:", item.get_contents())
    end

    -- Additional example with an anchor element:
    local link = get("link")
    if link == nil then
      print("Element 'link' not found!")
    else
      print("Original href:", link.get_href())
      link.set_href("buss://dingle.it")
      print("Updated href:", link.get_href())
    end
    local response = fetch({
      url = "https://dummyjson.com/test",
      method = "GET",
      headers = { ["Content-Type"] = "application/json" }
    })
    print("Fetched response:", response)
  `;

    await lua.doString(luaCode);
    lua.global.close();

})();
