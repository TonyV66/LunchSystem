import * as cron from "node-cron";
import { EmailReportService } from "./EmailReportService";
import { AppDataSource } from "../data-source";
import SchoolEntity from "../entity/SchoolEntity";
import School from "../models/School";

export class EmailSchedulerService {
  private static cronJob: cron.ScheduledTask | null = null;

  /**
   * Starts the email scheduler with a cron job that runs every hour on the hour
   * The EmailReportService will check if it's time to send reports based on school configuration
   */
  static async startScheduler(): Promise<void> {
    if (this.cronJob) {
      console.log("Email scheduler is already running");
      return;
    }

    // Run every hour on the hour
    this.cronJob = cron.schedule("0 * * * *", async () => {
      try {
        await EmailReportService.checkAndSendReports();
      } catch (error) {
        console.error("Error in email scheduler cron job:", error);
      }
    }, {
      timezone: "America/New_York" // Adjust timezone as needed
    });

    console.log("Email scheduler started - running every hour on the hour");
  }

  /**
   * Stops the email scheduler
   */
  static stopScheduler(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log("Email scheduler stopped");
    }
  }

} 