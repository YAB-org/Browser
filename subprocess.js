// subprocess.js
const process = require('process');

// Set process title
process.title = `ElectronSubProcess-${Date.now()}`;

// Handle messages from main process
process.on('message', async (message) => {
    console.log(message);
});