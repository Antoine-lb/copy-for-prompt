"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function activate(context) {
    let disposable = vscode.commands.registerCommand("extension.copyForPrompt", async (uri) => {
        try {
            const stat = await fs.promises.stat(uri.fsPath);
            if (stat.isDirectory()) {
                const folderContent = await processFolderWithTree(uri);
                await vscode.env.clipboard.writeText(folderContent);
                vscode.window.showInformationMessage("Folder content copied to clipboard!");
            }
            else if (stat.isFile()) {
                const fileContent = await processFile(uri);
                await vscode.env.clipboard.writeText(fileContent);
                vscode.window.showInformationMessage("File content copied to clipboard!");
            }
        }
        catch (error) {
            vscode.window.showErrorMessage("Failed to copy content: " + error.message);
        }
    });
    context.subscriptions.push(disposable);
}
async function processFolderWithTree(folderUri) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(folderUri);
    const folderPath = folderUri.fsPath;
    const relativeFolderPath = workspaceFolder
        ? path.relative(workspaceFolder.uri.fsPath, folderPath)
        : folderPath;
    // Generate folder tree
    const folderTree = await generateFileTree(folderPath);
    let result = `================================================\nFolder: ${relativeFolderPath}\n================================================\n`;
    result += `Directory structure:\n${folderTree}\n\n`;
    // Process folder content recursively
    const content = await processFolderRecursively(folderUri);
    result += content;
    // Add "end of folder" marker
    result += `================================================\nEnd of Folder: ${relativeFolderPath}\n================================================\n`;
    return result;
}
async function generateFileTree(folderPath, prefix = "") {
    const entries = await fs.promises.readdir(folderPath, {
        withFileTypes: true,
    });
    const treeParts = [];
    const total = entries.length;
    for (let i = 0; i < total; i++) {
        const entry = entries[i];
        const isLast = i === total - 1;
        const entryPath = path.join(folderPath, entry.name);
        const linePrefix = isLast ? "└── " : "├── ";
        const subPrefix = isLast ? "    " : "│   ";
        if (entry.isDirectory()) {
            treeParts.push(`${prefix}${linePrefix}${entry.name}`);
            const subTree = await generateFileTree(entryPath, prefix + subPrefix);
            treeParts.push(subTree);
        }
        else if (entry.isFile()) {
            treeParts.push(`${prefix}${linePrefix}${entry.name}`);
        }
    }
    return treeParts.join("\n");
}
async function processFolderRecursively(folderUri) {
    const entries = await fs.promises.readdir(folderUri.fsPath, {
        withFileTypes: true,
    });
    let content = "";
    for (const entry of entries) {
        const entryPath = path.join(folderUri.fsPath, entry.name);
        const entryUri = vscode.Uri.file(entryPath);
        if (entry.isDirectory()) {
            // Process subfolder recursively
            content += await processFolderRecursively(entryUri);
        }
        else if (entry.isFile()) {
            // Process file
            content += await processFile(entryUri);
        }
    }
    return content;
}
async function processFile(fileUri) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
    const relativeFilePath = workspaceFolder
        ? path.relative(workspaceFolder.uri.fsPath, fileUri.fsPath)
        : fileUri.fsPath;
    const fileContent = await fs.promises.readFile(fileUri.fsPath, "utf-8");
    const header = `================================================\nFile: ${relativeFilePath}\n================================================\n`;
    return `${header}${fileContent}\n\n`;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map