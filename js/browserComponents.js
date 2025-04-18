export class Browser {
    constructor() {
        this.ProcessManager = new ProcessManager();
        this.WebView = new WebView('web_display');
        this.TabManager = new TabManager('tab_sortable', 9999, this.ProcessManager, this.WebView, this.terminateBrowserInstance_safe);
        this.LayoutManager = new LayoutManager(this.TabManager);
        this.NetworkManager = new NetworkManager();

    }

    init() {
        try {
            this.ProcessManager.init();
            this.LayoutManager.init();
            this.TabManager.init();
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
        //Split(['#split-0', '#split-1'])


        var editorContainer = document.querySelector('.editorContainer')
        CodeMirror(editorContainer, {
            lineNumbers: true,
            mode: 'lua',
            value: 'local b = 3',
            theme: 'ayu-mirage'
        })

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

class TabManager {
    constructor(target_id, max, engineInstance, webView, terminateBrowser) {
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

		this.input = document.getElementById('toolbar_searchbar');
        this.highlight = document.getElementById('searchbar_highlight');
    }

    init() {
        if (!document.getElementById(this.targetDiv)) {
            console.error('[TabManager][FATAL]: Cannot initialize. Target Tab Container "' + this.targetDiv + '" does not exist.');
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
                easing: "cubic-bezier(1, 0, 0, 1)",
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

    async TravelTo(pid, url, inherit) {

    }

    async spawnTab(title, focused = false, options) {
        if (this.ready !== true) {
            console.error('[TabManager][ERROR]: TabManager is not ready yet.');
        } else {

            if (this.currentAmount < this.maxTabAmount) {

                const pid = await this.engine.spawnNewProcess();
                this.WebView.spawnWebView(pid);
                this.WebView.focusWebView(pid);
                this.address_bar.focus();
				this.address_bar.value = "";
				this.address_highlight_update();

                this.tabs[pid] = {
                    addressBar: "",
                    currentURL: "yab://error/some-error",
                    inheritedURL: "",
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
                    document.querySelectorAll('.tab:not(.tab-disabled)').forEach(tab => tab.classList.add('tab-disabled'));

                };
                document.getElementById(this.targetDiv).appendChild(newTab);
                console.log('got here!');


                // add to registry
                // TODO: Finish dis
                // Attach event

                let generatedTab = document.getElementById(pid);
                console.log(generatedTab)
                generatedTab.querySelector('.tab_left').addEventListener('mousedown', () => {
                    this.setFocus(pid);
                    this.currentTab = pid;
                });
                generatedTab.querySelector('.tab_close_container').addEventListener('click', () => {
                    this.terminateTab(pid);
                });
                this.currentAmount++;


            }

        }
    }

    terminateTab(pid) {
        if (this.ready !== true) {
            console.error('[TabManager][ERROR]: TabManager is not ready yet.');
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

            tabtodel.style.width = '200px';
            tabtodel.classList.remove('tab_animation');
            tabtodel.classList.add('tab_animation-close');

            setTimeout(() => {

                tabtodel.remove();
                console.log(Object.keys(this.tabs).length);
                console.log("it is " + Object.keys(this.tabs).length === 0);
            }, 220);
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

        }
    }

    setFocus(pid) {
		//this.tabs[this.currentTab].addressBar = this.address_bar.value;
        this.currentTab = pid;
        this.WebView.focusWebView(pid);
        document.querySelectorAll('.tab:not(.tab-disabled)').forEach(tab => tab.classList.add('tab-disabled'));
        document.getElementById(pid).classList.remove('tab-disabled');
		this.address_bar.value = this.tabs[pid].addressBar;
		this.address_highlight_update();

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
            let proto = document.querySelector('.searchbar_proto');
            if (proto) proto.style.display = 'none';
        });

        this.input.addEventListener("scroll", () => {
            this.highlight.scrollTop = _this.input.scrollTop;
            this.highlight.scrollLeft = _this.input.scrollLeft;
        });
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
        this.targetDiv.querySelectorAll('div').forEach(div => {
            div.classList.add('web_view-hidden');
        })
        this.targetDiv.querySelector("#_" + pid).classList.remove('web_view-hidden');
    }
}


class ProtocolManager {
	constructor() {
		this.native = {
			yab: {
				paths: {
					newtab: {
						html: "native_newtab"
					},
					settings: {
						html: "native_settings"
					}
				}
			}
		}

		this.third_party = {
			buss: {
				primary: true,
				type: "custom",
				server1: {
					address: "https://dns-one.webxplus.org/resolve",
					timeout: 30000
				},
				server2: {
					address: "https://dns-two.webxplus.org/resolve",
					timeout: 30000
				},
				headers: {
					key: "value",
					key: "value"
				}
			}
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

class NetworkManager {
    constructor() {

    }
    init() {

    }
}