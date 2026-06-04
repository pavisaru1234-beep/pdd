import cv2
import numpy as np
import base64
import io
import os
import pickle
import pandas as pd
import requests
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from PIL import Image
import google.generativeai as genai

# Setup Gemini API (Requires GEMINI_API_KEY env variable)
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    gemini_model = genai.GenerativeModel('gemini-flash-latest')
else:
    gemini_model = None

# Load the trained Random Forest Model for perfect ML accuracy
model_path = os.path.join(os.path.expanduser('~'), 'Downloads', 'titration_rf_model.pkl')
try:
    with open(model_path, 'rb') as f:
        ml_model = pickle.load(f)
except Exception as e:
    ml_model = None
    print(f"Warning: Could not load ML model from {model_path}. Falling back to heuristic.")


def encode_image(img):
    """Convert OpenCV BGR image to base64 for APIs"""
    _, buffer = cv2.imencode('.jpg', img)
    return base64.b64encode(buffer).decode('utf-8')

def validate_with_ollama(before_img, after_img):
    """Tier 2 Fallback: Call local Ollama LLaVA model"""
    b64_before = encode_image(before_img)
    b64_after = encode_image(after_img)
    
    prompt = "I have two images from a chemistry titration experiment. The first is before the endpoint, the second is after. Does the liquid clearly change color (e.g. from clear to pink)? Answer only 'YES' or 'NO'."
    
    try:
        # Note: LLaVA usually takes one image per request, or multiple if supported. 
        # For a simple local test, we send the after_img which should be pink.
        payload = {
            "model": "llava",
            "prompt": "Is the liquid in this flask pink or colored indicating a titration endpoint? Answer 'YES' or 'NO'.",
            "images": [b64_after],
            "stream": False
        }
        response = requests.post("http://localhost:11434/api/generate", json=payload, timeout=15)
        response.raise_for_status()
        text = response.json().get("response", "").strip().upper()
        return "YES" in text
    except Exception as e:
        print(f"Ollama validation failed: {e}")
        return None


def validate_with_gemini(before_img, after_img):
    """Tier 3 Fallback: Call Google Gemini API"""
    if not gemini_model:
        return None
        
    try:
        # Convert OpenCV to PIL Image for Gemini
        img_b = Image.fromarray(cv2.cvtColor(before_img, cv2.COLOR_BGR2RGB))
        img_a = Image.fromarray(cv2.cvtColor(after_img, cv2.COLOR_BGR2RGB))
        
        prompt = "Image 1 is before a titration endpoint, Image 2 is after. Did the color of the liquid clearly change, indicating the endpoint was reached? Answer only 'YES' or 'NO'."
        
        response = gemini_model.generate_content([prompt, img_b, img_a])
        text = response.text.strip().upper()
        return "YES" in text
    except Exception as e:
        print(f"Gemini validation failed: {e}")
        return None


def analyze_titration_video(video_path):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise Exception("Error opening video stream or file")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0 or np.isnan(fps):
        fps = 30.0

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    roi_x1 = int(width * 0.3)
    roi_x2 = int(width * 0.7)
    roi_y1 = int(height * 0.6)
    roi_y2 = int(height * 0.9)

    color_values = []
    frames = [] # Store some frames for LLM validation
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        roi = frame[roi_y1:roi_y2, roi_x1:roi_x2]
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        
        mean_sat = np.mean(hsv[:, :, 1])
        color_values.append(mean_sat)
        
        # Keep every 5th frame in memory (to save RAM) to use for LLM
        if len(color_values) % 5 == 0:
            frames.append((len(color_values)-1, frame))
            
    cap.release()

    if len(color_values) < 10:
        raise Exception("Video too short for analysis")

    window_size = min(30, len(color_values) // 5)
    smoothed_color = np.convolve(color_values, np.ones(window_size)/window_size, mode='valid')
    gradient = np.abs(np.gradient(smoothed_color))
    
    endpoint_idx_smoothed = np.argmax(gradient)
    endpoint_frame = endpoint_idx_smoothed + (window_size // 2)
    endpoint_time = endpoint_frame / fps
    
    max_gradient = np.max(gradient)
    final_saturation = np.mean(color_values[-20:]) if len(color_values) > 20 else color_values[-1]
    pre_endpoint_data = color_values[:endpoint_idx_smoothed] if endpoint_idx_smoothed > 10 else color_values[:10]
    baseline_variance = np.var(pre_endpoint_data)
    threshold = max_gradient * 0.5
    peak_frames = np.where(gradient > threshold)[0]
    shift_duration_frames = len(peak_frames) if len(peak_frames) > 0 else 15

    # ==========================
    # 3-TIER AI VALIDATION PIPELINE
    # ==========================
    is_endpoint_reached = False
    confidence = 0.0
    analysis_method = "Failed Analysis"
    
    # 1. Tier 1: Local Random Forest Model
    if ml_model:
        feature_df = pd.DataFrame([{
            'max_gradient': max_gradient,
            'final_saturation': final_saturation,
            'baseline_variance': baseline_variance,
            'shift_duration_frames': shift_duration_frames
        }])
        proba = ml_model.predict_proba(feature_df)[0]
        confidence = proba[1] * 100.0
        
        if confidence >= 85.0:
            is_endpoint_reached = True
            analysis_method = "Tier 1: Random Forest (High Confidence)"
        else:
            analysis_method = "Tier 1: Random Forest (Low Confidence)"

    # If Tier 1 is unsure or missing, trigger LLM Fallbacks
    if not is_endpoint_reached or confidence < 85.0:
        
        # Extract Before & After Frames
        before_frame_idx = max(0, endpoint_frame - 30)
        after_frame_idx = min(len(color_values) - 1, endpoint_frame + 30)
        
        # Find closest saved frames
        before_img = next((f for idx, f in frames if idx >= before_frame_idx), frames[0][1] if frames else np.zeros((height,width,3), dtype=np.uint8))
        after_img = next((f for idx, f in reversed(frames) if idx <= after_frame_idx), frames[-1][1] if frames else np.zeros((height,width,3), dtype=np.uint8))
        
        # 2. Tier 2: Ollama Local LLM Fallback
        ollama_result = validate_with_ollama(before_img, after_img)
        if ollama_result is True:
            is_endpoint_reached = True
            confidence = 90.0
            analysis_method = "Tier 2: Ollama LLaVA Validation"
        elif ollama_result is False:
            is_endpoint_reached = False
            confidence = 10.0
            analysis_method = "Tier 2: Ollama LLaVA Rejected"
        else:
            # 3. Tier 3: Gemini Cloud API Fallback
            gemini_result = validate_with_gemini(before_img, after_img)
            if gemini_result is True:
                is_endpoint_reached = True
                confidence = 99.0
                analysis_method = "Tier 3: Gemini Vision Validation"
            elif gemini_result is False:
                is_endpoint_reached = False
                confidence = 5.0
                analysis_method = "Tier 3: Gemini Vision Rejected"
            else:
                # Total Failure, revert to heuristic
                is_endpoint_reached = ml_model.predict(feature_df)[0] == 1 if ml_model else max_gradient > 2.0
                analysis_method = "Fallback: Basic CV Heuristics"


    # Format time and generate plot
    minutes = int(endpoint_time // 60)
    seconds = endpoint_time % 60
    time_str = f"{minutes:02d}:{seconds:04.1f}"

    plt.figure(figsize=(8, 4), facecolor='#0f172a')
    ax = plt.gca()
    ax.set_facecolor('#0f172a')
    plt.plot(np.arange(len(smoothed_color)) + window_size//2, smoothed_color, color='#38bdf8', label='Smoothed Saturation', linewidth=2)
    
    if is_endpoint_reached:
        plt.axvline(x=endpoint_frame, color='#ef4444', linestyle='--', label='Endpoint Detected')
    
    plt.title('Color Change Over Time (Saturation)', color='white')
    plt.xlabel('Frame Number', color='#94a3b8')
    plt.ylabel('Mean Saturation Value', color='#94a3b8')
    plt.tick_params(colors='#94a3b8')
    ax.spines['bottom'].set_color('#94a3b8')
    ax.spines['left'].set_color('#94a3b8') 
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.legend(facecolor='#020617', edgecolor='#ffffff', labelcolor='white')
    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100)
    plt.close()
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')

    return {
        "endpointReached": bool(is_endpoint_reached),
        "endpointTime": time_str,
        "frameNumber": int(endpoint_frame),
        "confidence": round(confidence, 1),
        "chartBase64": f"data:image/png;base64,{img_base64}",
        "colorShift": analysis_method
    }
