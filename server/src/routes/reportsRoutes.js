import express from "express";
import { 
    getReportsSummary, 
    getCandidatesReportList, 
    getCandidateDetailedReport 
} from "../controllers/reportsController.js";
// Assuming authenticate middleware exists
// import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Apply auth middleware if necessary
// router.use(authenticate);
// router.use(authorize('hr', 'admin'));

router.get("/summary", getReportsSummary);
router.get("/candidates", getCandidatesReportList);
router.get("/candidates/:id", getCandidateDetailedReport);

export default router;
