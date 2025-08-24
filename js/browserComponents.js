import * as CssP from './parsers/css.js'
import * as Helper from './helper/html.js'

import '../media/main/theme_ace_dark.js'

ace.config.setModuleUrl("ace/mode/htmlpp", 
    "../media/languages/htmlpp-mode.js"
  );

export class Browser {
    constructor() {
        this.ProcessManager = new ProcessManager();
        this.BrowserController = new BrowserController(9999, this.ProcessManager);
        

    }
}


class ProcessManager {
    constructor() {}

    async spawnProcess() {
        const pid = await window.process.spawn();
        return pid;
    }

    terminateProcess(pid) {
        window.process.terminate(pid);
    }


    async resetProcess(pid) {
        await window.process.resetProcess(pid);
        return;
    }

    async getProcessMemoryUsageMB(pid) {
        const u = await window.process.getMemoryUsageMB(pid);
        return u.toFixed(1);
    }
}


class BrowserController {
    constructor(max, ProcessManager) {
        this.ProcessManager = ProcessManager;

        this.TabList = {};
        this.MaximumTabCount = max;
        this.currentTab = 0;
        this.CurrentTabCount = 0;
        this.terminate = closeApp.close;

        this.LayoutTabContainerID = 'tab_sortable';
        this.LayoutWebViewContainerID = "web_display";
        this.LayoutInputAddressBar = document.getElementById('toolbar_searchbar');
        this.LayoutHighlight = document.getElementById('searchbar_highlight');

        this.NetworkCacheDuration = 7200;
        this.NetworkLocalProtocols = {
            yab: {
                source: this.NetworkNativeYabProtocol
            },
            https: {},
            http: {},
            localhost: {}
        }
        this.NetworkThirdPartyProtocols = {
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
        this.NetworkWebCache = {
            buss: {
                "site.example": {
                    "/main.lua": "content"
                }
            }
        }
        this.NetworkWebOverrides = {
            buss: {
                "site.example": {
                    "/main.lua": "content"
                }
            }
        }
        this.LayoutDevtools = {
            tabid: {
                console: [
                    { type:"warning", message: "Hello World"}
                ],
                tree: "html",
                network: [
                    { id: 0, name: "image.png", origin: "(self)", status: "--", size: "", time:"" }
                ],
                source: [
                    { thread: "Main Thread", content: [
                        { id: 0, status: "override/unavailable/notready/failed", content:"" }
                    ]
                    }
                ],
                storage: {},
                process: {}
            },
        }


        // =========================
        // MAIN -> RENDERER WINDOW LISTENERS
        // =========================

        window.main.onMessage('process-unexpected-terminated', (data) => {
            console.log('Tab with pid: ' + data.pid + ' closed unexpectedly. Cleaning up.');
            this.terminateTab(data.pid);
        });

        /*
        ipcRenderer.on('process-ended', (event, tab_id) => {
            // ended triggered by closing a tab or the browser
            const processPID = this.ProcessManager.get(tab_id);
        });

        ipcRenderer.on('process-terminated', (event, pid) => {
            // unexpected ended, aka triggered by task manager or other task killer
        });*/
        
        
        // =========================
        //  BROWSER LAYOUT
        // =========================

        // Set Up Tabbar
        if (document.getElementById(this.LayoutTabContainerID)) {

            this.spawnTab('New Tab', true);
            Sortable.create(document.getElementById(this.LayoutTabContainerID), {
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
                    })
                }
            });
            
        // Create tabs via '+' button
        document.getElementById('tab_newtab_button').addEventListener('click', () => {
            this.spawnTab('New Tab', true);
        });

            // TOOLBAR

            const back = document.getElementById('toolbar_icon_historyback')
            const forward = document.getElementById('toolbar_icon_historyforward')
            const reload = document.getElementById('searchbar_icon_reload')

            reload.addEventListener('click', () => {
                if (this.TabList[this.currentTab].isMasked) {
                    this.TravelTo(this.currentTab, this.TabList[this.currentTab].currentURL, false, true, this.TabList[this.currentTab].mask)
                } else {
                    this.TravelTo(this.currentTab, this.TabList[this.currentTab].currentURL, false)
                }
            })
            back.addEventListener('click', () => {
                if (back.classList.contains('toolbar_icon_enabled')) {
                    // safeguard escaping index
                    if (this.TabList[this.currentTab].historyIndex > 0) {
                        this.TabList[this.currentTab].historyIndex -= 1;

                        if (this.TabList[this.currentTab].navigationHistory[this.TabList[this.currentTab].historyIndex].isMasked) {
                            this.TravelTo(this.currentTab, this.TabList[this.currentTab].navigationHistory[this.TabList[this.currentTab].historyIndex].url, false, true, this.TabList[this.currentTab].navigationHistory.mask)
                        } else {
                            this.TravelTo(this.currentTab, this.TabList[this.currentTab].navigationHistory[this.TabList[this.currentTab].historyIndex].url, false)
                        }
                    } else {
                        console.log("CORRUPTION DETECTED")
                    }
                    
                }
            })
            forward.addEventListener('click', () => {
                if (forward.classList.contains('toolbar_icon_enabled')) {
                    // safeguard escaping index
                    if (this.TabList[this.currentTab].historyIndex < this.TabList[this.currentTab].navigationHistory.length -1) {
                        this.TabList[this.currentTab].historyIndex += 1;

                        if (this.TabList[this.currentTab].navigationHistory[this.TabList[this.currentTab].historyIndex].isMasked) {
                            this.TravelTo(this.currentTab, this.TabList[this.currentTab].navigationHistory[this.TabList[this.currentTab].historyIndex].url, false, true, this.TabList[this.currentTab].navigationHistory.mask)
                        } else {
                            this.TravelTo(this.currentTab, this.TabList[this.currentTab].navigationHistory[this.TabList[this.currentTab].historyIndex].url, false)
                        }
                    } else {
                        // corrupt
                    }
                    
                }
            })

            // Toolbar Options Menu
            tippy('#toolbar_icon_options', {
                content: CitronJS.getContent('toolbar_menu'),
                theme: "toolbar_menu",
                html: true,
                placement: 'bottom-end',
                arrow: false,
                trigger: 'click',
                interactive: true,
                allowHTML: true,
            });

            // SEARCHBAR INPUT HIGHLIGHTING
            // Makes sure different parts of a url have different colors to allow for better readability

			this.LayoutInputSetupHighlighting();
        	this.LayoutInputAddressBar.addEventListener('input', () => {
				this.TabList[this.currentTab].addressBar = this.LayoutInputAddressBar.value;
            	this.LayoutInputHighlightUpdate();
        	});
            this.LayoutInputAddressBar.addEventListener('keydown', (event) => {
                if (event.key === "Enter") {
                    this.LayoutInputAddressBar.blur();
                    if (this.TabList[this.currentTab].navigationHistory.length -1 > this.TabList[this.currentTab].historyIndex) {
                        let index = this.TabList[this.currentTab].historyIndex;
                        if (index !== -1) {
                            this.TabList[this.currentTab].navigationHistory = this.TabList[this.currentTab].navigationHistory.slice(0, index + 1);
                        }
                    }
                    this.TravelTo(this.currentTab, this.LayoutInputAddressBar.value)
                }
            })


            // DEVTOOLS

            const indicator = document.getElementById('dev_size_indicator');
            const rect = document.getElementById('web_display').getBoundingClientRect();
            indicator.style.display = "none";
            indicator.innerHTML = `${rect.width.toFixed(2)}px * ${rect.height.toFixed(2)}px`

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
                showPrintMargin: false,
                readOnly: true
            });

            editor.commands.addCommand({
                name: "customEnter",
                bindKey: { win: "Enter", mac: "Enter" },
                exec: function(editor) {
                    const session = editor.getSession();
                    const pos = editor.getCursorPosition();
                    const line = session.getLine(pos.row);
                    const before = line.substring(0, pos.column);
                    const after = line.substring(pos.column);
            
                    const tagMatch = before.match(/<(\w+)[^>]*>$/);
                    const closingTagMatch = after.match(/^<\/(\w+)>/);
                    if (tagMatch && closingTagMatch && tagMatch[1] === closingTagMatch[1]) {
                        const currentIndent = before.match(/^\s*/)[0];
                        const indent = session.getTabString();
            
                        editor.insert(`\n${currentIndent}${indent}\n${currentIndent}`);
                        editor.navigateUp(1);
                        editor.navigateLineEnd();
                    } else {
                        editor.insert("\n");
                    }
                },
                multiSelectAction: "forEach",
                scrollIntoView: "cursor",
                readOnly: false
            });

            // Split Dev Tools from Webview and make them resizable with SplitJS
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
                snapOffset: 0,
                cursor: 'w-resize'
            })
            editor.resize();

            // Split the Network fields with SplitJS
            Split(['#dev_network_name', '#dev_network_origin','#dev_network_type','#dev_network_status','#dev_network_size','#dev_network_time'], {
                minSize: 20,
                snapOffset: 0,
                gutter: (index, direction) => {
                    const gutter = document.createElement('div')
                    gutter.className = `dev-network-gutter gutter-${direction}`
                    return gutter
                },
                gutterSize: 3,
            })

        } else {
            // ERROR
        }

    }

    // SEARCHBAR INPUT HIGHLIGHTING

	LayoutInputHighlightUpdate() {
        let final = this.LayoutInputAddressBar.value;
        final = final
            .replaceAll('<', '&lt;')
            .replace(/.+?:\/\//, '<span class="searchbar_proto">$&</span>')
            .replace(/(?<!:|:\/|<)(\/|\?).*?$/m, '<span class="searchbar_path">$&</span>')
            .replace(/:[0-9]+/, '<span class="searchbar_port">$&</span>');
        this.LayoutHighlight.innerHTML = final;
    };
    LayoutInputSetupHighlighting() {
        this.LayoutInputAddressBar.addEventListener('focus', () => {
            this.LayoutInputAddressBar.select();
            let proto = document.querySelector('.searchbar_proto');
            if (proto) proto.style.display = '';
        });

        this.LayoutInputAddressBar.addEventListener('blur', () => {
            /*let proto = document.querySelector('.searchbar_proto');
            if (proto) proto.style.display = 'none';*/
        });

        this.LayoutInputAddressBar.addEventListener("scroll", () => {
            this.LayoutHighlight.scrollTop = this.LayoutInputAddressBar.scrollTop;
            this.LayoutHighlight.scrollLeft = this.LayoutInputAddressBar.scrollLeft;
        });
    }

    LayoutInputHideProtocol() {
        if (this.TabList[this.currentTab].hiddenProtocol == true) {
            let proto = document.querySelector('.searchbar_proto');
            if (proto) proto.style.display = 'none';
        }
        
    }

    // =========================
    //  TAB MANAGEMENT AND CORE FUNCTIONALITY
    // =========================

    // Create a new Tab and Process
    async spawnTab(title, focused = false) {
            if (this.CurrentTabCount < this.MaximumTabCount) {

                const pid = await this.ProcessManager.spawnProcess();
                this.WebviewSpawnFrame(pid);
                this.WebviewFocusFrame(pid);
				this.LayoutInputAddressBar.value = "";
				this.LayoutInputHighlightUpdate();

                this.TabList[pid] = {
                    addressBar: "",
                    currentURL: "",
                    isMasked: false,
                    hiddenProtocol: true,
                    mask: "",
                    title: title,
                    favicon: "",
                    created: Date.now(),
                    historyIndex: -1,
                    navigationHistory: [],
                    preview: undefined,
                };
                this.currentTab = pid;

                const newTab = this.HelperCreateTabSkeleton(title, pid, focused);
                if (focused === true) {
                    document.querySelectorAll('.tab:not(.tab_disabled)').forEach(tab => tab.classList.add('tab_disabled'));

                };
                document.getElementById(this.LayoutTabContainerID).appendChild(newTab);

                const self = this;

                this.TabList[pid].preview = tippy('[id="' + pid + `"]`, {
                    allowHTML: true,
                    placement: 'bottom',
                    theme: 'tab_preview',
                    arrow: false,
                    async onShow(instance) {
                        const iframe = document.getElementById('_' + pid);
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        const bgColor = (() => {
                            const color = getComputedStyle((document.getElementById('_' + pid).contentDocument || document.getElementById('_' + pid).contentWindow.document).body).backgroundColor;
                            return color.includes('rgba') && color.endsWith(', 0)') ? '#FFFFFF' : color;
                        })();
                        const dataUrl = await domtoimage.toPng(iframeDoc.documentElement, {
                            /*width: iframe.width,
                            height: iframe.height,
                            canvasWidth: iframe.width,
                            canvasHeight: iframe.height,*/
                            bgcolor: bgColor
                        })
                        instance.setProps({
                            content: `<div class="tab_preview_title">${self.TabList[pid].title}</div><div class="tab_preview_address">${self.TabList[pid].currentURL}</div><img class="tab_preview_img" src="${dataUrl}"><div class="tab_preview_ram">Memory Usage - ${await self.ProcessManager.getProcessMemoryUsageMB(pid)} mb</div>`
                        })
                    },
                });

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
                this.CurrentTabCount++;
                this.TravelTo(this.currentTab, "yab://newtab", true, true, "")
            }        
    }

    // Terminate a Tab and its Process
    terminateTab(pid) {
        if (this.ready !== true) {
            console.error('[BrowserController][ERROR]: BrowserController is not ready yet.');
        } else {
            // TODO: Handle closing a focused tab
            // Find and remove tab entry
            this.ProcessManager.terminateProcess(pid);
            this.WebviewRemoveFrame(pid);
            const container = document.getElementById(this.LayoutTabContainerID); // or document.getElementById('myDiv')
            const currentElem = document.getElementById(pid); // or however you determine it
            // Remove tab element
            const lastChild = container.lastElementChild;
            let neighbour = null;

            if (currentElem === lastChild) {
                // If the current element is the last child, get its previous sibling (to the left)
                neighbour = currentElem.previousElementSibling;
            } else {
                // currentElem is not the last child of the DIV.
                if (currentElem !== lastChild && !this.TabList.hasOwnProperty(lastChild.id)) {
                    // If the container's last child is NOT in the list, get currentElem's previous sibling
                    neighbour = currentElem.previousElementSibling;
                } else {
                    // If the container's last child IS in the list, get currentElem's next sibling (to the right)
                    neighbour = currentElem.nextElementSibling;
                }
            }

            delete this.TabList[pid];

            this.CurrentTabCount--;

            let tabtodel = document.getElementById(pid)


            tabtodel.classList.add('tab_animation_close');
            tabtodel.style.minWidth = "0px";
            tabtodel.addEventListener('animationend', () => {
                tabtodel.remove();


                if (Object.keys(this.TabList).length > 0) {
                    if (this.currentTab === pid) {
                        this.setFocus(neighbour.id);
                    }
    
                }
                if (Object.keys(this.TabList).length === 0) {
                    this.browserTerminate();
                }
            })

        

        }
    }

    // Set the focus on a Tab
    async setFocus(pid) {
        this.currentTab = pid;
        this.WebviewFocusFrame(pid);
        document.querySelectorAll('.tab:not(.tab_disabled)').forEach(tab => tab.classList.add('tab_disabled'));
        document.getElementById(pid).classList.remove('tab_disabled');
		this.LayoutInputAddressBar.value = this.TabList[pid].addressBar;
		this.LayoutInputHighlightUpdate();
        if (!this.TabList[pid].hiddenProtocol) {
            this.LayoutInputHideProtocol();
        }

        const back = document.getElementById('toolbar_icon_historyback')
        const forward = document.getElementById('toolbar_icon_historyforward')
        if (this.TabList[pid].historyIndex == 0) {
            if (this.TabList[pid].navigationHistory.length - 1 > 0) {
                // show forward
                forward.classList.add('toolbar_icon_enabled')
                back.classList.remove('toolbar_icon_enabled')
            } else {
                // show none
                forward.classList.remove('toolbar_icon_enabled')
                back.classList.remove('toolbar_icon_enabled')
            }
        } else if (this.TabList[pid].historyIndex == this.TabList[pid].navigationHistory.length - 1){
            // show backward
            console.log("HIIII THERE, value of navigationhistory", this.TabList[pid].navigationHistory.length - 1)
            back.classList.add('toolbar_icon_enabled')
            forward.classList.remove('toolbar_icon_enabled')
        } else {
            // show both
            forward.classList.add('toolbar_icon_enabled')
            back.classList.add('toolbar_icon_enabled')
        }
        

    }

    // Helps create the html skeleton for tabs in the tabbar
    HelperCreateTabSkeleton(title, pid, focused) {
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

    // Make a tab go to a certain website
    async TravelTo(pid, target, recordToHistory = true, masked = false, mask = "") {
        let favicon = document.getElementById(pid).querySelector(".tab_icon");
        favicon.innerHTML = "";
        favicon.appendChild(CitronJS.getContent('tab_spinner'));
        const res = await this.NetworkPageProcessor(target, pid);
        console.log("RES", res)
        if (res == "error-abort") {
            // its not a valid url, make it a search instead
        }
        const tab = this.TabList[pid];

        tab.isMasked = masked ? true : false;
        tab.addressBar = masked ? mask : target;
        this.LayoutInputAddressBar.value = masked ? mask : target;
        tab.currentURL = target;

        
        

        if (recordToHistory) {
            tab.historyIndex += 1;
        
            if (tab.isMasked) {
                try {
                    const test = new URL(tab.mask);
                    tab.navigationHistory.push({
                        timestamp: Date.now(),
                        url: tab.mask,
                        title: tab.title,
                        isMasked: false
                    })
                } catch(err) {
                    tab.navigationHistory.push({
                        timestamp: Date.now(),
                        url: tab.currentURL,
                        title: tab.title,
                        isMasked: true,
                        mask: tab.mask

                    })
                }
            } else {
                tab.navigationHistory.push({
                    timestamp: Date.now(),
                    url: tab.currentURL,
                    title: tab.title,
                    isMasked: false
                })
            }

        }
        
        favicon.innerHTML = "";
        favicon.appendChild(CitronJS.getContent('doc_favicon'));

        if (this.NetworkLocalProtocols.hasOwnProperty(this.HelperURLToObject(target).protocol)) {
            this.TabList[pid].hiddenProtocol = false;
        } else { this.TabList[pid].hiddenProtocol = true; }
         this.LayoutInputHighlightUpdate();
        
        /*if (masked) {
            tab.isMasked = true;
            tab.mask = mask;

            if (this.currentTab == pid) {
                this.LayoutInputAddressBar.value = mask;
                this.TabList[pid].addressBar = mask;
                this.TabList[pid].currentURL = target;
                this.LayoutInputHighlightUpdate();
                
            }
        } else {
            tab.isMasked = false;

            if (this.currentTab == pid) {
                this.LayoutInputAddressBar.value = target;
                this.TabList[pid].addressBar = target;
                this.TabList[pid].currentURL = target;
                this.LayoutInputHighlightUpdate();
            }
        }*/
        if (this.TabList[pid].addressBar == "") {
            this.LayoutInputAddressBar.focus();
        }

        if (this.currentTab == pid) {
            const back = document.getElementById('toolbar_icon_historyback')
            const forward = document.getElementById('toolbar_icon_historyforward')

            if (this.TabList[pid].historyIndex == 0) {
                if (this.TabList[pid].navigationHistory.length -1 > 0) {
                    forward.classList.add('toolbar_icon_enabled')
                    back.classList.remove('toolbar_icon_enabled')
                }
            } else if (this.TabList[pid].historyIndex == this.TabList[pid].navigationHistory.length - 1){
                // show backward
                back.classList.add('toolbar_icon_enabled')
                forward.classList.remove('toolbar_icon_enabled')
            } else {
                // show both
                forward.classList.add('toolbar_icon_enabled')
                back.classList.add('toolbar_icon_enabled')
            }
        }

    }

    // =========================
    // Web View - In charge of anything that is actually displayed by websites in iframes
    // =========================

    WebviewSpawnFrame(pid) {
        const webview = CitronJS.getContent('webview', {
            id: "_" + pid
        });
        document.getElementById(this.LayoutWebViewContainerID).appendChild(webview);
    }

    WebviewFocusFrame(pid) {
        document.getElementById(this.LayoutWebViewContainerID)
            .querySelectorAll('.web_view')
            .forEach(iframe => iframe.classList.add('web_view_hidden'));
        document.getElementById(this.LayoutWebViewContainerID).querySelector("#_" + pid).classList.remove('web_view_hidden');
    }

    WebviewRemoveFrame(pid) {
        document.getElementById(this.LayoutWebViewContainerID).querySelector("#_" + pid);
    }

    async WebviewSetFrameHTML(pid, html, CssInjection = []) {
        const iframe = document.getElementById(this.LayoutWebViewContainerID).querySelector('#_' + pid);
        //target.appendChild(html);
        iframe.onload = () => {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            
            /*const target = iframe.contentDocument.querySelector('body');
            target.appendChild(html);*/
            if (typeof html !== 'string') {
                html = Helper.fragmentToString(html);
            }
            doc.open();
            doc.write(html); 
            doc.close();

            if (CssInjection) {
                CssInjection.forEach(link => {
                    const head = doc.head || doc.getElementsByTagName('head')[0];
                    const newLink = doc.createElement('link');
                    newLink.rel = 'stylesheet';
                    newLink.href = link;
                    head.appendChild(newLink);
                })
            }
          };
        iframe.contentDocument.location.reload();
    }


    // =========================
    // Network Manager - In charge of anything related to calling the DNS or the Protocols
    // =========================

    NetworkNativeYabProtocol = async(pid, purl) => {
        if (purl.domain === "newtab") {
            this.WebviewSetFrameHTML(pid, CitronJS.getContent('native_error'), ['../media/native/native_error.css'])

        } else if (purl.domain === "settings") {
            this.WebviewSetFrameHTML(pid, CitronJS.getContent('native_settings'), ['../media/native/native_settings.css'])

        }
    }

    async NetworkDNSExchange(purl, server) {
        const controller = new AbortController();
        const timeout = this.NetworkThirdPartyProtocols[purl.protocol][server].timeout;
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        return fetch(this.NetworkThirdPartyProtocols[purl.protocol][server].address.replace('{domain}', purl.domain.split('.').at(-2)).replace('{tld}', purl.domain.split('.').at(-1)), {
                signal: controller.signal,
                headers: this.NetworkThirdPartyProtocols[purl.protocol].headers
            })
            .then(response => response.json())
            .then(data => {
                clearTimeout(timeoutId)

                let recordEntry = null;

                for (const record of data) {
                    if (record.type === "WEB" && record.name === purl.domain) {
                        recordEntry = record;
                        break;
                    }
                }
                if (recordEntry) {
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

    async NetworkPageProcessor(url, pid) {
        const purl = this.HelperURLToObject(url);
        if (!purl) {
            return { error: "error.noturl" }
        } else {
            if (this.NetworkLocalProtocols.hasOwnProperty(purl.protocol)) {
                this.NetworkLocalProtocols[purl.protocol].source(pid, purl);

            } else if (this.NetworkThirdPartyProtocols.hasOwnProperty(purl.protocol)) { 
                let res;
                res = await this.NetworkDNSExchange(purl, "server1");
                if (res.error) {
                    if (res.error == "error.abort") {
                        res = this.NetworkDNSExchange(purl, "server2");
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

                                        //this.spawnDevToolWindow(pid);
                                        //this.setDevTree(pid, htmlString);
                                        this.WebviewSetFrameHTML(pid, Helper.objToString(obj));
                                        process.setHtml(pid, Helper.objToString(obj))

                                        scripts = scripts.map(({ src, api }) => {
                                        let href;
                                        try {
                                            
                                            href = new URL(src).href;
                                        } catch (err) {
                                            
                                            const baseOrigin = new URL(res).origin;        
                                            const temp = new URL(src, baseOrigin + purl.path);
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

    HelperURLToObject(url) {
        try {
            let uri = new URL(url);
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

}


