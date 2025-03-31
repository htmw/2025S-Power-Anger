
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from aiortc import RTCPeerConnection, RTCSessionDescription, MediaStreamTrack
import asyncio
import logging
import av
import cv2
import time
import aiohttp
import numpy as np
from ultralytics import YOLO

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NodeJS backend URL
NODEJS_BACKEND_URL = "http://localhost:4000/detections"  # NodeJS backend running on port 4000

# Initialize YOLO model
try:
    # Use the smallest and fastest model for better performance
    model = YOLO("yolov8n.pt")
    # Set inference size to smaller value for faster processing
    model.overrides['imgsz'] = 320
    # Set confidence threshold higher to reduce processing
    model.overrides['conf'] = 0.5
    # Set IoU threshold higher to reduce overlapping boxes
    model.overrides['iou'] = 0.5
    logger.info("YOLO model loaded with optimized settings")
except Exception as e:
    logger.error(f"Error loading YOLO model: {e}")
    raise

# Store active peer connections
pcs = set()

# HTTP session for sending data to NodeJS backend
http_session = None

@app.on_event("startup")
async def startup_event():
    global http_session
    http_session = aiohttp.ClientSession()
    logger.info("HTTP session created for NodeJS communication")

@app.on_event("shutdown")
async def shutdown_event():
    # Close HTTP session
    global http_session
    if http_session:
        await http_session.close()
        logger.info("HTTP session closed")
    
    # Close all peer connections
    logger.info("Shutting down server and cleaning up connections")
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()

async def send_to_nodejs(detection_data):
    """Send detection data to NodeJS backend"""
    global http_session
    if not http_session:
        logger.error("HTTP session not initialized")
        return
    
    try:
        async with http_session.post(NODEJS_BACKEND_URL, json=detection_data) as response:
            if response.status != 200:
                logger.warning(f"Failed to send data to NodeJS backend: {response.status}")
            else:
                logger.debug(f"Detection data sent to NodeJS backend: {len(detection_data['detections'])} objects")
    except Exception as e:
        logger.error(f"Error sending data to NodeJS backend: {e}")

class VideoTransformTrack(MediaStreamTrack):
    kind = "video"
    
    def __init__(self, track, pc_id):
        super().__init__()
        self.track = track
        self.frame_count = 0
        self.skip_count = 0
        self.last_process_time = time.time()
        self.process_every_n_frames = 3  # Process every 3rd frame
        self.pc_id = pc_id  # Store peer connection ID for identification
        logger.info(f"VideoTransformTrack initialized with frame skipping for pc_id: {pc_id}")

    async def recv(self):
        try:
            # Get the next frame from the source track
            frame = await self.track.recv()
            self.frame_count += 1
            
            # Skip frames to reduce latency (process every Nth frame)
            current_time = time.time()
            elapsed = current_time - self.last_process_time
            
            # If less than N frames have passed, just return the original frame
            if self.frame_count % self.process_every_n_frames != 0:
                self.skip_count += 1
                if self.skip_count % 30 == 0:
                    logger.info(f"Skipped {self.skip_count} frames for latency optimization")
                return frame
            
            # Convert frame to numpy array
            img = frame.to_ndarray(format="bgr24")
            
            # Run YOLO detection (with lowered resolution for speed)
            results = model(img, verbose=False)
            
            # Prepare detection data for NodeJS
            detection_data = {
                "timestamp": time.time(),
                "frame_id": self.frame_count,
                "pc_id": self.pc_id,
                "detections": []
            }
            
            # Process results and draw on frame
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    # Get box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    # Get confidence and class name
                    confidence = float(box.conf)
                    class_id = int(box.cls)
                    class_name = model.names[class_id]
                    
                    # Add to detection data for NodeJS
                    detection_data["detections"].append({
                        "class_id": class_id,
                        "class_name": class_name,
                        "confidence": confidence,
                        "bbox": {
                            "x1": x1,
                            "y1": y1,
                            "x2": x2,
                            "y2": y2,
                            "width": x2 - x1,
                            "height": y2 - y1
                        }
                    })
                    
                    # Draw box
                    cv2.rectangle(
                        img, 
                        (int(x1), int(y1)), 
                        (int(x2), int(y2)), 
                        (0, 255, 0), 2
                    )
                    
                    # Draw simplified label (no background) for speed
                    label = f'{class_name} {confidence:.2f}'
                    cv2.putText(
                        img, label, 
                        (int(x1), int(y1) - 5), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2
                    )
            
            # Add frame count text
            cv2.putText(
                img,
                f"Frame: {self.frame_count}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2
            )
            
            # Update last process time
            self.last_process_time = current_time
            
            # Log processing rate
            if self.frame_count % 30 == 0:
                logger.info(f"Processing speed: {elapsed*1000:.1f}ms per frame")
            
            # Send detection data to NodeJS backend if there are detections
            if detection_data["detections"]:
                # Use create_task to not block the video processing
                asyncio.create_task(send_to_nodejs(detection_data))
            
            # Convert back to VideoFrame
            new_frame = av.VideoFrame.from_ndarray(img, format="bgr24")
            new_frame.pts = frame.pts
            new_frame.time_base = frame.time_base
                        
            return new_frame
            
        except Exception as e:
            logger.error(f"Error in frame processing: {e}")
            # On error, return the original frame
            return frame
        
@app.post("/offer")
async def handle_offer(session_description: dict):
    try:
        logger.info("Received WebRTC offer")
        
        # Create new RTCPeerConnection
        pc = RTCPeerConnection()
        # Generate a unique ID for this peer connection
        pc_id = f"pc_{id(pc)}"
        pc.pc_id = pc_id  # Store ID on the object for reference
        pcs.add(pc)
        
        logger.info(f"Created new peer connection with ID: {pc_id}")

        @pc.on("connectionstatechange")
        async def on_connectionstatechange():
            logger.info(f"Connection state changed to: {pc.connectionState} for pc_id: {pc_id}")
            if pc.connectionState == "failed" or pc.connectionState == "closed":
                pcs.discard(pc)

        @pc.on("track")
        def on_track(track):
            logger.info(f"Received {track.kind} track for pc_id: {pc_id}")
            if track.kind == "video":
                # Create video processor track
                video_processor = VideoTransformTrack(track, pc_id)
                pc.addTrack(video_processor)

        # Set remote description
        await pc.setRemoteDescription(
            RTCSessionDescription(
                sdp=session_description["sdp"],
                type=session_description["type"]
            )
        )

        # Create answer
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        response = {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
        logger.info(f"Sending answer back to client for pc_id: {pc_id}")
        return response

    except Exception as e:
        logger.error(f"Error in handle_offer: {e}")
        if 'pc' in locals():
            await pc.close()
            pcs.discard(pc)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)