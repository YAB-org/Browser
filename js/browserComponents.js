export class Browser {
    constructor() {
        this.LayoutManager = new LayoutManager();
        this.TabManager = new TabManager('tab_sortable', 2, undefined, undefined, undefined);
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
        this.currentAmount = 0;
    }

    init() {
        if (!document.getElementById(this.targetDiv)) {
            console.error('[TabManager][FATAL]: Cannot initialize. Target Tab Container "' + this.targetDiv + '" does not exist.');
            throw new Error();
        } else {
            this.ready = true;

            this.spawnTab(undefined, 'first');
            this.spawnTab(undefined, 'second');
            this.spawnTab(undefined, 'third');

            Sortable.create(document.getElementById(this.targetDiv), {
                swapThreshold: 0.90,
                animation: 150,
                preventOnFilter: true,
                preventOnCancel: false,
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

    spawnTab(state, text, icon, focused) {
        if (this.ready !== true) {
            console.error('[TabManager][ERROR]: TabManager is not ready yet.');
        } else {
            
            if (this.currentAmount < this.maxTabAmount) {

                const newTab = this.createTabSkeleton();
                document.getElementById(this.targetDiv).appendChild(newTab);
                console.log('got here!');
                // Attach event
                newTab.addEventListener('mousedown', () => {
                    document.querySelectorAll('.tab:not(.tab-disabled)').forEach(tab => tab.classList.add('tab-disabled'));
                    newTab.classList.remove('tab-disabled');
                });
                this.currentAmount++

            }
        }
    }

    terminateTab() {
        if (this.ready !== true) {
            console.error('[TabManager][ERROR]: TabManager is not ready yet.');
        } else {
            // close a tab logic
        }
    }

    cleanup() {
        // simply closes safely, and saves the tab tree if its valid.
    }

    createTabSkeleton() {
        const tab = document.createElement('tab');
        const tab_left = document.createElement('div');
        const tab_right = document.createElement('div');
        const tab_icon = document.createElement('div');
        const tab_title = document.createElement('div');
        const tab_close = document.createElement('div');
        const tab_svg = document.createElement('sample');
        tab.appendChild(tab_left);
        tab.appendChild(tab_right);
        tab_left.appendChild(tab_icon);
        tab_left.appendChild(tab_title);
        tab_right.appendChild(tab_close);
        tab_close.appendChild(tab_svg);
        tab.classList.add('tab', 'tab-disabled');
        tab_svg.setAttribute('name', 'windows_close_svg');
        return tab;
    }
}

class NetworkManager {
    constructor() {

    }
    init() {

    }
}