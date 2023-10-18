import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('extension.copyPasta', async (fileUri: vscode.Uri, allFileUris: vscode.Uri[]) => {

    const files = Array.isArray(allFileUris) ? allFileUris : (fileUri ? [fileUri] : []);
    
    if (files.length === 0) {
      vscode.window.showInformationMessage('No file(s) selected.');
      return;
    }

    let result = '';
    let workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

    for (const file of files) {
      let filePath = file.fsPath;

      if (fs.lstatSync(filePath).isDirectory()) {
        const folderFiles = fs.readdirSync(filePath).map((filename) => path.join(filePath, filename));
        for (const folderFile of folderFiles) {
          if (fs.lstatSync(folderFile).isFile()) {
            const content = getContent(folderFile);
            result += `${relativePath(workspacePath, folderFile)}:\n---\n\n${content}\n---\n\n`;
          }
        }
        continue;
      }

      const content = getContent(filePath);
      result += `${relativePath(workspacePath, filePath)}:\n---\n\n${content}\n---\n\n`;
    }

    await vscode.env.clipboard.writeText(result);
    vscode.window.showInformationMessage('Text has been copied to clipboard.');
  });

  context.subscriptions.push(disposable);
}

function getContent(filePath: string): string {
  try {
    const buffer = fs.readFileSync(filePath);
    if (buffer.length > 5000) {
      return 'too big';
    }

    const content = buffer.toString('utf-8');

    if (isText(content)) {
      return content;
    } else {
      return 'not text';
    }
  } catch (error) {
    return 'unreadable';
  }
}

function isText(content: string): boolean {
  return /^[\x20-\x7E\s]*$/.test(content);
}

function relativePath(workspacePath: string, filePath: string): string {
  return workspacePath ? path.relative(workspacePath, filePath) : path.basename(filePath);
}
