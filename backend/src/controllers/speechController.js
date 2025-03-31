import speechService from "../services/speechService.js"
import app from "../app.js";

const speechController = {
  texttospeech: async (req, res) => {
    try {
      console.log(req.body,Date.now());
      const result = await speechService.returnspeech(req.body);
      console.log('result',result);
      return res.status(200).json({file_name: result});
    } catch (error) {
      console.log(error);
      return res.status(500).json({message: "An error occured"})
    }
  },

};

export default speechController;