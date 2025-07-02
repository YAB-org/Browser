import * as CssP from './parsers/css.js'
import * as Helper from './helper/html.js'

import '../media/main/theme_ace_dark.js'

ace.config.setModuleUrl("ace/mode/htmlpp", 
    "../media/languages/htmlpp-mode.js"
  );

export class Browser {
    constructor() {
        this.ProcessManager = new ProcessManager();
        this.WebView = new WebView('web_display');
        this.NetworkManager = new NetworkManager(this.WebView);
        this.BrowserController = new BrowserController('tab_sortable', 9999, this.ProcessManager, this.WebView, this.terminateBrowserInstance_safe, this.NetworkManager);
        this.LayoutManager = new LayoutManager(this.BrowserController);
        

    }

    init() {
        try {
            this.ProcessManager.init();
            this.LayoutManager.init();
            this.BrowserController.init();
            //this.NetworkManager.init();
        } catch (error) {
            console.error("BrowserInstance failed to start up: " + error);
            throw new Error(error);
        }
    }

    terminateBrowserInstance_safe() {
        // here it would do all the stuff it needs to do like ending lua vm/subprocesses etc.
        closeApp.close();
    }

    killBrowserInstance() {
        // just kill the app
        closeApp.close();
    }
}


class LayoutManager {
    constructor(tab_manager) {
        this.tabman = tab_manager;
        this.address_bar = document.getElementById('toolbar_searchbar');
    }

    init() {

        // Initialize tab management functionality
        document.getElementById('tab_newtab_button').addEventListener('click', () => {
            this.tabman.spawnTab('New Tab', true);
        });
        


        const editor = ace.edit("editor");
        window.editor = editor;
        editor.setTheme("ace/theme/yab-dark")
        editor.session.setMode("ace/mode/htmlpp");
        editor.setOptions({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: false,
            behavioursEnabled: true,
            wrapBehavioursEnabled: true,
            showPrintMargin: false
        });


        // the following is only for html++, should be removed or disabled for other languages
        editor.commands.addCommand({
            name: "customEnter",
            bindKey: { win: "Enter", mac: "Enter" },
            exec: function(editor) {
                const session = editor.getSession();
                const pos = editor.getCursorPosition();
                const line = session.getLine(pos.row);
                const before = line.substring(0, pos.column);
                const after = line.substring(pos.column);
        
                // Check if the cursor is between opening and closing tags
                const tagMatch = before.match(/<(\w+)[^>]*>$/);
                const closingTagMatch = after.match(/^<\/(\w+)>/);
                if (tagMatch && closingTagMatch && tagMatch[1] === closingTagMatch[1]) {
                    // Determine the current indentation
                    const currentIndent = before.match(/^\s*/)[0];
                    const indent = session.getTabString();
        
                    // Insert newline with indentation
                    editor.insert(`\n${currentIndent}${indent}\n${currentIndent}`);
                    editor.navigateUp(1);
                    editor.navigateLineEnd();
                } else {
                    // Default behavior
                    editor.insert("\n");
                }
            },
            multiSelectAction: "forEach",
            scrollIntoView: "cursor",
            readOnly: false
        });
        

        const indicator = document.getElementById('dev_size_indicator');
        const rect = document.getElementById('web_display').getBoundingClientRect();
        indicator.style.display = "none";
        indicator.innerHTML = `${rect.width.toFixed(2)}px * ${rect.height.toFixed(2)}px`

        Split(['#web_display', '#dev_tools'], {

            onDragStart: () => {
                indicator.style.display = "block";
              },
            onDrag: () => {
                editor.resize();
                const rect = document.getElementById('web_display').getBoundingClientRect();
                indicator.innerHTML = `${rect.width.toFixed(2)}px * ${rect.height.toFixed(2)}px`
            },
            onDragEnd: () => {
                indicator.style.display = "none";
            },
            minSize: [150, 300],
            snapOffset: 0
        })

        editor.resize();

        tippy('#toolbar_icon_options', {
            content: CitronJS.getContent('windows_minimize_svg'),
            placement: 'bottom-end',
            arrow: false,
            trigger: 'click',
            interactive: true,
            allowHTML: true,
        });

    }
}

class ProcessManager {
    constructor(tabman) {
        // Track active processes
        this.processes = new Map();
        this.process_count = 0;
        this.controlled_term = [];
        this.tabman = tabman;

        console.log(this.tabman);
    }

    init() {

    }

    async spawnNewProcess() {
        const pid = await window.process.spawn();
        console.log("renderer received: ");
        console.log(pid);

        return pid;
    }

    terminateProcess(pid) {
        window.process.terminate(pid);
    }


    async resetProcess(pid) {
        await window.process.resetProcess(pid);
        return;
    }



}

class BrowserController {
    constructor(target_id, max, engineInstance, webView, terminateBrowser, NetworkManager) {
        this.ready = false;
        this.targetDiv = target_id;
        this.maxTabAmount = max;
        this.engine = engineInstance;
        this.tabs = {};
        this.initTabs = this.tabs;
        this.currentTab = 0;
        this.currentAmount = 0;
        this.browserTerminate = terminateBrowser;
        this.WebView = webView;
        this.address_bar = document.getElementById('toolbar_searchbar');
        this.NetworkManager = NetworkManager;

		this.input = document.getElementById('toolbar_searchbar');
        this.highlight = document.getElementById('searchbar_highlight');

        
    }

    init() {
        if (!document.getElementById(this.targetDiv)) {
            console.error('[BrowserController][FATAL]: Cannot initialize. Target Tab Container "' + this.targetDiv + '" does not exist.');
            throw new Error();
        } else {
            this.ready = true;

            if (!this.tabs == undefined) {

            } else {
                this.spawnTab('New Tab', true);
            }

            Sortable.create(document.getElementById(this.targetDiv), {
                swapThreshold: 0.90,
                animation: 150,
                preventOnFilter: true,
                preventOnCancel: false,
                easing: "cubic-bezier(0.65, 0, 0.35, 1)",
                onEnd: function() {
                    backend.getWindowData().then(data => {
                        let mouse = data.mouse;
                        let bounds = data.bounds; //document.getElementById('titlebar').getBoundingClientRect()

                        const isInsideWindow =
                            mouse.x >= bounds.x &&
                            mouse.x <= bounds.x + bounds.width &&
                            mouse.y >= bounds.y &&
                            mouse.y <= bounds.y + bounds.height;

                        console.log(`Is Inside Window: ${isInsideWindow}`);
                    })
                }
            });

            this.startEventEmitters();

			this.setupUrlHighlighting();
        	this.input.addEventListener('input', () => {
				this.tabs[this.currentTab].addressBar = this.address_bar.value;
            	this.address_highlight_update();
        	});
            this.input.addEventListener('keydown', (event) => {
                if (event.key === "Enter") {
                    console.log("enter key pressed")
                    this.input.blur();
                    this.TravelTo(this.currentTab, this.address_bar.value)
                }
            })

            return;
        }

    }

    startEventEmitters() {
        /*ipcRenderer.on('process-created', (event, pid, tab_id) => {
            this.processes.set(tab_id, pid);
            this.process_count++;
        });

        ipcRenderer.on('process-ended', (event, tab_id) => {
            // ended triggered by closing a tab or the browser
            const processPID = this.processes.get(tab_id);
        });

        ipcRenderer.on('process-terminated', (event, pid) => {
            // unexpected ended, aka triggered by task manager or other task killer
        });*/

        window.main.onMessage('process-unexpected-terminated', (data) => {
            console.log('Tab with pid: ' + data.pid + ' closed unexpectedly. Cleaning up.');
            this.terminateTab(data.pid);
        });
    }


    getTabID(pid) {

    }

    async spawnTab(title, focused = false, options) {
        if (this.ready !== true) {
            console.error('[BrowserController][ERROR]: BrowserController is not ready yet.');
        } else {

            if (this.currentAmount < this.maxTabAmount) {

                const pid = await this.engine.spawnNewProcess();
                this.WebView.spawnWebView(pid);
                this.WebView.focusWebView(pid);
				this.address_bar.value = "";
				this.address_highlight_update();

                this.tabs[pid] = {
                    addressBar: "",
                    currentURL: "",
                    isMasked: false,
                    hiddenProtocol: true,
                    mask: "",
                    title: "",
                    favicon: "",
                    timestamp: Date.now(),
                    navigationHistory: []
                };
                this.currentTab = pid;

                console.log(pid);
                const newTab = this.createTabSkeleton(title, pid, focused);
                console.log(newTab);
                if (focused === true) {
                    document.querySelectorAll('.tab:not(.tab_disabled)').forEach(tab => tab.classList.add('tab_disabled'));

                };
                document.getElementById(this.targetDiv).appendChild(newTab);

                let generatedTab = document.getElementById(pid);
                generatedTab.classList.add('tab_animation');
                generatedTab.addEventListener('animationend', () => {
                    generatedTab.style.width = "200px";
                    generatedTab.style.minWidth = "20px";
                    generatedTab.classList.remove('tab_animation');
                })
                generatedTab.querySelector('.tab_left').addEventListener('mousedown', () => {
                    this.setFocus(pid);
                    this.currentTab = pid;
                });
                generatedTab.querySelector('.tab_close_container').addEventListener('click', () => {
                    this.terminateTab(pid);
                });
                this.currentAmount++;
                this.TravelTo(this.currentTab, "yab://newtab", true, "")

            }

        }
    }

    terminateTab(pid) {
        if (this.ready !== true) {
            console.error('[BrowserController][ERROR]: BrowserController is not ready yet.');
        } else {
            // TODO: Handle closing a focused tab
            // Find and remove tab entry
            this.engine.terminateProcess(pid);
            this.WebView.deleteWebView(pid);
            const container = document.getElementById(this.targetDiv); // or document.getElementById('myDiv')
            const currentElem = document.getElementById(pid); // or however you determine it
            // Remove tab element
            const lastChild = container.lastElementChild;
            console.log(lastChild);
            let neighbour = null;

            if (currentElem === lastChild) {
                // If the current element is the last child, get its previous sibling (to the left)
                neighbour = currentElem.previousElementSibling;
            } else {
                // currentElem is not the last child of the DIV.
                if (currentElem !== lastChild && !this.tabs.hasOwnProperty(lastChild.id)) {
                    // If the container's last child is NOT in the list, get currentElem's previous sibling
                    neighbour = currentElem.previousElementSibling;
                } else {
                    // If the container's last child IS in the list, get currentElem's next sibling (to the right)
                    neighbour = currentElem.nextElementSibling;
                }
            }

            delete this.tabs[pid];

            this.currentAmount--;

            let tabtodel = document.getElementById(pid)


            tabtodel.classList.add('tab_animation_close');
            tabtodel.style.minWidth = "0px";
            tabtodel.addEventListener('animationend', () => {
                tabtodel.remove();
                console.log(Object.keys(this.tabs).length);
                console.log("it is " + Object.keys(this.tabs).length === 0);


                if (Object.keys(this.tabs).length > 0) {
                    console.log('hallo?');
                    if (this.currentTab === pid) {
                        this.setFocus(neighbour.id);
                        console.log(neighbour);
                    }
    
                }
                if (Object.keys(this.tabs).length === 0) {
                    this.browserTerminate();
                }
            })

        

        }
    }

    setFocus(pid) {
		//this.tabs[this.currentTab].addressBar = this.address_bar.value;
        this.currentTab = pid;
        this.WebView.focusWebView(pid);
        document.querySelectorAll('.tab:not(.tab_disabled)').forEach(tab => tab.classList.add('tab_disabled'));
        document.getElementById(pid).classList.remove('tab_disabled');
		this.address_bar.value = this.tabs[pid].addressBar;
		this.address_highlight_update();
        if (!this.tabs[pid].hiddenProtocol) {
            this.hideProtocol();
        }

    }

    cleanup() {
        // simply closes safely, and saves the tab tree if its valid.
    }

    createTabSkeleton(title, pid, focused) {
        if (focused) {
            return CitronJS.getContent('tab_focused', {
                title: title,
                id: pid
            });
        } else {
            return CitronJS.getContent('tab', {
                title: title,
                id: pid
            });
        }
    }

	address_highlight_update() {
        let final = this.input.value;
        final = final
            .replaceAll('<', '&lt;')
            .replace(/.+?:\/\//, '<span class="searchbar_proto">$&</span>')
            .replace(/(?<!:|:\/|<)(\/|\?).*?$/m, '<span class="searchbar_path">$&</span>')
            .replace(/:[0-9]+/, '<span class="searchbar_port">$&</span>');
        this.highlight.innerHTML = final;
    };
    setupUrlHighlighting() {
        this.input.addEventListener('focus', () => {
            this.input.select();
            let proto = document.querySelector('.searchbar_proto');
            if (proto) proto.style.display = '';
        });

        this.input.addEventListener('blur', () => {
            /*let proto = document.querySelector('.searchbar_proto');
            if (proto) proto.style.display = 'none';*/
        });

        this.input.addEventListener("scroll", () => {
            this.highlight.scrollTop = this.input.scrollTop;
            this.highlight.scrollLeft = this.input.scrollLeft;
        });
    }

    hideProtocol() {
        if (this.tabs[this.currentTab].hiddenProtocol == true) {
            let proto = document.querySelector('.searchbar_proto');
            if (proto) proto.style.display = 'none';
        }
        
    }

    async TravelTo(pid, target, masked = false, mask = "") {
        let favicon = document.getElementById(pid).querySelector(".tab_icon");
        favicon.innerHTML = "";
        favicon.appendChild(CitronJS.getContent('tab_spinner'));
        // buss://example.it
        const tab = this.tabs[pid];

        console.log("checking this")

        const res = await this.NetworkManager.getAddress(target, pid);
        if (res == "error-abort") {
            // its not a valid url, make it a search instead
        }

        if (this.NetworkManager.native.hasOwnProperty(this.NetworkManager.URLToObject(target).protocol)) {
            console.log("hi2")
            this.tabs[pid].hiddenProtocol = false;
        } else { this.tabs[pid].hiddenProtocol = true; console.log("its hidden") }
        
        
        if (masked) {
            tab.isMasked = true;
            tab.mask = mask;

            if (this.currentTab == pid) {
                this.address_bar.value = mask;
                this.tabs[pid].addressBar = mask;
                this.tabs[pid].currentURL = target;
                this.address_highlight_update();
                
            }
        } else {
            tab.isMasked = false;

            if (this.currentTab == pid) {
                this.address_bar.value = target;
                this.tabs[pid].addressBar = target;
                this.tabs[pid].currentURL = target;
                this.address_highlight_update();
            }
        }
        if (this.tabs[pid].addressBar == "") {
            this.address_bar.focus();
        }
        

    }
}

class WebView {
    constructor(id) {
        //this.views = [];
        this.targetDiv = document.getElementById(id);
        this.currentView;
    }

    spawnWebView(pid) {
        const webview = CitronJS.getContent('webview', {
            id: "_" + pid
        });
        this.targetDiv.appendChild(webview);
    }
    deleteWebView(pid) {
        this.targetDiv.querySelector("#_" + pid);
    }
    focusWebView(pid) {
        this.targetDiv
            .querySelectorAll('.web_view')
            .forEach(iframe => iframe.classList.add('web_view_hidden'));
        this.targetDiv.querySelector("#_" + pid).classList.remove('web_view_hidden');
    }

    async setHtml(pid, html) {
        const iframe = this.targetDiv.querySelector('#_' + pid);
        //target.appendChild(html);
        iframe.onload = () => {
            const doc = iframe.contentDocument || iframe.contentWindow.document;

            /*const target = iframe.contentDocument.querySelector('body');
            target.appendChild(html);*/
            if (typeof html !== 'string') {
                console.log(html)
                html = Helper.fragmentToString(html);
            }
            doc.open();
            doc.write(html); 
            doc.close();
          };
        iframe.contentDocument.location.reload();
    }

} 


class User {
    constructor() {}

    getSettings(setting=undefined) {
        if (undefined) {
            // get the entire json file
        } else {
            // get specific property

        }
    }

    setSettings() {
           
    }
}


class NetworkManager {
    constructor(webview) {
        this.webview = webview;
        this.native = {
            yab: {
                source: this.protYab
            },
            https: {

            },
            http: {

            },
            localhost: {

            }
        }

        this.third_party = {
            buss: {
                primary: true,
                type: "custom",
                server1: {
                    address: "https://dns-one.webxplus.org/v2/resolve/{domain}/{tld}",
                    timeout: 10000
                },
                server2: {
                    address: "https://dns-one.webxplus.org/v2/resolve/{domain}/{tld}",
                    timeout: 10000
                },
                headers: {
                    key: "value",
                    key: "value"
                }
            }
        }

        this.dev_tools = {
            tabid: {
                console: [
                    { type:"warning", message: "Hello World"}
                ],
                tree: {
                    content: "html"
                },
                network: [
                    { id: 0, name: "image.png", origin: "(self)", status: "--", size: "", time:"" }
                ],
                source: [
                    { thread: "Main Thread", content: [
                        { id: 0, status: "override/unavailable/notready/failed", content:"" }
                    ]}
                ],
                storage: {},
                process: {}
            },
        }

        this.cache_duration = 7200;

        this.cache = {
            buss: {
                "site.example": {
                    "/main.lua": "content"
                }
            }
        }

        this.overrides = {
            buss: {
                "site.example": {
                    "/main.lua": "content"
                }
            }
        }
    }

    protYab = async(pid, purl) => {
        console.log("hmm", purl)
        if (purl.domain === "newtab") {
            console.log(this)
            this.webview.setHtml(pid, CitronJS.getContent('native_newtab'))
            // here
        }
    }


    spawnDevToolWindow (pid) {}
    pushConsoleEntry (pid, type, message) {}
    clearConsoleEntries (pid) {}

    pushDevFetchRecord(pid, fetch) {}
    updateDevFetchRecord(pid, FetchId, fetch) {}

    setSourceRecord(pid, thread, content) {}
    updateSourceRecord(pid, thread, id) {}


    async getOriginServer(purl, server) {
        const controller = new AbortController();
        const timeout = this.third_party[purl.protocol][server].timeout;
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        console.log(purl)
        return fetch(this.third_party[purl.protocol][server].address.replace('{domain}', purl.domain.split('.').at(-2)).replace('{tld}', purl.domain.split('.').at(-1)), {
                signal: controller.signal,
                headers: this.third_party[purl.protocol].headers
            })
            .then(response => response.json())
            .then(data => {
                clearTimeout(timeoutId)

                let recordEntry = null;

                console.log("Debug #01", data)
                for (const record of data) {
                    if (record.type === "WEB" && record.name === purl.domain) {
                        recordEntry = record;
                        break;
                    }
                }
                if (recordEntry) {
                    console.log("Debig #02", recordEntry)
                    return recordEntry.value.replace(/\/$/, '');
                } else {
                    return { error: "error.dns" }
                }
            })
            .catch(err => {
                if (err.name === 'AbortError') {
                    clearTimeout(timeoutId)
                    return { error: "error.abort" }
                } else {
                    clearTimeout(timeoutId)
                    return { error: "error.unknown", data: err }
                }
            })
            .finally(() => clearTimeout(timeoutId));
    }

    async getAddress(url, pid) {
        const purl = this.URLToObject(url);
        if (!purl) {
            return { error: "error.noturl" }
        } else {
            if (this.native.hasOwnProperty(purl.protocol)) {
                this.native[purl.protocol].source(pid, purl);

            } else if (this.third_party.hasOwnProperty(purl.protocol)) { 
                let res;
                res = await this.getOriginServer(purl, "server1");
                console.log("debug #00 res1:", res)
                if (res.error) {
                    if (res.error == "error.abort") {
                        res = this.getOriginServer(purl, "server2");
                        if (res.error == "error.abort") {
                            return { error: "error.abort" }

                        } else if (res.error == "error.unknown") {
                            return { error: "error.unknown", data: res.data }

                        }
                    } else if (res.error == "error.unknown") {
                        return { error: "error.unknown", data: res.data }
                    } else {
                        return { error: "error.generic" }
                    }
                }

                try {
                    fetch(res + purl.path + purl.query)
                        .then(response => {
                            if (!response.ok) {
                                return { error: "response.notok" }
                            } else {
                                const mime = response.headers.get('content-type');
                                if (mime.includes('text/html')) {
                                    response.text().then(htmlString => {
                                        let obj = Helper.htmlpToObj(htmlString);
                                        // obj = Helper.fixScripts(obj)
                                        let scripts = Helper.getScripts(obj);
                                    
                                        console.log("scripts", scripts)

                                        this.webview.setHtml(pid, Helper.objToString(obj))

                                        scripts = scripts.map(({ src, api }) => {
                                        let href;
                                        try {
                                            // if src is already an absolute URL, this will succeed
                                            href = new URL(src).href;
                                        } catch (err) {
                                            // otherwise build it relative to your base
                                            const baseOrigin = new URL(res).origin;        // e.g. "https://example.com"
                                            const temp = new URL(src, baseOrigin + purl.path);
                                            // ensure we don't end up with duplicated slashes
                                            href = res.replace(/\/+$/, '') + '/' + temp.pathname.replace(/^\/+/, '');
                                        }
                                        return { href, api };
                                        });

                                        for (const { href, api } of scripts) {
                                        fetch(href)
                                            .then(response => {
                                            const contentType = response.headers.get('Content-Type') || '';
                                            if (contentType.includes("text/plain") || contentType.includes("text/lua") || contentType.includes("text/x-lua") || contentType.includes("application/lua") ||  contentType.includes("application/x-lua")) {
                                                return response.text();
                                            } else {
                                                return null;
                                            }
                                            })
                                            .then(code => {
                                            if (code !== null) {
                                                process.executeLua(pid, code, api);
                                            }
                                            });
                                        }

                                        console.log("Debug #04", scripts);

                                    })
                                }
                            }
                        })

                } catch (err) {

                }


            } else {

            }
        }
    }

    URLToObject(url) {
        try {
            let uri = new URL(url);
            console.log(uri);
            return {
                protocol: uri.protocol.split(':')[0],
                domain: uri.hostname,
                port: uri.port,
                path: uri.pathname,
                query: uri.search
            }
        } catch (error) {
            return false;
        }
    }

    get(protocol, domain, tld, path) {

        // prot://sub.main.tld/hi/bye?q=valuea%20valueb&other=2&sort=relevance#fragment
        let example = {
            protocol: "prot",
            domain: "sub.main",
            tld: "tld",
            path: {
                "segments": ["hi", "bye"],
                "query": {
                    "q": "valuea valueb",
                    "other": "2",
                    "sort": "relevance"
                },
                "fragment": "fragment"
            }
        }
    }

}