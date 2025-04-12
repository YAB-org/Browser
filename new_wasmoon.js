const { LuaFactory } = require("wasmoon");
const { JSDOM } = require("jsdom");

(async () => {
  const lua = await new LuaFactory().createEngine();
  const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="hi">e</div></body></html>`);
  const document = dom.window.document;

  // bwowser
  function deepFreeze(obj) {
    Object.getOwnPropertyNames(obj).forEach(function (prop) {
      const value = obj[prop];
      if (value && typeof value === 'object' && !Object.isFrozen(value)) {
        deepFreeze(value);
      }
    });
    return Object.freeze(obj);
  }

  // Define the browser object
  const browser = {
    name: "yab",
    agent: ["sling", "bussinga"],
    version: "1.0",
    api: {
      get: true,
      fetch: true,
    }
  };

  // Deep freeze like a fish
  deepFreeze(browser);

  // Push the frozen fish, i mean browser
  lua.global.set("browser", browser);


  // example stuff
  function legacy_get(id) {
    const element = document.getElementById(id);
    if (!element) {
      return null;
    }
    return {
      // Getter for 'href' attribute
      get href() {
        return element.getAttribute('href') || '';
      },
      // Setter for 'href' attribute
      set href(value) {
        element.setAttribute('href', value);
      },
      // Getter for 'source' attribute
      get source() {
        return element.getAttribute('source') || '';
      },
      // Setter for 'source' attribute
      set source(value) {
        element.setAttribute('source', value);
      },
    };
  }


  lua.global.set('get', legacy_get);

  // Example Lua script
    await lua.doString(`

    if browser.api.get then
      print("Browser supports 'get' API.")
    else
      print("Browser does not support 'get' API.")
    end
    print("hi");
    browser.api.get = false
    if browser.api.get then
      print("Browser supports 'get' API.")
    else
      print("Browser does not support 'get' API.")
    end
  `);

  lua.global.close();
})();
