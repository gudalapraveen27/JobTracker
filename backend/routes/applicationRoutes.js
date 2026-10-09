const express = require("express");
const mongoose = require("mongoose");
const Application = require("../models/Application");
const Job = require("../models/Job");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// GET MY APPLICATIONS
router.get(
    "/my",
    protect,
    authorizeRoles("jobseeker"),
    async (req, res) => {
        try {
            const applications = await Application.find({
                applicant: req.user.userId
            })
                .populate("job", "title company location jobType salary")
                .sort({ createdAt: -1 });

            res.json({
                applications
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Server error"
            });
        }
    });

// GET APPLICATIONS FOR RECRUITER'S JOBS
router.get(
    "/recruiter",
    protect,
    authorizeRoles("recruiter", "admin"),
    async (req, res) => {
        try {
            const jobs = await Job.find({
                postedBy: req.user.userId
            }).select("_id");

            const jobIds = jobs.map((job) => job._id);

            const applications = await Application.find({
                job: { $in: jobIds }
            })
                .populate("job", "title company location")
                .populate("applicant", "name email")
                .sort({ createdAt: -1 });

            res.json({
                applications
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Server error"
            });
        }
    });

// UPDATE APPLICATION STATUS
router.put(
    "/:applicationId/status",
    protect,
    authorizeRoles("recruiter", "admin"),
    async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.applicationId)) {
                return res.status(400).json({
                    message: "Invalid application ID"
                });
            }

            const { status } = req.body;

            const allowedStatuses = [
                "Applied",
                "Reviewing",
                "Shortlisted",
                "Rejected"
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid application status"
                });
            }

            const application = await Application.findById(
                req.params.applicationId
            ).populate("job");

            if (!application) {
                return res.status(404).json({
                    message: "Application not found"
                });
            }

            if (!application.job) {
                return res.status(404).json({
                    message: "Job not found"
                });
            }

            // Make sure the logged-in user owns the job
            if (
                application.job.postedBy.toString() !==
                req.user.userId
            ) {
                return res.status(403).json({
                    message: "You are not allowed to update this application"
                });
            }

            application.status = status;

            await application.save();

            res.json({
                message: "Application status updated successfully",
                application
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Server error"
            });
        }
    });

// APPLY FOR A JOB
router.post(
    "/:jobId",
    protect,
    authorizeRoles("jobseeker"),
    async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
                return res.status(400).json({
                    message: "Invalid job ID"
                });
            }

            const { coverLetter } = req.body;

            const job = await Job.findById(req.params.jobId);

            if (!job) {
                return res.status(404).json({
                    message: "Job not found"
                });
            }

            // Check if user already applied
            const existingApplication = await Application.findOne({
                job: req.params.jobId,
                applicant: req.user.userId
            });

            if (existingApplication) {
                return res.status(400).json({
                    message: "You have already applied for this job"
                });
            }

            const application = await Application.create({
                job: req.params.jobId,
                applicant: req.user.userId,
                coverLetter: coverLetter || ""
            });

            res.status(201).json({
                message: "Application submitted successfully",
                application
            });

        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({
                    message: "You have already applied for this job"
                });
            }

            if (error.name === "ValidationError" || error.name === "CastError") {
                return res.status(400).json({
                    message: "Invalid application details"
                });
            }

            console.error(error);

            res.status(500).json({
                message: "Server error"
            });
        }
    });

module.exports = router;
