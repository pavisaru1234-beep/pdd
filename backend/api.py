from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import tempfile
from analyzer import analyze_titration_video

app = FastAPI()

# Allow CORS so our React frontend can communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze_video(file: UploadFile = File(...)):
    # Save uploaded video to a temporary file
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, file.filename)
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Run computer vision analysis
        result = analyze_titration_video(temp_path)
        
        return result
    except Exception as e:
        return {"error": str(e), "endpointReached": False}
    finally:
        # Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)
