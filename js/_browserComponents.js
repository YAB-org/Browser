
class BrowserInstance {

}

class LayoutManager {
    
}

class TabManager {
    constructor (target_id, max, engineInstance, tabTree = undefined) {
        this.targetDiv = target_id;
        this.maxTabAmount = max;
        this.minTabAmount = min;
        this.initTree = tabTree;
        this.engine = engineInstance;
        this.tabTree = {};
        this.currentTab = undefined;
        this.ready = false;
    }

    init () {
        if (!document.getElementById(this.targetDiv)) {
            console.error('[TabManager][FATAL]:Cannot initialize. Target Tab Container "' + this.targetDiv + '" does not exist.');
        } else {
            this.ready = true;
            return;            
        }
    }

    spawnTab (state, text, icon, closable) {
        if (!this.ready === true) {
            console.error('[TabManager][ERROR]: TabManager is not ready yet.');
        } else {
            // open tab logic
        }
    }

    terminateTab () {
        if (!this.ready === true) {
            console.error('[TabManager][ERROR]: TabManager is not ready yet.');
        } else {
            // close a tab logic
        }
    }

    cleanup () {
        // simply closes safely, and saves the tab tree if its valid.
    }
    

}

class NetworkManager {

}

