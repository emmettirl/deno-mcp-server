import * as vscode from "vscode";

/**
 * Manages update downloading and installation
 */
export class UpdateDownloader {
  private readonly outputChannel: vscode.OutputChannel;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
  }

  /**
   * Initiate download of update
   * Currently opens the download URL in the browser
   * In a future version, could implement direct download
   */
  public async initiateDownload(
    downloadUrl: string,
    version: string,
  ): Promise<void> {
    this.outputChannel.appendLine(`Starting download of v${version}...`);

    try {
      // Open the download URL in the browser for now
      // In a future version, we could implement direct download
      await vscode.env.openExternal(vscode.Uri.parse(downloadUrl));

      this.outputChannel.appendLine(
        `Download URL opened: ${downloadUrl}`,
      );
    } catch (error) {
      this.outputChannel.appendLine(
        `Failed to open download URL: ${error}`,
      );
      throw new Error(`Failed to initiate download: ${error}`);
    }
  }

  /**
   * Open GitHub release page in browser
   */
  public async openReleasePage(releaseUrl: string): Promise<void> {
    try {
      await vscode.env.openExternal(vscode.Uri.parse(releaseUrl));
      this.outputChannel.appendLine(`Opened release page: ${releaseUrl}`);
    } catch (error) {
      this.outputChannel.appendLine(
        `Failed to open release page: ${error}`,
      );
      throw new Error(`Failed to open release page: ${error}`);
    }
  }

  // Future: Direct download implementation
  // private async downloadFileDirectly(url: string, filename: string): Promise<string> {
  //   // Implementation for direct file download
  //   // Would save to VS Code's extension storage or user's download folder
  // }
}
