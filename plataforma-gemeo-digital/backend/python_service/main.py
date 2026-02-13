from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse, JSONResponse
import cv2
import numpy as np
from ultralytics import YOLO
import io
import os
import base64 # Import base64

app = FastAPI()

# --- IMPORTANT ---
# Please update these paths to point to your actual model files.
script_dir = os.path.dirname(os.path.realpath(__file__))
BEST_MODEL_PATH = os.getenv("BEST_MODEL_PATH", os.path.join(script_dir, '../../best.pt'))
LAST_MODEL_PATH = os.getenv("LAST_MODEL_PATH", os.path.join(script_dir, '../../last.pt'))

# Load the YOLO models
# The user can choose which model to use by changing the path
model_best = YOLO(BEST_MODEL_PATH)
model_last = YOLO(LAST_MODEL_PATH)

# Default model
model = model_best

@app.post("/process-image/")
async def process_image(file: UploadFile = File(...)):
    """
    Receives an image, processes it with the YOLO model,
    and returns the image with bounding boxes AND detection data.
    """
    if not os.path.exists(BEST_MODEL_PATH) or not os.path.exists(LAST_MODEL_PATH):
        return JSONResponse(status_code=500, content={"error": "Model files not found. Please set the BEST_MODEL_PATH and LAST_MODEL_PATH environment variables or update the paths in the script."})

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Perform inference
    results = model(img)

    # Extract detection data
    detections_data = []
    if results and results[0].boxes:
        for box in results[0].boxes:
            # Bounding box coordinates in xyxy format
            x1, y1, x2, y2 = map(float, box.xyxy[0])
            conf = float(box.conf[0])
            cls = int(box.cls[0])
            class_name = model.names[cls] # Get class name from model

            detections_data.append({
                "class_name": class_name,
                "confidence": conf,
                "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2}
            })

    # Draw the bounding boxes on the image
    annotated_img = results[0].plot()

    # Encode the annotated image to be sent in the response as base64
    _, encoded_img = cv2.imencode('.PNG', annotated_img)
    encoded_img_base64 = base64.b64encode(encoded_img.tobytes()).decode('utf-8')

    # Return both the base64 image and the detection data
    return JSONResponse(content={
        "processed_image_base64": encoded_img_base64,
        "detections": detections_data
    })

@app.get("/switch-model/{model_name}")
async def switch_model(model_name: str):
    """
    Switches the model between 'best' and 'last'.
    """
    global model
    if model_name.lower() == 'best':
        model = model_best
        return {"message": "Switched to 'best' model."}
    elif model_name.lower() == 'last':
        model = model_last
        return {"message": "Switched to 'last' model."}
    else:
        return {"message": "Invalid model name. Please use 'best' or 'last'."}

if __name__ == '__main__':
    import uvicorn
    # It is recommended to run the server with environment variables for the model paths
    # For example:
    # BEST_MODEL_PATH=../../best/best.pt LAST_MODEL_PATH=../../last/last.pt uvicorn main:app --reload --port 8001
    uvicorn.run(app, host="0.0.0.0", port=8001)
