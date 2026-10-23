const express = require("express");
const mongoose = require("mongoose");
const Job = require("../models/Job");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();
// Treat user input as literal text, not a regex pattern
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
            search = "",
            location = "",
            jobType,
            page = "1",
            limit = "10"
        } = req.query;

        // Validate query parameter types and lengths
        if (
            typeof search !== "string" ||
            typeof location !== "string" ||
            search.length > 100 ||
            location.length > 100
        ) {
            return res.status(400).json({
                message: "Search and location must be strings of at most 100 characters"
            });
        }

        // Validate pagination
        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (
            !/^[1-9]\d*$/.test(String(page)) ||
            !/^[1-9]\d*$/.test(String(limit)) ||
            !Number.isSafeInteger(pageNumber) ||
            !Number.isSafeInteger(limitNumber) ||
            limitNumber > 50
        ) {
            return res.status(400).json({
                message: "Page must be positive and limit must be between 1 and 50"
            });
        }

        const filter = {};

        // Escape user input before constructing regex queries
        if (search.trim()) {
            const safeSearch = escapeRegex(search.trim());

            filter.$or = [
                { title: { $regex: safeSearch, $options: "i" } },
                { company: { $regex: safeSearch, $options: "i" } },
                { description: { $regex: safeSearch, $options: "i" } }
            ];
        }

        if (location.trim()) {
            filter.location = {
                $regex: escapeRegex(location.trim()),
                $options: "i"
            };
        }

        if (jobType !== undefined) {
            if (typeof jobType !== "string" || jobType.length > 50) {
                return res.status(400).json({
                    message: "Invalid job type"
                });
            }

            filter.jobType = jobType;
        }

        const skip = (pageNumber - 1) * limitNumber;

        const [jobs, totalJobs] = await Promise.all([
            Job.find(filter)
                .populate("postedBy", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber)
                .maxTimeMS(5000),

            Job.countDocuments(filter).maxTimeMS(5000)
        ]);

        res.json({
            jobs,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalJobs / limitNumber),
                totalJobs
            }
        });

    } catch (error) {
        if (error.code === 50 || error.name === "MongooseError") {
            return res.status(503).json({
                message: "Search took too long. Please try again."
            });
        }

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
