export class Browser {
	constructor(engine) {
		this.TabManager = new TabManager('tab_sortable', 1582, engine, this.terminateBrowserInstance_safe);
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
        this.input = document.getElementById('toolbar_searchbar');
        this.highlight = document.getElementById('searchbar_highlight');
    }

    init() {
			console.log('Layoutmanager init')
        // Initialize URL highlighting functionality
        this.setupUrlHighlighting();

        // Initialize tab management functionality
        document.getElementById('tab_newtab_button').addEventListener('click', () => {
            this.tabman.spawnTab('New Tab', true);
        });
    }

    setupUrlHighlighting() {
        let update = () => {
            let final = this.input.value;
            final = final
                .replaceAll('<', '&lt;')
                .replace(/.+?:\/\//, '<span class="searchbar_proto">$&</span>')
                .replace(/(?<!:|:\/|<)(\/|\?).*?$/m, '<span class="searchbar_path">$&</span>')
                .replace(/:[0-9]+/, '<span class="searchbar_port">$&</span>');
            this.highlight.innerHTML = final;
        };

        this.input.oninput = update;

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
			this.highlight.scrollTop = this.input.scrollTop;
			this.highlight.scrollLeft = this.input.scrollLeft;
		});
    }
}

class TabManager {
	constructor(target_id, max, engineInstance, BrowserInstance) {
		this.ready = false;
		this.targetDiv = target_id;
		this.maxTabAmount = max;
		this.engine = engineInstance;
		this.tabs = [];
		this.initTabs = this.tabs;
		this.currentTab = 0;
		this.currentAmount = 0;
		this.browserTerminate = BrowserInstance;
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
				console.log(CitronJS.getContent);
				const newTab = this.createTabSkeleton(text, generatedID, focused);
				console.log(newTab);
				if (focused === true) {
					document.querySelectorAll('.tab:not(.tab-disabled)').forEach(tab => tab.classList.add('tab-disabled'));

				};
				document.getElementById(this.targetDiv).appendChild(newTab);
				console.log('got here!');


				// add to registry
				// TODO: Finish dis
				this.tabs.push(generatedID);
				this.currentTab = generatedID;

				this.engine.spawnNewProcess();
				// Attach event

				let generatedTab = document.getElementById(generatedID);
				console.log(generatedTab)
				generatedTab.querySelector('.tab_left').addEventListener('mousedown', () => {
					document.querySelectorAll('.tab:not(.tab-disabled)').forEach(tab => tab.classList.add('tab-disabled'));
					generatedTab.classList.remove('tab-disabled');
					this.currentTab = generatedID;
				});
				generatedTab.querySelector('.tab_close_container').addEventListener('click', () => {
					this.terminateTab(generatedID);
				});
				this.currentAmount++;


			}

		}
	}

	terminateTab(id) {
		if (this.ready !== true) {
			console.error('[TabManager][ERROR]: TabManager is not ready yet.');
		} else {
			// TODO: Handle closing a focused tab
			// Find and remove tab entry
			const container = document.getElementById(this.targetDiv); // or document.getElementById('myDiv')
			const currentElem = document.getElementById(id); // or however you determine it
			// Remove tab element
			const lastChild = container.lastElementChild;
			console.log(lastChild);
			let neighbour = null;

			if (currentElem === lastChild) {
				// If the current element is the last child, get its previous sibling (to the left)
				neighbour = currentElem.previousElementSibling;
			} else {
				// currentElem is not the last child of the DIV.
				if (currentElem !== lastChild && !this.tabs.includes(lastChild.id)) {
					// If the container's last child is NOT in the list, get currentElem's previous sibling
					neighbour = currentElem.previousElementSibling;
				} else {
					// If the container's last child IS in the list, get currentElem's next sibling (to the right)
					neighbour = currentElem.nextElementSibling;
				}
			}
			let idx = this.tabs.indexOf(id);
			this.tabs.splice(idx, 1);

			this.currentAmount--;

			let tabtodel = document.getElementById(id)

			tabtodel.style.width = '200px';
			tabtodel.classList.remove('tab_animation');
			tabtodel.classList.add('tab_animation-close');

			setTimeout(() => {

				tabtodel.remove();
				console.log(this.tabs.length);
				console.log("it is " + this.tabs.length === 0);
			}, 220);
			if (this.tabs.length > 0) {
				console.log('hallo?');
				if (this.currentTab === id) {
					this.setFocus(neighbour.id);
					console.log(neighbour);
				}

			}
			if (this.tabs.length === 0) {
				this.browserTerminate();
			}

		}
	}

	setFocus(id) {
		this.currentTab = id;
		document.querySelectorAll('.tab:not(.tab-disabled)').forEach(tab => tab.classList.add('tab-disabled'));
		document.getElementById(id).classList.remove('tab-disabled');

	}

	cleanup() {
		// simply closes safely, and saves the tab tree if its valid.
	}

	createTabSkeleton(title, id, focused) {
		if (focused) {
			return CitronJS.getContent('tab_focused', {
				title: title,
				id: id
			});
		} else {
			return CitronJS.getContent('tab', {
				title: title,
				id: id
			});
		}
	}
}

class NetworkManager {
	constructor() {

	}
	init() {

	}
}