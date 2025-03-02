export class Wave {
    constructor() {
        // Track active processes
        this.processes = new Map();
        this.process_count = 0;
        this.controlled_term = [];
    }

    StartEventEmitter() {
        ipcRenderer.on('process-created', (event, pid, tab_id) => {
            this.processes.set(tab_id, pid);
            this.process_count++;
        });

        ipcRenderer.on('process-ended', (event, tab_id) => {
            // ended triggered by closing a tab or the browser
            const processPID = this.processes.get(tab_id);
        });

        ipcRenderer.on('process-terminated', (event, pid) => {
            // unexpected ended, aka triggered by task manager or other task killer
        });
    }

    spawnNewProcess() {
        window.process.spawn();
        
    }

    terminateProcess(pid) {
        ipcRenderer.send('terminate-process', pid);
    }

    


}

class LuaVM {

}