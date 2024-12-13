import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension.copyForPrompt",
    async (uri: vscode.Uri) => {
      try {
        const stat = await fs.promises.stat(uri.fsPath);

        if (stat.isDirectory()) {
          const folderContent = await processFolderWithTree(uri);
          await vscode.env.clipboard.writeText(folderContent);
          vscode.window.showInformationMessage(
            "Folder content copied to clipboard!"
          );
        } else if (stat.isFile()) {
          const fileContent = await processFile(uri);
          await vscode.env.clipboard.writeText(fileContent);
          vscode.window.showInformationMessage(
            "File content copied to clipboard!"
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          "Failed to copy content: " + error.message
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

async function processFolderWithTree(folderUri: vscode.Uri): Promise<string> {
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

async function generateFileTree(
  folderPath: string,
  prefix: string = ""
): Promise<string> {
  const entries = await fs.promises.readdir(folderPath, {
    withFileTypes: true,
  });
  const treeParts: string[] = [];
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
    } else if (entry.isFile()) {
      treeParts.push(`${prefix}${linePrefix}${entry.name}`);
    }
  }

  return treeParts.join("\n");
}

async function processFolderRecursively(
  folderUri: vscode.Uri
): Promise<string> {
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
    } else if (entry.isFile()) {
      // Process file
      content += await processFile(entryUri);
    }
  }

  return content;
}

async function processFile(fileUri: vscode.Uri): Promise<string> {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
  const relativeFilePath = workspaceFolder
    ? path.relative(workspaceFolder.uri.fsPath, fileUri.fsPath)
    : fileUri.fsPath;

  const fileContent = await fs.promises.readFile(fileUri.fsPath, "utf-8");
  const header = `================================================\nFile: ${relativeFilePath}\n================================================\n`;

  return `${header}${fileContent}\n\n`;
}

export function deactivate() {}
