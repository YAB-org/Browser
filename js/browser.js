// Window gets initiated
//import { BrowserInstance } from './browserComponents.js'

// new BrowserInstance()
document.addEventListener('DOMContentLoaded', function() {
    Sortable.create(tab_sortable, {
        swapThreshold: 0.90,
        animation: 150,
        onEnd: function(){
            console.log(backend.getMouse())
        }
    });
});