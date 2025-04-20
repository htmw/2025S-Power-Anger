import dotenv from "dotenv";
import app from "./app.js";
// import db from "../src/db/connection.js";

dotenv.config();
// db();

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`User Service is running on port ${PORT}`);
});