import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    recommendation: {
        type: String,
        enum: ['Hire', 'No Hire', 'Maybe']
    },
    comments: {
        type: String,
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    submittedAt: {
        type: Date
    }
})

const interviewRoundSchema = new mongoose.Schema({
    roundName: {
        type: String,
        required: true,
    },
    interviewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: [],
    }],
    scheduledDate: {
        type: Date,
        default: null
    },
    interviewMode: {
        type: String,
        enum: ['In-office', 'Remote'],
        default: 'In-office'
    },
    interviewLink: {
        type: String,
        default: null,
    },
    rescheduledDate: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'passed', 'rejected'],
        default: 'pending'
    },
    officeLocation: {
        type: String,
        default: null
    },
    notes: {
        type: String,
        default: null
    },
    tags: {
        type: [String],
        default: []
    },
    notesAddedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    notesAddedAt: {
        type: Date,
        default: null,
    },
    feedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },
        comments: {
            type: String,
            default: null,
        },
        recommendation: {
            type: String,
            enum: ['Hire', 'No Hire', 'Maybe', null],
            default: null
        },
        submittedAt: { type: Date, default: null },
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    }
}, {
    _id: true
})

const candidateSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
        trim: true
    },
    phone: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^[6-9]\d{9}$/.test(v);
            },
            message: "Invalid phone number"
        }
    },

    //Professional Details

    skills: {
        type: [String],
        required: true,
    },

    experience: {
        type: Number,
        required: true,
    },
    jobRole: {
        type: String,
        required: true,
        trim: true,
    },
    resume: {
        fileName: {
            type: String,
            required: true,
            // default: null,
        },
        driveFileId: {
            type: String,
            required: true,
            // default: null,
        },
        url: {
            type: String,
            required: true,
            // default: null
        }
    },

    //Status
    status: {
        type: String,
        enum: ['Applied', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected', 'On Hold', 'Talent Pool'],
        default: 'Applied'
    },

    // Interview Rounds (embedded)
    interviewRounds: [interviewRoundSchema],

    // Meta
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true          // which HR added this candidate
    },

    // ✅ Parsed Resume Data Integration
    parsedResumeData: {
        name: {
            type: String,
            default: null
        },
        aiExtractedSkills: {
            type: [String],
            default: []
        },
        aiExtractedExperience: [{
            company: {
                type: String,
                default: null
            },
            role: {
                type: String,
                default: null
            },
            duration: {
                type: String,
                default: null
            },
            description: {
                type: String,
                default: null
            },
            skills_used: {
                type: [String],
                default: []
            }
        }],
        aiExtractedProjects: [{
            name: {
                type: String,
                default: null
            },
            description: {
                type: String,
                default: null
            },
            skills_used: {
                type: [String],
                default: []
            }
        }],
        targetRole: {
            type: String,
            default: null
        },
        parsedAt: {
            type: Date,
            default: null
        }
    },

    // ✅ Skill Sources Tracking
    skillsSources: {
        manual: {
            type: [String],
            default: []
        },
        parsed: {
            type: [String],
            default: []
        }
    },

    // ✅ Flag for Parsed Data Availability
    hasParseData: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

candidateSchema.index({ skills: 1 });
candidateSchema.index({ jobRole: 1 });
candidateSchema.index({ status: 1 });
candidateSchema.index({ firstName: 'text', lastName: 'text', skills: 'text', jobRole: 'text' });
candidateSchema.index({ 'skillsSources.manual': 1 });
candidateSchema.index({ 'skillsSources.parsed': 1 });
candidateSchema.index({ hasParseData: 1 });

// candidateSchema.methods.getExperienceLevel = function () {
//   if (this.experience < 2) return 'Junior';
//   if (this.experience < 5) return 'Mid-Level';
//   if (this.experience < 10) return 'Senior';
//   return 'Lead';
// };

export default mongoose.model('Candidate', candidateSchema);