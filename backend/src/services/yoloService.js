// import db from "../db/connection.js"
import speechController from '../controllers/speechController.js';

const yoloService = {
  returnspeech: async (body) => {
    try {
        return "Connected";
      } catch (err) {
        console.error("Connection error:", err.message);
        return { success: false, message: err.message };
      }
  },
  detections: async (json_body) => {
    try{
      const return_speech = await speechController.texttospeech(json_body);
      return return_speech;
    } catch (error) {
      console.error("Connection error:", error.message);
      return { success: false, message: error.message };
    }
  }
};
export default yoloService;