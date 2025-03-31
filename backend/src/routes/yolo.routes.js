import express from 'express';
import yoloController from '../controllers/yoloController.js'
const router = express.Router();

router.post('/connection',yoloController.connection);

export default router;