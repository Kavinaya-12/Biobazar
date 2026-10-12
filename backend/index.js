const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured in production.");
}
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
const adminRoutes = require("./routes/adminRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Basic security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

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
if (process.env.NODE_ENV === "production" && whitelist.length === 0) {
    throw new Error("CORS_WHITELIST or CLIENT_URL must be configured in production.");
}

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
app.use("/admin", adminRoutes);
app.use("/seller", sellerRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Centralized error handler (must be after routes)
app.use(errorHandler);

const requestedPort = Number(process.env.PORT) || 8001;

if (process.env.NODE_ENV === "production" && !process.env.MONGO_URI) {
    throw new Error("MONGO_URI must be configured in production.");
}

const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`Server Running on port ${port}`);
    });

    server.on("error", (error) => {
        if (error.code === "EADDRINUSE" && port === requestedPort) {
            const fallbackPort = port + 1;
            console.warn(`Port ${port} is busy. Retrying on ${fallbackPort}.`);
            startServer(fallbackPort);
            return;
        }

        console.error(error);
    });
};

mongoose
    .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/biobazaar")
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err.message);
    });

startServer(requestedPort);
