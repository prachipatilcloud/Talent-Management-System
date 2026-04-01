import express from "express";
import { searchParsedResumes } from "../controllers/resumeController.js";

const router = express.Router();

router.get("/search-resumes", searchParsedResumes);

export default router;