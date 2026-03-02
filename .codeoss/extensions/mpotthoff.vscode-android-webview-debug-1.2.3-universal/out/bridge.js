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
exports.getWebViewPages = exports.unforwardDebuggers = exports.forwardDebugger = exports.findWebViews = exports.findDevices = exports.test = void 0;
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const adb = require("./adb");
const http = require("./http");
function resolvePath(from) {
    const substituted = from.replace(/(?:^(~|\.{1,2}))(?=\/)|\$(\w+)/g, (_, tilde, env) => {
        var _a, _b, _c;
        // $HOME/adb -> /Users/<user>/adb
        if (env)
            return (_a = process.env[env]) !== null && _a !== void 0 ? _a : "";
        // ~/adb -> /Users/<user>/adb
        if (tilde === "~")
            return os.homedir();
        const fsPath = (_c = (_b = vscode.workspace.workspaceFolders) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.uri.fsPath;
        if (!fsPath)
            return "";
        // ./adb -> <workspace>/adb
        if (tilde === ".")
            return fsPath;
        // ../adb -> <workspace>/../adb
        if (tilde === "..")
            return fsPath + "/..";
        return "";
    });
    if (substituted.includes("/")) {
        // Resolve the path if it contains a path seperator.
        return path.resolve(substituted);
    }
    else {
        // Otherwise we treat it as a command that exists in PATH.
        return substituted;
    }
}
function getAdbExecutable() {
    const adbPath = vscode.workspace
        .getConfiguration("android-webview-debug")
        .get("adbPath");
    if (adbPath) {
        return resolvePath(adbPath);
    }
    else {
        return "adb";
    }
}
function getAdbArguments() {
    const adbArgs = vscode.workspace
        .getConfiguration("android-webview-debug")
        .get("adbArgs");
    if (adbArgs) {
        return adbArgs;
    }
    else {
        return [];
    }
}
function test() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield adb.version({
                executable: getAdbExecutable(),
                arguments: getAdbArguments()
            });
        }
        catch (err) {
            if (((_a = err) === null || _a === void 0 ? void 0 : _a.code) === "ENOENT") {
                throw new Error("Failed to locate ADB executable.");
            }
            throw err;
        }
    });
}
exports.test = test;
function findDevices() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield adb.devices({
            executable: getAdbExecutable(),
            arguments: getAdbArguments()
        });
    });
}
exports.findDevices = findDevices;
function getSockets(serial) {
    return __awaiter(this, void 0, void 0, function* () {
        const output = yield adb.shell({
            executable: getAdbExecutable(),
            arguments: getAdbArguments(),
            serial: serial,
            command: "cat /proc/net/unix"
        });
        /**
         * Parse 'cat /proc/net/unix' output which on Android looks like this:
         *
         * Num               RefCount Protocol Flags    Type St Inode Path
         * 0000000000000000: 00000002 00000000 00010000 0001 01 27955 /data/fpc/oem
         * 0000000000000000: 00000002 00000000 00010000 0001 01  3072 @chrome_devtools_remote
         *
         * We need to find records with paths starting from '@' (abstract socket)
         * and containing the channel pattern ("_devtools_remote").
         */
        const result = [];
        for (const line of output.split(/[\r\n]+/g)) {
            const columns = line.split(/\s+/g);
            if (columns.length < 8) {
                continue;
            }
            if (columns[3] !== "00010000" || columns[5] !== "01") {
                continue;
            }
            const colPath = columns[7];
            if (!colPath.startsWith("@") || !colPath.includes("_devtools_remote")) {
                continue;
            }
            result.push(colPath.substr(1));
        }
        return result;
    });
}
function getProcesses(serial) {
    return __awaiter(this, void 0, void 0, function* () {
        const output = yield adb.shell({
            executable: getAdbExecutable(),
            arguments: getAdbArguments(),
            serial: serial,
            command: "ps"
        });
        /**
         * Parse 'ps' output which on Android looks like this:
         *
         * USER       PID  PPID      VSZ     RSS  WCHAN  ADDR  S  NAME
         * root         1     0    24128    1752  0         0  S  init
         * u0_a100  22100  1307  1959228  128504  0         0  S  com.android.chrome
         */
        const result = [];
        for (const line of output.split(/[\r\n]+/g)) {
            const columns = line.split(/\s+/g);
            if (columns.length < 9) {
                continue;
            }
            const pid = parseInt(columns[1], 10);
            if (isNaN(pid)) {
                continue;
            }
            result.push({
                pid: pid,
                name: columns[8]
            });
        }
        return result;
    });
}
function getPackages(serial) {
    return __awaiter(this, void 0, void 0, function* () {
        const output = yield adb.shell({
            executable: getAdbExecutable(),
            arguments: getAdbArguments(),
            serial: serial,
            command: "dumpsys package packages"
        });
        /**
         * Parse 'dumpsys package packages' output which on Android looks like this:
         *
         * Packages:
         *   Package [com.android.chrome] (76d4737):
         *     userId=10100
         *     pkg=Package{3e86c27 com.android.chrome}
         *     codePath=/data/app/com.android.chrome-MMpc6mFfM3KpEYJ7RaZaTA==
         *     resourcePath=/data/app/com.android.chrome-MMpc6mFfM3KpEYJ7RaZaTA==
         *     legacyNativeLibraryDir=/data/app/com.android.chrome-MMpc6mFfM3KpEYJ7RaZaTA==/lib
         *     primaryCpuAbi=armeabi-v7a
         *     secondaryCpuAbi=arm64-v8a
         *     versionCode=344009152 minSdk=24 targetSdk=28
         *     versionName=68.0.3440.91
         */
        const result = [];
        let packageName;
        for (const line of output.split(/[\r\n]+/g)) {
            const columns = line.trim().split(/\s+/g);
            if (!packageName) {
                if (columns[0] === "Package") {
                    packageName = columns[1].substring(1, columns[1].length - 1);
                }
            }
            else {
                if (columns[0].startsWith("versionName=")) {
                    result.push({
                        packageName: packageName,
                        versionName: columns[0].substr(12)
                    });
                    packageName = undefined;
                }
            }
        }
        return result;
    });
}
function findWebViews(device) {
    return __awaiter(this, void 0, void 0, function* () {
        const [sockets, processes, packages] = yield Promise.all([
            getSockets(device.serial),
            getProcesses(device.serial),
            getPackages(device.serial)
        ]);
        const result = [];
        for (const socket of sockets) {
            let type;
            let packageName;
            let versionName;
            if (socket === "chrome_devtools_remote") {
                type = "chrome";
                packageName = "com.android.chrome";
            }
            else if (socket.startsWith("webview_devtools_remote_")) {
                type = "webview";
                const pid = parseInt(socket.substr(24), 10);
                if (!isNaN(pid)) {
                    const process = processes.find((el) => el.pid === pid);
                    if (process) {
                        packageName = process.name;
                    }
                }
            }
            else if (socket.endsWith("_devtools_remote")) {
                type = "crosswalk";
                packageName = socket.substring(0, socket.length - 16) || undefined;
            }
            else {
                type = "unknown";
            }
            if (packageName) {
                const aPackage = packages.find((el) => el.packageName === packageName);
                if (aPackage) {
                    versionName = aPackage.versionName;
                }
            }
            result.push({
                device: device,
                socket: socket,
                type: type,
                packageName: packageName,
                versionName: versionName
            });
        }
        return result;
    });
}
exports.findWebViews = findWebViews;
const forwardedSockets = [];
function forwardDebugger(application, port) {
    return __awaiter(this, void 0, void 0, function* () {
        if (port) {
            const idx = forwardedSockets.findIndex((el) => el.local === `tcp:${port}`);
            if (idx >= 0) {
                forwardedSockets.splice(idx, 1);
                try {
                    yield adb.unforward({
                        executable: getAdbExecutable(),
                        arguments: getAdbArguments(),
                        local: `tcp:${port}`
                    });
                }
                catch (_a) {
                    // Ignore
                }
            }
        }
        const socket = yield adb.forward({
            executable: getAdbExecutable(),
            arguments: getAdbArguments(),
            serial: application.device.serial,
            local: `tcp:${port || 0}`,
            remote: `localabstract:${application.socket}`
        });
        forwardedSockets.push(socket);
        return parseInt(socket.local.substr(4), 10);
    });
}
exports.forwardDebugger = forwardDebugger;
function unforwardDebuggers() {
    return __awaiter(this, void 0, void 0, function* () {
        const promises = [];
        for (const socket of forwardedSockets) {
            const promise = adb.unforward({
                executable: getAdbExecutable(),
                arguments: getAdbArguments(),
                local: socket.local
            });
            promises.push(promise.catch(() => { }));
        }
        yield Promise.all(promises);
        forwardedSockets.splice(0);
    });
}
exports.unforwardDebuggers = unforwardDebuggers;
function getWebViewPages(port) {
    return __awaiter(this, void 0, void 0, function* () {
        return JSON.parse(yield http.get(`http://127.0.0.1:${port}/json/list`));
    });
}
exports.getWebViewPages = getWebViewPages;
//# sourceMappingURL=bridge.js.map