// Window gets initiated
import { Browser } from './browserComponents.js'

// new BrowserInstance()
document.addEventListener('DOMContentLoaded', function() {
/*    Sortable.create(tab_sortable, {
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
    }); */


    document.addEventListener("CitronReady", () => {
        const BrowserInstance = new Browser();
        BrowserInstance.init();

        // TODO: Remove exposed browser instance
        window.BrowserInstance = BrowserInstance;
        //window.Wave = WaveInstance;
    });
});