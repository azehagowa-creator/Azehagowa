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
exports.pickWebViewPage = exports.pickWebView = exports.pickDevice = void 0;
const vscode = require("vscode");
function pickDevice(devices) {
    return __awaiter(this, void 0, void 0, function* () {
        const items = devices.map((device) => {
            return {
                label: device.model || device.state,
                description: device.serial,
                device: device
            };
        });
        const item = yield vscode.window.showQuickPick(items, {
            placeHolder: "Select a device"
        });
        if (!item) {
            return undefined;
        }
        return item.device;
    });
}
exports.pickDevice = pickDevice;
function pickWebView(webViews) {
    return __awaiter(this, void 0, void 0, function* () {
        const items = webViews.map((application) => {
            let label;
            if (application.type === "chrome") {
                label = "Chrome";
            }
            else {
                if (application.type === "webview") {
                    label = "WebView ";
                }
                else if (application.type === "crosswalk") {
                    label = "Crosswalk ";
                }
                else {
                    label = "";
                }
                if (application.packageName) {
                    label += application.packageName;
                }
                else {
                    label += application.socket;
                }
            }
            return {
                label: label,
                description: application.versionName,
                webView: application
            };
        });
        const item = yield vscode.window.showQuickPick(items, {
            placeHolder: "Select a WebView"
        });
        if (!item) {
            return undefined;
        }
        return item.webView;
    });
}
exports.pickWebView = pickWebView;
function pickWebViewPage(pages) {
    return __awaiter(this, void 0, void 0, function* () {
        const items = pages.map((page) => {
            return {
                label: page.title,
                description: page.url,
                page: page
            };
        });
        const item = yield vscode.window.showQuickPick(items, {
            placeHolder: "Select a page"
        });
        if (!item) {
            return undefined;
        }
        return item.page;
    });
}
exports.pickWebViewPage = pickWebViewPage;
//# sourceMappingURL=ui.js.map