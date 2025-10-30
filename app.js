import express from "express";
import "dotenv/config";
import connectDB from "./config/connection.js";
import userRoutes from "./routes/userRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import cors from "cors";
import jwt from "jsonwebtoken";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://physio.insigntechsolutions.com",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "Content-Type", "Accept", "Authorization"],
  credentials: true,
};

// Apply CORS middleware globally
app.use(cors(corsOptions));

// ✅ Explicitly handle preflight requests
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 7000;

app.get("/", (req, res) => {
  res.send("Hello Physio !");
});

app.use("/user", userRoutes);
app.use("/patients", patientRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

connectDB();
