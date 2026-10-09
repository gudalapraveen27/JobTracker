const express = require("express");
const mongoose = require("mongoose");
const Job = require("../models/Job");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// CREATE JOB
router.post(
    "/",
    protect,
    authorizeRoles("recruiter", "admin"),
    async (req, res) => {
        try {
            const {
                title,
                company,
                location,
                description,
                requirements,
                salary,
                jobType,
                experience,
                skills
            } = req.body;

            // Validate required fields
            if (!title || !company || !location || !description) {
                return res.status(400).json({
                    message: "Title, company, location and description are required"
                });
            }

            // Create job
            const job = await Job.create({
                title,
                company,
                location,
                description,
                requirements: requirements || [],
                salary: salary || "Not specified",
                jobType: jobType || "Full-time",
                experience: experience || "Fresher",
                skills: skills || [],
                postedBy: req.user.userId
            });

            res.status(201).json({
                message: "Job created successfully",
                job
            });

        } catch (error) {
            if (error.name === "ValidationError" || error.name === "CastError") {
                return res.status(400).json({
                    message: "Invalid job details"
                });
            }

            console.error(error);

            res.status(500).json({
                message: "Server error"
            });
        }
    });

// GET ALL JOBS
router.get("/", async (req, res) => {
    try {
        const {
            search,
            location,
            jobType,
            page = 1,
            limit = 10
        } = req.query;

        // Build search filter
        const filter = {};

        // Search title, company or description
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { company: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        // Location filter
        if (location) {
            filter.location = {
                $regex: location,
                $options: "i"
            };
        }

        // Job type filter
        if (jobType) {
            filter.jobType = jobType;
        }

        // Pagination
        const skip = (page - 1) * limit;

        const jobs = await Job.find(filter)
            .populate("postedBy", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const totalJobs = await Job.countDocuments(filter);

        res.json({
            jobs,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(totalJobs / limit),
                totalJobs
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

// GET JOBS OWNED BY THE AUTHENTICATED RECRUITER
router.get(
    "/mine",
    protect,
    authorizeRoles("recruiter", "admin"),
    async (req, res) => {
        try {
            const jobs = await Job.find({
                postedBy: req.user.userId
            })
                .populate("postedBy", "name email")
                .sort({ createdAt: -1 });

            res.json({
                jobs
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Server error"
            });
        }
    }
);

// GET SINGLE JOB
router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid job ID"
            });
        }

        const job = await Job.findById(req.params.id)
            .populate("postedBy", "name email");

        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        res.json({
            job
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

router.put(
    "/:id",
    protect,
    authorizeRoles("recruiter", "admin"),
    async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    message: "Invalid job ID"
                });
            }

            const job = await Job.findById(req.params.id);

            if (!job) {
                return res.status(404).json({
                    message: "Job not found"
                });
            }

            if (job.postedBy.toString() !== req.user.userId) {
                return res.status(403).json({
                    message: "You are not allowed to update this job"
                });
            }

            const allowedFields = [
                "title",
                "company",
                "location",
                "description",
                "requirements",
                "salary",
                "jobType",
                "experience",
                "skills"
            ];
            const updates = {};

            allowedFields.forEach((field) => {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            });

            const updatedJob = await Job.findByIdAndUpdate(
                req.params.id,
                updates,
                {
                    new: true,
                    runValidators: true
                }
            );

            res.json({
                message: "Job updated successfully",
                job: updatedJob
            });

        } catch (error) {
            if (error.name === "ValidationError" || error.name === "CastError") {
                return res.status(400).json({
                    message: "Invalid job details"
                });
            }

            console.error(error);

            res.status(500).json({
                message: "Server error"
            });
        }
    });

router.delete(
    "/:id",
    protect,
    authorizeRoles("recruiter", "admin"),
    async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    message: "Invalid job ID"
                });
            }

            const job = await Job.findById(req.params.id);

            if (!job) {
                return res.status(404).json({
                    message: "Job not found"
                });
            }

            if (job.postedBy.toString() !== req.user.userId) {
                return res.status(403).json({
                    message: "You are not allowed to delete this job"
                });
            }

            await Job.findByIdAndDelete(req.params.id);

            res.json({
                message: "Job deleted successfully"
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Server error"
            });
        }
    });

module.exports = router;
