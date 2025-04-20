import express from 'express';
import speechController from "../controllers/speechController.js"
const router = express.Router();

router.post('/texttospeech',speechController.texttospeech);

export default router;