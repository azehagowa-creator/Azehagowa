"use strict";
/**
 * Copyright (c) 2018-2024 Michael Potthoff
 *
 * This file is part of vscode-android-webview-debug.
 *
 * vscode-android-webview-debug is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * vscode-android-webview-debug is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with vscode-android-webview-debug. If not, see <http://www.gnu.org/licenses/>.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugConfigurationProvider = void 0;
const vscode = require("vscode");
const bridge = require("./bridge");
const tasks = require("./tasks");
const ui = require("./ui");
class DebugConfigurationProvider {
    resolveDebugConfiguration(folder, debugConfiguration, token) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!debugConfiguration.type || !debugConfiguration.request) {
                // Empty configurations are unsupported
                return null;
            }
            if (debugConfiguration.request !== "attach") {
                // Only attach is supported right now
                return null;
            }
            if (debugConfiguration.preLaunchTask) {
                // Workaround for a configured preLaunchTask.
                // The debug configuration is resolved before the preLaunchTask gets executed.
                // This means the debugging connection would be established before the task gets executed,
                // which would prevent the task from deploying the application.
                const task = yield tasks.findTask(debugConfiguration.preLaunchTask);
                if (!task) {
                    let item;
                    if (typeof debugConfiguration.preLaunchTask === "string") {
                        item = yield vscode.window.showErrorMessage(`Could not find the task '${debugConfiguration.preLaunchTask}'.`, {
                            modal: true
                        }, "Debug Anyway", "Configure Task", "Open launch.json");
                    }
                    else {
                        item = yield vscode.window.showErrorMessage("Could not find the specified task.", {
                            modal: true
                        }, "Debug Anyway", "Configure Task", "Open launch.json");
                    }
                    if (item === "Debug Anyway") {
                        // Continue
                    }
                    else if (item === "Configure Task") {
                        vscode.commands.executeCommand("workbench.action.tasks.configureTaskRunner");
                        return undefined;
                    }
                    else if (item === "Open launch.json") {
                        return null;
                    }
                    else {
                        return undefined;
                    }
                }
                else {
                    const result = yield tasks.executeTask(task);
                    if (!result) {
                        return undefined;
                    }
                }
                delete debugConfiguration.preLaunchTask;
            }
            const useNewDebugger = (_a = vscode.workspace.getConfiguration("debug.javascript").get("usePreview")) !== null && _a !== void 0 ? _a : true;
            // Rewrite type to chrome
            debugConfiguration.type = useNewDebugger ? "pwa-chrome" : "chrome";
            // Test the bridge to ensure that the required executables exist
            yield bridge.test();
            return yield vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                var _b, _c, _d;
                let device;
                let webView;
                progress.report({ message: "Loading devices..." });
                // Find the connected devices
                const devices = yield bridge.findDevices();
                if (devices.length < 1) {
                    vscode.window.showErrorMessage(`No devices found`);
                    return undefined;
                }
                if (debugConfiguration.device) {
                    // Try to find the configured device
                    const found = devices.find((el) => el.serial === debugConfiguration.device);
                    if (!found) {
                        vscode.window.showErrorMessage(`Device '${debugConfiguration.device}' not found`);
                        return undefined;
                    }
                    device = found;
                }
                if (!device) {
                    if (debugConfiguration.application) {
                        progress.report({ message: "Loading WebViews..." });
                        const webViews = yield withTimeoutRetries((_b = debugConfiguration.connectTimeout) !== null && _b !== void 0 ? _b : 0, 500, () => __awaiter(this, void 0, void 0, function* () {
                            // Find all devices that have the application running
                            const promises = devices.map((dev) => __awaiter(this, void 0, void 0, function* () {
                                const webViews = yield bridge.findWebViews(dev).catch((err) => {
                                    vscode.window.showWarningMessage(err.message);
                                    return [];
                                });
                                return webViews.find((el) => el.packageName === debugConfiguration.application);
                            }));
                            const result = yield Promise.all(promises);
                            const filtered = result.filter((el) => el ? true : false);
                            if (filtered.length < 1) {
                                return undefined;
                            }
                            return filtered;
                        }));
                        if (!webViews || webViews.length < 1) {
                            vscode.window.showErrorMessage(`No matching WebViews found on any device`);
                            return undefined;
                        }
                        if (webViews.length === 1) {
                            device = webViews[0].device;
                            webView = webViews[0];
                        }
                        else {
                            // Ask the user to select a device
                            const filteredDevices = Array.from(new Set(webViews.map((el) => el.device)));
                            const pickedDevice = yield ui.pickDevice(filteredDevices);
                            if (!pickedDevice) {
                                return undefined;
                            }
                            device = pickedDevice;
                            const filtered = webViews.filter((el) => el.device === pickedDevice);
                            if (filtered.length < 1) {
                                return undefined;
                            }
                            if (filtered.length > 1) {
                                // Ask the user to select a webview
                                const pickedWebView = yield ui.pickWebView(webViews);
                                if (!pickedWebView) {
                                    return undefined;
                                }
                                webView = pickedWebView;
                            }
                            else {
                                webView = filtered[0];
                            }
                        }
                    }
                    else {
                        // Ask the user to select a connected device
                        const pickedDevice = yield ui.pickDevice(devices);
                        if (!pickedDevice) {
                            return undefined;
                        }
                        device = pickedDevice;
                    }
                }
                if (!webView) {
                    progress.report({ message: "Loading WebViews..." });
                    const webViews = yield withTimeoutRetries((_c = debugConfiguration.connectTimeout) !== null && _c !== void 0 ? _c : 0, 500, () => __awaiter(this, void 0, void 0, function* () {
                        // Find the running applications
                        const webViews = yield bridge.findWebViews(device);
                        if (webViews.length < 1) {
                            return undefined;
                        }
                        if (debugConfiguration.application) {
                            // Try to find the configured application
                            const filtered = webViews.filter((el) => el.packageName === debugConfiguration.application);
                            if (filtered.length < 1) {
                                return undefined;
                            }
                            return filtered;
                        }
                        else {
                            return webViews;
                        }
                    }));
                    if (!webViews || webViews.length < 1) {
                        vscode.window.showErrorMessage(`No matching WebViews found`);
                        return undefined;
                    }
                    // Ask the user to select a webview
                    const pickedWebView = yield ui.pickWebView(webViews);
                    if (!pickedWebView) {
                        return undefined;
                    }
                    webView = pickedWebView;
                }
                progress.report({ message: "Forwarding debugger..." });
                // Forward the debugger to the local port
                debugConfiguration.port = yield bridge.forwardDebugger(webView, debugConfiguration.port);
                debugConfiguration.browserAttachLocation = "workspace";
                // In case the old debugger is used and neither url and urlFilter are configured we are going to try and
                // retrieve the list of available pages. If more than one is available we will allow the user to choose one to debug.
                if (!useNewDebugger && !debugConfiguration.url && !debugConfiguration.urlFilter) {
                    try {
                        const pages = yield bridge.getWebViewPages(debugConfiguration.port);
                        if (pages.length > 1) {
                            const picked = yield ui.pickWebViewPage(pages);
                            if (!picked) {
                                return undefined;
                            }
                            debugConfiguration.websocketUrl = picked.webSocketDebuggerUrl;
                        }
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
                vscode.window.showInformationMessage(`Connected to ${(_d = webView.packageName) !== null && _d !== void 0 ? _d : "unknown"} on ${webView.device.serial}`);
                return debugConfiguration;
            }));
        });
    }
}
exports.DebugConfigurationProvider = DebugConfigurationProvider;
function withTimeoutRetries(timeout, interval, func) {
    const startTime = new Date().valueOf();
    const run = () => __awaiter(this, void 0, void 0, function* () {
        const result = yield func();
        if (result || startTime + timeout <= new Date().valueOf()) {
            return result;
        }
        yield new Promise((resolve) => setTimeout(resolve, interval));
        return run();
    });
    return run();
}
//# sourceMappingURL=debugConfigurationProvider.js.map