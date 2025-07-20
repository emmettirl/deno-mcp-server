import * as vscode from "vscode";
import { UpdateConfiguration } from "../config/UpdateConfiguration";

/**
 * Manages scheduling of background update checks
 */
export class UpdateScheduler {
  private readonly outputChannel: vscode.OutputChannel;
  private readonly config: UpdateConfiguration;
  private scheduledTimeout?: NodeJS.Timeout;

  constructor(
    outputChannel: vscode.OutputChannel,
    config: UpdateConfiguration,
  ) {
    this.outputChannel = outputChannel;
    this.config = config;
  }

  /**
   * Schedule background update checks based on configuration
   */
  public async scheduleBackgroundChecks(
    updateCheckCallback: () => Promise<void>,
  ): Promise<void> {
    const checkInterval = this.config.getCheckInterval();

    if (checkInterval === "manual") {
      this.outputChannel.appendLine(
        "Background update checks disabled (manual mode)",
      );
      return;
    }

    const intervalMs = this.config.getIntervalMs(checkInterval);

    if (intervalMs <= 0) {
      this.outputChannel.appendLine(
        `Invalid update interval: ${checkInterval}`,
      );
      return;
    }

    this.outputChannel.appendLine(
      `Scheduling background update checks every ${checkInterval} (${intervalMs}ms)`,
    );

    // Clear any existing scheduled check
    this.clearScheduledCheck();

    // Schedule the next check
    this.scheduledTimeout = setTimeout(async () => {
      try {
        this.outputChannel.appendLine("Running scheduled update check...");
        await updateCheckCallback();

        // Reschedule for the next interval
        await this.scheduleBackgroundChecks(updateCheckCallback);
      } catch (error) {
        // Silent fail for background checks, but log the error
        this.outputChannel.appendLine(
          `Background update check failed: ${error}`,
        );

        // Reschedule even after failure
        await this.scheduleBackgroundChecks(updateCheckCallback);
      }
    }, intervalMs);
  }

  /**
   * Cancel any scheduled background checks
   */
  public clearScheduledCheck(): void {
    if (this.scheduledTimeout) {
      clearTimeout(this.scheduledTimeout);
      this.scheduledTimeout = undefined;
      this.outputChannel.appendLine("Cancelled scheduled update check");
    }
  }

  /**
   * Check if there's a scheduled background check
   */
  public hasScheduledCheck(): boolean {
    return this.scheduledTimeout !== undefined;
  }

  /**
   * Get the configured check interval
   */
  public getCheckInterval(): string {
    return this.config.getCheckInterval();
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.clearScheduledCheck();
  }
}
