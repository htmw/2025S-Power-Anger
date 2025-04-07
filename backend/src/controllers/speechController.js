import speechService from "../services/speechService.js"
import app from "../app.js";

const speechController = {
  texttospeech: async (body,res) => {
    try {
      console.log(body);
      const result = await speechService.returnspeech(body);
      console.log('result',result);
      return result;
    } catch (error) {
      // console.log(error);
      // return res.status(500).json({message: "An error occured"})
      return error;
    }
  },

};

export default speechController;