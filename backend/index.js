const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");
const cartRoutes = require("./routes/cartRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const productRoutes = require("./routes/productRoutes");
const errorHandler = require("./middleware/errorHandler");

dotenv.config();

const app = express();

// Basic security headers
app.use(helmet());

// Compress responses
app.use(compression());

// Trust proxy if behind one (e.g., when deployed)
app.set("trust proxy", 1);

// Rate limiter - apply globally
const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: Number(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Request logging
if (process.env.NODE_ENV === "production") {
    app.use(morgan("combined"));
} else {
    app.use(morgan("dev"));
}

// CORS whitelist handling
const rawWhitelist = process.env.CORS_WHITELIST || process.env.CLIENT_URL || "";
const whitelist = rawWhitelist.split(",").map((s) => s.trim()).filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (whitelist.length === 0) return callback(null, true);
        if (whitelist.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        const msg = "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Body parser
app.use(express.json());

// Routes (unchanged)
app.use("/user", userRoutes);
app.use("/profile", profileRoutes);
app.use("/cart", cartRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/products", productRoutes);
app.use("/uploads", express.static("uploads"));

// Centralized error handler (must be after routes)
app.use(errorHandler);

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");

        app.listen(process.env.PORT || 8000, () => {
            console.log("Server Running");
        });
    })
    .catch((err) => {
        console.error(err);
    });