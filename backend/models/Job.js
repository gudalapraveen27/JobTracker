const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        company: {
            type: String,
            required: true,
            trim: true
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },

        requirements: {
            type: [String],
            default: []
        },

        salary: {
            type: String,
            default: "Not specified"
        },

        jobType: {
            type: String,
            enum: [
                "Full-time",
                "Part-time",
                "Internship",
                "Contract"
            ],
            default: "Full-time"
        },

        experience: {
            type: String,
            default: "Fresher"
        },

        skills: {
            type: [String],
            default: []
        },

        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Job", jobSchema);