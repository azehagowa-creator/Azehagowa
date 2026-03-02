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
exports.executeTask = exports.findTask = void 0;
const vscode = require("vscode");
function findTask(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const tasks = yield vscode.tasks.fetchTasks();
        return tasks.find((task) => task.name === name);
    });
}
exports.findTask = findTask;
function executeTask(task) {
    return __awaiter(this, void 0, void 0, function* () {
        const activeTask = vscode.tasks.taskExecutions.find((t) => t.task.name === task.name);
        if (activeTask && activeTask.task.isBackground) {
            return true;
        }
        return new Promise((resolve, reject) => {
            let execution;
            vscode.tasks.executeTask(task).then((exec) => {
                execution = exec;
            });
            if (task.isBackground) {
                resolve(true);
            }
            else {
                const endEvent = vscode.tasks.onDidEndTask((e) => {
                    if (e.execution === execution) {
                        endEvent.dispose();
                        resolve(true);
                    }
                });
            }
        });
    });
}
exports.executeTask = executeTask;
//# sourceMappingURL=tasks.js.map