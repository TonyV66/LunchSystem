import express from "express";
import { AppDataSource } from "../data-source";
import SchoolEntity from "../entity/SchoolEntity";
import { EmailReportService } from "../services/EmailReportService";

const router = express.Router();



// Test endpoint to manually trigger email sending
router.get("/test-email-reports/:schoolId", async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    // const date = req.body.date;
    
    try {
      // Get school configuration
      const schoolRepository = AppDataSource.getRepository(SchoolEntity);
      const schoolEntity = await schoolRepository.findOne({ where: { id: schoolId } });
      
      await EmailReportService.sendClassroomReports(schoolEntity!, ['2025-08-11', '2025-08-12']);
    } catch (error) {
      console.error("Error in sendReportsForDate:", error);
    }

    
    res.json({ 
      success: true, 
      message: `Test email reports sent for date: 2025-08-11` 
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      error: "Failed to send test email reports",
      details: errorMessage,
    });
  }
});

// Test endpoint to manually trigger the check and send process
router.post("/test-check-and-send/:schoolId", async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    await EmailReportService.checkAndSendReports(schoolId);
    
    res.json({ 
      success: true, 
      message: "Test check and send process completed" 
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      error: "Failed to run test check and send process",
      details: errorMessage,
    });
  }
});

export default router;
