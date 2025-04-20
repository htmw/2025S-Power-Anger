import sys
import cv2
import json
from ultralytics import YOLO

model = YOLO("yolov8n.pt")  # Load YOLOv8 model
image_path = sys.argv[1]  # Get image path

image = cv2.imread(image_path)
results = model(image)

detections = []
for result in results:
    for box in result.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        label = model.names[int(box.cls[0])]
        confidence = float(box.conf[0])
        detections.append({"label": label, "confidence": confidence, "bbox": [x1, y1, x2, y2]})

print(json.dumps(detections))  # Send results back
