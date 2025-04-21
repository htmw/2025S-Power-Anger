import yoloService from "../services/yoloService.js";
import app from "../app.js";

let lastSpeechTime = 0;
const speechCooldown = 5000; // 5 seconds 
let accumulatedDetections = new Set(); // Current detection set
let lastAnnouncedDetections = new Set(); // Previously announced detections


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
    
    // detections: async (req, res) => {
    //   try {
    //     console.log(req.body);
        
    //     // Extract meaningful information from the detection data
    //     let detectionText = "No objects detected";
        
    //     if (req.body.detections && req.body.detections.length > 0) {
    //       // Create a list of detected objects with their class names
    //       const detectedObjects = req.body.detections.map(det => det.class_name);
    //       // Remove duplicates
    //       const uniqueObjects = [...new Set(detectedObjects)];
    //       // Create a sentence with the detected objects
    //       detectionText = `I can see ${uniqueObjects.join(', ')}`;
    //     }
        
    //     // Pass the constructed text to the speech service
    //     const result = await yoloService.detections(JSON.parse('{"imgtext":"' + detectionText + '"}'));
    //     return res.status(200).json({file_name: result});
    //   } catch (error) {
    //     return res
    //       .status(500)
    //       .json({ message: "An error occurred" });
    //   }
    // },
    detections: async (req, res) => {
      try {
        console.log(req.body);
        
        // Extract detected objects and add to accumulated set
        if (req.body.detections && req.body.detections.length > 0) {
          req.body.detections.forEach(det => {
            accumulatedDetections.add(det.class_name);
          });
        }
        
        const currentTime = Date.now();
        // Check if cooldown period has passed
        if (currentTime - lastSpeechTime >= speechCooldown && accumulatedDetections.size > 0) {
          // Find new objects that weren't in the last announcement
          const newObjects = [...accumulatedDetections].filter(obj => !lastAnnouncedDetections.has(obj));
          // Find objects that disappeared
          const removedObjects = [...lastAnnouncedDetections].filter(obj => !accumulatedDetections.has(obj));
          
          // Only generate speech if there are changes
          if (newObjects.length > 0 || removedObjects.length > 0) {
            let detectionText = "";
            
            if (newObjects.length > 0) {
              detectionText += `I now see ${newObjects.join(', ')}. `;
            }
            
            if (removedObjects.length > 0) {
              detectionText += `I no longer see ${removedObjects.join(', ')}.`;
            }
            
            // Generate speech
            const result = await yoloService.detections(JSON.parse('{"imgtext":"' + detectionText + '"}'));
            
            // Update last announced set to current set
            lastAnnouncedDetections = new Set(accumulatedDetections);
            
            // Reset the timer and accumulated detections
            lastSpeechTime = currentTime;
            
            return res.status(200).json({file_name: result});
          } else {
            // If we have the same objects as before, don't generate speech
            lastSpeechTime = currentTime; // Still reset the timer
            return res.status(200).json({message: "No change in detected objects"});
          }
        } else {
          // If we're in cooldown period, just acknowledge
          return res.status(200).json({message: "Detection added to queue"});
        }
      } catch (error) {
        return res
          .status(500)
          .json({ message: "An error occurred" });
      }
    },

};

export default yoloController;