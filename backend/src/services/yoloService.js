// import db from "../db/connection.js"

const yoloService = {
  returnspeech: async (body) => {
    try {
        return "Connected";
      } catch (err) {
        console.error("Connection error:", err.message);
        return { success: false, message: err.message };
      }
  },

};
export default yoloService;