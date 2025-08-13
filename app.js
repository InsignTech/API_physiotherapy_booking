import express from "express";
import "dotenv/config";
import connectDB from "./config/connection.js"
import userRoutes from './routes/userRoutes.js'
import patientRoutes from './routes/patientRoutes.js'
import cors from "cors";
import jwt from 'jsonwebtoken'; 

const app = express();


const corsOptions = {
 origin: [
    "http://localhost:5173",
    "https://physio.insigntechsolutions.com"
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const PORT = process.env.PORT || 7000;
app.get("/", (req, res) => {
  res.send("Hello Physio !");
});


app.use("/user",userRoutes)
app.use("/patients",patientRoutes)

app.listen(PORT, () => {
  console.log(`server is running on ${PORT}`);
});

connectDB()

