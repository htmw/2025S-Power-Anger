import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import yoloRoutes from "./routes/yolo.routes.js";
import speechRoutes from "./routes/speech.routes.js"
import dotenv from "dotenv";
import fs from "fs";
import { spawn } from "child_process";



const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

// Middlewarej
app.use(bodyParser.json());

// Routes
app.use('/yolo', yoloRoutes);
app.use('/speech',speechRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

app.listen(3001, () => console.log("Server running on port 8000"));

export default app;

