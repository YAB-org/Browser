export class Browser {
    constructor() {
        this.LayoutManager = new LayoutManager();
        this.TabManager = new TabManager('tab_sortable', 1582, undefined, undefined, undefined);
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
    constructor(target_id, max, engineInstance = undefined, button = undefined, tabs = undefined) {
        this.ready = false;
        this.targetDiv = target_id;
        this.maxTabAmount = max;
        this.engine = engineInstance;
        this.tabs = tabs;
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

            if (!this.tabs == undefined) {

            } else {
                this.spawnTab(undefined, 'first', undefined, true);

                for (let i = 1; i <= 1; i++) {
                    this.spawnTab(undefined, `loooong text ${i}`);
                }
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

    spawnTab(state, text, icon, focused = false) {
        if (this.ready !== true) {
            console.error('[TabManager][ERROR]: TabManager is not ready yet.');
        } else {

            if (this.currentAmount < this.maxTabAmount) {
                let generatedID = this.generateRandomID();
                console.log(generatedID)
                const newTab = this.createTabSkeleton(text, generatedID);
                document.getElementById(this.targetDiv).appendChild(newTab);
                console.log('got here!');
                // Attach event
                setTimeout(() => {
                    let generatedTab = document.getElementById(generatedID);
                    console.log(generatedTab)
                    generatedTab.addEventListener('mousedown', () => {
                        document.querySelectorAll('.tab:not(.tab-disabled)').forEach(tab => tab.classList.add('tab-disabled'));
                        generatedTab.classList.remove('tab-disabled');
                    });
                    this.currentAmount++;
                    if (focused === true) {
                        newTab.classList.remove('tab-disabled')
                    };    
                }, 500);
                
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

    createTabSkeleton(title, id) {
        const tab = document.createElement('sample');
        tab.setAttribute('name', 'tab');
        tab.setAttribute('title', title);
        tab.setAttribute('id', id);
        return tab;
    }
}

class NetworkManager {
    constructor() {

    }
    init() {

    }
}