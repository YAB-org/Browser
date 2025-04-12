const { process } = require('electron');
const { LuaFactory } = require("wasmoon");
const { JSDOM } = require("jsdom");

//process.parentPort.postMessage("Utility process ready");
//process.title = `ElectronSubProcess-${Date.now()}`;

(async () => {
    console.log("hi there")
  const lua = await new LuaFactory().createEngine();

  // fake DOM 
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <div class="hi">Initial Text</div>
    <a class="link" href="https://example.com">Example</a>
  </body></html>`);
  const document = dom.window.document;

  // intercept print for the devtools
  function print(...args) {
    console.log(args.join("\t"));
  }


  function legacy_get(selector, all) {
    // TODO: Support all
    let el = document.querySelector(selector) || document.querySelector('.'+selector);
    if (!el) {
      console.warn(`Element '${selector}' was not found.`);
      return null;
    }
    let tag = el.tagName.toLowerCase();
    return {
      key: el,
      // GETTING FUNCTIONS
      get_contents: () => el.value || el.checked || el.textContent,
      get_content: () => el.value || el.checked || el.textContent,
      get_href: () => el.getAttribute("href") || "",
      get_source: () => el.getAttribute("src") || "",
      get_opacity: () => el.style.opacity || "1",
      get_css_name: () => el.className || el.tagName,
      // SETTING FUNCTIONS
      set_contents: function(newValue) {
        if (['input','textarea'].includes(tag)) {
          el.value = newValue;
          return;
        }
        el.textContent = newValue;
      },
      set_content: function(newValue) {
        if (['input','textarea'].includes(tag)) {
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
        el.addEventListener('change', ()=>{
          callback(el.value || el.checked).catch(console.error);
        });
      }
      // TODO: add .on_submit
    };
  }

  async function legacy_fetch(params) {
    // TODO: add headers and body
    let req = await fetch(params.url, {
      method: params.method??'GET'
    });
    let body = await req.text();
    try {
      body = JSON.parse(body)
    } catch(err) {
      // Ignore :3
    }
    return body;
  }

  // Overwrite the Lua print
  lua.global.set("print", print);
  // TODO: add location and query
  lua.global.set('window', {
    browser: "bussinga", // pretend to be bussinga for compatibility
    true_browser: "yab"
})
  // Use the legacy API
  const api = "legacy";
  if (api === "legacy") {
    lua.global.set("get", legacy_get);
    lua.global.set("fetch", legacy_fetch);
  }

    let luaCode = `
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

  if (api === "legacy") {
    luaCode = luaCode.replaceAll(/fetch\(\s*?\{([^¬]|¬)*?\}\s*?\)/g, function(match){return match+':await()'});
  }

    await lua.doString(luaCode);
    lua.global.close();

})();
