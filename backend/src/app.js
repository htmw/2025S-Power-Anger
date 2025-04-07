import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import yoloRoutes from "./routes/yolo.routes.js";
import speechRoutes from "./routes/speech.routes.js"
import dotenv from "dotenv";
import fs from "fs";
import { spawn } from "child_process";
import crypto from 'crypto';



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

export const decrypt_key = () => {
    const algorithm = 'aes-256-cbc';
    const secretKey = Buffer.from(process.env.SECRET_KEY_BASE64, 'base64');
    const iv = Buffer.from(process.env.IV_BASE64, 'base64');
    const encryptedKey = process.env.GOOGLE_SPEECH_CRED;

    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

app.listen(8001, () => console.log("Server running on port 8000"));

export default app;

