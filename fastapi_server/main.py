
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from aiortc import RTCPeerConnection, RTCSessionDescription, MediaStreamTrack
import asyncio
import logging
import av
import cv2
import time
from ultralytics import YOLO
import numpy as np

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

class VideoTransformTrack(MediaStreamTrack):
    kind = "video"
    
    def __init__(self, track):
        super().__init__()
        self.track = track
        self.frame_count = 0
        self.skip_count = 0
        self.last_process_time = time.time()
        self.process_every_n_frames = 3  # Process every 3rd frame
        logger.info("VideoTransformTrack initialized with frame skipping")

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
        pcs.add(pc)

        @pc.on("connectionstatechange")
        async def on_connectionstatechange():
            logger.info(f"Connection state changed to: {pc.connectionState}")
            if pc.connectionState == "failed" or pc.connectionState == "closed":
                pcs.discard(pc)

        @pc.on("track")
        def on_track(track):
            logger.info(f"Received {track.kind} track")
            if track.kind == "video":
                # Create video processor track
                video_processor = VideoTransformTrack(track)
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
        logger.info("Sending answer back to client")
        return response

    except Exception as e:
        logger.error(f"Error in handle_offer: {e}")
        if 'pc' in locals():
            await pc.close()
            pcs.discard(pc)
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("shutdown")
async def shutdown_event():
    # Close all peer connections
    logger.info("Shutting down server and cleaning up connections")
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)