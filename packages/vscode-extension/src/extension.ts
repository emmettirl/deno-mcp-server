// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
  activate as activateExtension,
  deactivate as deactivateExtension,
} from "./lifecycle/activation";

// Export the activate and deactivate functions
export const activate = activateExtension;
export const deactivate = deactivateExtension;
