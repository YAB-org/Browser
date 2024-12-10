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

            Array.from(document.querySelectorAll('.tab')).forEach(e=>{
                e.onclick = function(){
                    document.querySelector('.tab:not(.tab-disabled)').classList.add('tab-disabled');
                    e.classList.remove('tab-disabled')
                }
            })

            Sortable.create(document.getElementById(this.targetDiv), {
                swapThreshold: 0.90,
                animation: 150,
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