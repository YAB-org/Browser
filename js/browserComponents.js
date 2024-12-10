export class Browser {
    constructor() {
        this.LayoutManager = new LayoutManager();
        this.TabManager = new TabManager('tab_sortable');
        this.NetworkManager = new NetworkManager();
    }


    init() {
        try {
            this.TabManager.init();
            //this.LayoutManager.init();
            //this.NetworkManager.init();
        } catch (error) {
            console.error("BrowserInstance failed to start up: " + error);
        }
    }
}


class LayoutManager {
    constructor() {

    }
}

class TabManager {
    constructor(target_id, max, engineInstance = undefined, button = undefined, tabs = []) {
        this.ready = false;
        this.targetDiv = target_id;
        this.maxTabAmount = max;
        this.engine = engineInstance;
        this.tabs = [];
        this.initTabs = tabs;
        this.currentTab = 0;
        this.IntiatorID = button;
    }

    init() {
        if (!document.getElementById(this.targetDiv)) {
            console.error('[TabManager][FATAL]: Cannot initialize. Target Tab Container "' + this.targetDiv + '" does not exist.');
            throw new Error();
        } else {
            this.ready = true;

            class TabElement extends HTMLElement {
                constructor() {
                  super();
                }
                connectedCallback() {
                    // Shadow dom
                    let shadow = this.attachShadow({ mode: 'open' });
                    let div = document.createElement('div');
                    div.classList.add('tab');
                    if (this.getAttribute('selected')!==null) div.classList.add('tab-selected');
                    this.shadowDiv = div;
                    div.innerHTML = `<style>
    .tab {
        display: flex;
        gap: 10px;
        align-items: center;
        width: 200px;
        height: 28px;
        border-radius: 7px 7px 3px 3px;
        transition: border-radius 0.5s;
        padding-inline: 10px;
        -webkit-app-region: no-drag;
        background: var(--bg-tab-disabled);
    }
    .tab:hover {
        cursor:pointer;
    }
    .spacer {
        flex: 1;
    }
    .tab-selected {
        background: var(--bg-tab-active);
    }
</style>
<div class="tab_icon"></div>
<div class="tab_title">ye so: { title }</div>
<span class="spacer"></span>
<div class="tab_close_container">
    <svg role="button" width="12" height="12" viewBox="0 0 12 12"><polygon fill="currentColor" fill-rule="evenodd" points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1"></polygon></svg>
</div>`;
                    shadow.appendChild(div);
                }
                setSelected(stat) {
                    if (stat) {
                        this.shadowDiv.classList.add('tab-selected');
                        this.setAttribute('selected', true);
                    } else {
                        this.shadowDiv.classList.remove('tab-selected');
                        this.removeAttribute('selected');
                    }
                }
            }
            customElements.define("yab-tab", TabElement);

            Array.from(document.getElementsByTagName('yab-tab')).forEach(e=>{
                e.onmousedown = function(){
                    document.querySelector('yab-tab[selected]').setSelected(false);
                    e.setSelected(true);
                }
            })

            Sortable.create(document.getElementById(this.targetDiv), {
                swapThreshold: 0.90,
                animation: 150,
                easing: "cubic-bezier(1, 0, 0, 1)",
                onEnd: function(){
                    backend.getWindowData().then(data => {
                        let mouse = data.mouse;
                        let bounds = data.bounds;//document.getElementById('titlebar').getBoundingClientRect()

                        const isInsideWindow =
                            mouse.x >= bounds.x &&
                            mouse.x <= bounds.x + bounds.width &&
                            mouse.y >= bounds.y &&
                            mouse.y <= bounds.y + bounds.height;

                        console.log(`Is Inside Window: ${isInsideWindow}`);
                    })
                }
            });

            return;
        }
    }

    spawnTab(state, text, icon, closable) {
        if (!this.ready === true) {
            console.error('[TabManager][ERROR]: TabManager is not ready yet.');
        } else {
            // open tab logic
        }
    }

    terminateTab() {
        if (!this.ready === true) {
            console.error('[TabManager][ERROR]: TabManager is not ready yet.');
        } else {
            // close a tab logic
        }
    }

    cleanup() {
        // simply closes safely, and saves the tab tree if its valid.
    }
}

class NetworkManager {
    constructor() {

    }
    init() {

    }
}