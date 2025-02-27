export class Browser {
    constructor() {
        this.TabManager = new TabManager('tab_sortable', 1582, undefined, undefined, undefined);
        this.LayoutManager = new LayoutManager(this.TabManager);
        this.NetworkManager = new NetworkManager();
    }


    init() {
        try {
            this.TabManager.init();
            this.LayoutManager.init();
            //this.NetworkManager.init();
        } catch (error) {
            console.error("BrowserInstance failed to start up: " + error);
        }
    }
}


class LayoutManager {
    constructor(tab_manager) {
        this.tabman = tab_manager;
    }

    init() {
        document.getElementById('tab_newtab_button').addEventListener('click', () => {
            this.tabman.spawnTab('New Tab', true)
        })
    }
}

class TabManager {
    constructor(target_id, max, engineInstance = undefined, button = undefined) {
        this.ready = false;
        this.targetDiv = target_id;
        this.maxTabAmount = max;
        this.engine = engineInstance;
        this.tabs = [];
        this.initTabs = this.tabs;
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

    generateRandomID() {
        return Math.floor(1000000 + Math.random() * 9000000).toString();
    }

    spawnTab(text, focused = false) {
        if (this.ready !== true) {
            console.error('[TabManager][ERROR]: TabManager is not ready yet.');
        } else {

            if (this.currentAmount < this.maxTabAmount) {
                let generatedID = this.generateRandomID();
                while (this.tabs.includes(generatedID)) {
                    generatedID = this.generateRandomID();
                }
                console.log(generatedID)
                const newTab = this.createTabSkeleton(text, generatedID, focused);
                if (focused === true) {
                    document.querySelectorAll('.tab:not(.tab-disabled)').forEach(tab => tab.classList.add('tab-disabled'));
                };
                document.getElementById(this.targetDiv).appendChild(newTab);
                console.log('got here!');


                // add to registry
                // TODO: Finish dis
                this.tabs.push(generatedID);


                // Attach event
                setTimeout(() => {
                    let generatedTab = document.getElementById(generatedID);
                    console.log(generatedTab)
                    generatedTab.querySelector('.tab_left').addEventListener('mousedown', () => {
                        document.querySelectorAll('.tab:not(.tab-disabled)').forEach(tab => tab.classList.add('tab-disabled'));
                        generatedTab.classList.remove('tab-disabled');
                    });
                    generatedTab.querySelector('.tab_close_container').addEventListener('click', () => {
                        this.terminateTab(generatedID);
                    });
                    this.currentAmount++;

                }, 250);

            }

        }
    }

    terminateTab(id) {
        if (this.ready !== true) {
            console.error('[TabManager][ERROR]: TabManager is not ready yet.');
        } else {
            // TODO: Handle closing a focused tab
            // Find and remove tab entry
            let idx = this.tabs.indexOf(id);
            this.tabs.splice(idx, 1);
            // Remove tab element
            document.getElementById(id).remove();
        }
    }

    cleanup() {
        // simply closes safely, and saves the tab tree if its valid.
    }

    createTabSkeleton(title, id, focused) {
        const tab = document.createElement('sample');
        tab.setAttribute('name', 'tab');
        tab.setAttribute('title', title);
        tab.setAttribute('id', id);
        if (focused) {
            tab.setAttribute('name', 'tab_focused');
        }
        return tab;
    }
}

class NetworkManager {
    constructor() {

    }
    init() {

    }
}