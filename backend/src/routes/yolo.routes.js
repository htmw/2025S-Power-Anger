import express from 'express';
import yoloController from '../controllers/yoloController.js'
const router = express.Router();

router.post('/connection',yoloController.connection);
router.post('/detections',yoloController.detections);

export default router;