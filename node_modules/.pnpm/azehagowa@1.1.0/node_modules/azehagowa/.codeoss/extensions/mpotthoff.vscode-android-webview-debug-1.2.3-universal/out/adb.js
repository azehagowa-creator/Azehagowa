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
exports.unforward = exports.forward = exports.shell = exports.devices = exports.version = void 0;
const child_process = require("child_process");
function adb(options, ...args) {
    return new Promise((resolve, reject) => {
        let outBuff = Buffer.alloc(0);
        let errBuff = Buffer.alloc(0);
        const process = child_process.spawn(options.executable, [...options.arguments, ...args]);
        process.stdout.on("data", (data) => {
            outBuff = Buffer.concat([outBuff, Buffer.from(data)]);
        });
        process.stderr.on("data", (data) => {
            errBuff = Buffer.concat([errBuff, Buffer.from(data)]);
        });
        process.on("error", (err) => {
            reject(err);
        });
        process.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(errBuff.toString("UTF-8")));
            }
            resolve(outBuff.toString("UTF-8"));
        });
    });
}
function version(options) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield adb(options, "version");
    });
}
exports.version = version;
function devices(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const output = yield adb(options, "devices", "-l");
        const result = [];
        const regex = /^([a-zA-Z0-9_-]+(?:\s?[\.a-zA-Z0-9_-]+)?(?:\:\d{1,})?)\s+(device|connecting|offline|unknown|bootloader|recovery|download|unauthorized|host|no permissions)(?:(?:\s+usb:([^:]+))|(?:\s+([0-9]+\-[0-9]+(?:\.[0-9]+)*)))?(?:\s+product:([^:]+))?(?:\s+model\:([\S]+))?(?:\s+device\:([\S]+))?(?:\s+features:([^:]+))?(?:\s+transport_id:([^:]+))?$/gim;
        let match;
        while ((match = regex.exec(output)) !== null) {
            result.push({
                serial: match[1],
                state: match[2],
                usb: match[3] || match[4],
                product: match[5],
                model: match[6],
                device: match[7],
                features: match[8],
                transportId: match[9]
            });
        }
        return result;
    });
}
exports.devices = devices;
function shell(options) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield adb(options, "-s", options.serial, "shell", options.command);
    });
}
exports.shell = shell;
function forward(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const output = yield adb(options, "-s", options.serial, "forward", options.local, options.remote);
        if (options.local === "tcp:0") {
            return {
                local: `tcp:${parseInt(output.trim(), 10)}`,
                remote: options.remote
            };
        }
        else {
            return {
                local: options.local,
                remote: options.remote
            };
        }
    });
}
exports.forward = forward;
function unforward(options) {
    return __awaiter(this, void 0, void 0, function* () {
        yield adb(options, "forward", "--remove", options.local);
    });
}
exports.unforward = unforward;
//# sourceMappingURL=adb.js.map