# YAB — Yet Another Browser

<img width="150" height="auto" alt="YAB(1)" src="https://github.com/user-attachments/assets/257e1f2f-f49e-4f11-b560-3b6128da12c5" />



**YAB** is a modern browser designed for WebX. It supports both the legacy Lua API (used by Bussinga) and the new standard WebX API, ensuring compatibility with both older and newer websites.

Built on Electron, YAB offers enhanced security by running each Lua script in its own isolated process. This architecture prevents code from leaking between sites and allows for easy termination of unresponsive pages.

## Features

- **Dual API Support**: Seamlessly handles both legacy Lua and the modern WebX API.
- **Isolated Execution**: Each tab in the browser runs in its own process, enhancing security and stability.
- **Electron-Based**: Available on Windows, Linux and Mac.
- **Automatic Updates**: YAB has automatic updates for Windows and Linux so you don't have to manually download new releases.

## Known Issues

### Wasmoon
- ~Wasmoon doesn't point out the line where an error occurs.~
- Wasmoon degrades in performance when websites interact with the DOM a lot.
- VM suffers from some quirks and or edge-cases that can be found here: https://github.com/ceifa/wasmoon

### Legacy API

- **`fetch` Handling**: Due to limitations in Wasmoon, our primary Lua VM, asynchronous `fetch` calls are challenging to implement without changing the current Lua syntax on WebX. To mitigate this, YAB automatically rewrites `fetch` calls to use `:await()`. Fengari does not natively have an `:await()` method to receive js promises. While this approach kind of work, excessive use of `fetch` may lead to issues

- **`window.browser` Compatibility**: Bussinga introduced several APIs that rely on checking `window.browser`. To maintain compatibility with older websites, YAB mimics Bussinga's behavior by returning `"bussinga"` for `window.browser`. To detect YAB specifically, check for `window.true_browser`.

- **Incomplete Bussinga API Replication**: While we've incorporated many features from the Bussinga API, some have not been fully replicated. This may result in certain legacy websites not functioning as intended.
