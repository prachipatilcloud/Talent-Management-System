import mongoose from "mongoose";
import dotenv from "dotenv";
import Candidate from "../models/Candidate.js"; // adjust path if needed

dotenv.config({ path: "./.env" });

// 🔌 Connect DB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/tm_system";
    await mongoose.connect(mongoUri);
    console.log("MongoDB Connected to:", mongoUri);
  } catch (error) {
    console.error("DB Connection Error:", error);
    process.exit(1);
  }
};

// 🎲 Helper functions
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generatePhone = () => {
  return "9" + Math.floor(100000000 + Math.random() * 900000000);
};

const randomRating = () => Math.floor(Math.random() * 10) + 1;

const randomDate = () => new Date(Date.now() - Math.random() * 10000000000);

// 🧠 Dummy Data Pools
const firstNames = ["Amit", "Priya", "Rahul", "Sneha", "Karan", "Neha", "Rupesh", "Lakshita", "Sai", "Jay", "Ananya"];
const lastNames = ["Sharma", "Patel", "Verma", "Gupta", "Yadav", "Jain", "Shiva", "Desai", "Mehta"];
const skillsPool = ["React", "Node.js", "MongoDB", "Express", "Python", "Java", "MUI", "Tailwind", "PostgreSQL", "Docker"];
const roles = ["Frontend Developer", "Backend Developer", "Full Stack Developer", "UI/UX Designer", "Database Administrator"];
const statuses = ['Applied', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected', 'On Hold', 'Talent Pool'];
const recommendations = ['Shortlisted', 'On-hold', 'Rejected-Poor Rating'];

// 🏗️ Generate Candidates
const generateCandidates = (count = 10) => {
  const candidates = [];

  for (let i = 0; i < count; i++) {
    const firstName = getRandom(firstNames);
    const lastName = getRandom(lastNames);
    const jobRole = getRandom(roles);

    const candidate = {
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}${i}${Math.floor(Math.random() * 1000)}@example.com`,
      phone: generatePhone(),

      skills: [getRandom(skillsPool), getRandom(skillsPool), getRandom(skillsPool)],
      experience: Math.floor(Math.random() * 8) + 1,
      jobRole: jobRole,

      github: "https://github.com/sample",
      linkedin: "https://linkedin.com/in/sample",
      portfolio: "https://portfolio.com",

      resume: {
        fileName: `resume_${i}.pdf`,
        driveFileId: `drive_id_${i}`,
        url: `https://drive.google.com/file/d/${i}`
      },

      status: getRandom(statuses),

      clientFeedback: [
        {
          interviewerName: "HR Manager",
          interviewDateTime: new Date(),
          positionAppliedFor: jobRole,
          interviewStage: "HR Round",
          educationalBackground: randomRating(),
          priorWorkExperience: randomRating(),
          technicalQualifications: randomRating(),
          verbalCommunication: randomRating(),
          candidateInterest: randomRating(),
          teambuildingSkills: randomRating(),
          overallRating: randomRating(),
          detailedComments: "Good candidate with solid foundations.",
          overallRecommendation: getRandom(recommendations),
          keyStrengths: "Communication and logical thinking",
          areasForImprovement: "Advanced System Design",
        }
      ],

      interviewRounds: [
        {
          roundName: "Technical Round 1",
          interviewers: [],
          scheduledDate: randomDate(),
          interviewMode: "Remote",
          status: "passed",
          feedback: {
            interviewerName: "Tech Lead",
            interviewDateTime: new Date(),
            positionAppliedFor: jobRole,
            interviewStage: "Technical Round 1",
            educationalBackground: randomRating(),
            priorWorkExperience: randomRating(),
            technicalQualifications: randomRating(),
            verbalCommunication: randomRating(),
            candidateInterest: randomRating(),
            teambuildingSkills: randomRating(),
            overallRating: randomRating(),
            detailedComments: "Strong technical knowledge.",
            overallRecommendation: "Shortlisted",
            keyStrengths: getRandom(skillsPool),
            areasForImprovement: "None",
            submittedAt: new Date(),
          }
        },
        {
          roundName: "Technical Round 2",
          interviewers: [],
          scheduledDate: randomDate(),
          interviewMode: "Remote",
          status: "passed",
          feedback: {
            interviewerName: "Senior Architect",
            interviewDateTime: new Date(),
            positionAppliedFor: jobRole,
            interviewStage: "Technical Round 2",
            educationalBackground: randomRating(),
            priorWorkExperience: randomRating(),
            technicalQualifications: randomRating(),
            verbalCommunication: randomRating(),
            candidateInterest: randomRating(),
            teambuildingSkills: randomRating(),
            overallRating: randomRating(),
            detailedComments: "Excellent problem solver.",
            overallRecommendation: "Shortlisted",
            keyStrengths: "Architecture Design",
            areasForImprovement: "Unit testing",
            submittedAt: new Date(),
          }
        }
      ],

      addedBy: new mongoose.Types.ObjectId(), // Placeholder User ID

      parsedResumeData: {
        name: `${firstName} ${lastName}`,
        aiExtractedSkills: [getRandom(skillsPool)],
        aiExtractedExperience: [
          {
            company: "ABC Corp",
            role: "Developer",
            duration: "2 years",
            description: "Worked on backend scaling",
            skills_used: ["Node.js"]
          }
        ],
        aiExtractedProjects: [
          {
            name: "Project X",
            description: "MERN App",
            skills_used: ["React", "MongoDB"],
            github_link: "https://github.com/sample/project",
            live_demo: "https://project.com"
          }
        ],
        targetRole: jobRole,
        parsedAt: new Date()
      },

      skillsSources: {
        manual: [getRandom(skillsPool)],
        parsed: [getRandom(skillsPool)]
      },

      hasParseData: true
    };

    candidates.push(candidate);
  }

  return candidates;
};

// 🚀 Seeder Function
const seedCandidates = async () => {
  try {
    await connectDB();

    // ⚠️ Reset mode
    await Candidate.deleteMany();
    console.log("Existing candidates removed");

    const candidates = generateCandidates(15);

    await Candidate.insertMany(candidates);

    console.log("Dummy candidates inserted successfully");
    process.exit();
  } catch (error) {
    console.error("Seeder Error:", error);
    process.exit(1);
  }
};

seedCandidates();
