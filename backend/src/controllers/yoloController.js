import yoloService from "../services/yoloService.js";
import app from "../app.js";

const yoloController = {
    connection: async (req, res) => {
      try {
        console.log('res',req.body);
        // return res.status(200).json({ message: "connected" });
        // const result = await yoloService.yoloconnection(req.body);
    
        const imageData = req.body.image.replace(/^data:image\/\w+;base64,/, "");
        const imagePath = "frame.jpg";
        fs.writeFileSync(imagePath, imageData, { encoding: "base64" });

        const python = spawn("python3", ["detect.py", imagePath]);

        await python.stdout.on("data", (data) => {
          console.log(`Detection Output: ${data}`);
          res.json({ result: JSON.parse(data.toString()) });
        });

        python.stderr.on("data", (data) => {
          console.error(`Error: ${data}`);
          res.status(500).send("Detection Failed");
        });
        return res.status(200).json({ message: "Connected" });
      } catch (error) {
        return res
          .status(500)
          .json({ message: "An error occurred" });
      }
    },

};

export default yoloController;