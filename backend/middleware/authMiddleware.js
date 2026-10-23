
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Not authorized. No token provided."
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Load the current user and role from MongoDB
        const user = await User.findById(decoded.userId)
            .select("_id role");

        if (!user) {
            return res.status(401).json({
                message: "Not authorized. User not found."
            });
        }

        // Use the current database role, not the token's role
        req.user = {
            userId: user._id.toString(),
            role: user.role
        };

        next();

    } catch (error) {
        if (error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError" ||
            error.name === "NotBeforeError") {
            return res.status(401).json({
                message: "Not authorized. Invalid token."
            });
        }

        console.error("Authentication error:", error);

        return res.status(500).json({
            message: "Authentication service error."
        });
    }
};

module.exports = protect;
