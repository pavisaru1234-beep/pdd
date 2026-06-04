import cv2
import numpy as np
import os
import random

# Video settings
width, height = 640, 480
fps = 30
duration = 10 # seconds
total_frames = fps * duration
endpoint_frame = fps * 6 # Endpoint happens at 6 seconds

output_path = os.path.join(os.path.expanduser('~'), 'Downloads', 'noisy_titration_sample.mp4')
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

bg_color = (200, 200, 200) # darker background
flask_color = (150, 150, 150)
clear_liquid = (220, 220, 200) 
pink_liquid = (180, 100, 240)  
drop_color = (255, 255, 255)

# Base Coordinates
flask_pts_base = np.array([[260, 150], [380, 150], [380, 250], [450, 400], [190, 400], [260, 250]], np.float32)
liquid_pts_base = np.array([[240, 280], [400, 280], [440, 390], [200, 390]], np.float32)

for frame in range(total_frames):
    # Add Lighting Fluctuation (simulating someone walking by or a cloud)
    lighting_shift = int(np.sin(frame / 10.0) * 30)
    current_bg = (
        max(0, min(255, bg_color[0] + lighting_shift)),
        max(0, min(255, bg_color[1] + lighting_shift)),
        max(0, min(255, bg_color[2] + lighting_shift))
    )
    img = np.full((height, width, 3), current_bg, dtype=np.uint8)
    
    # Add Camera Shake (simulating a mobile phone recording)
    shake_x = random.randint(-5, 5)
    shake_y = random.randint(-5, 5)
    
    flask_pts = (flask_pts_base + [shake_x, shake_y]).astype(np.int32).reshape((-1, 1, 2))
    liquid_pts = (liquid_pts_base + [shake_x, shake_y]).astype(np.int32).reshape((-1, 1, 2))

    # Determine current liquid color based on endpoint
    if frame < endpoint_frame:
        current_liquid = clear_liquid
    else:
        # Interpolate color transition 
        transition = min(1.0, (frame - endpoint_frame) / 20.0)
        current_liquid = (
            int(clear_liquid[0] * (1 - transition) + pink_liquid[0] * transition),
            int(clear_liquid[1] * (1 - transition) + pink_liquid[1] * transition),
            int(clear_liquid[2] * (1 - transition) + pink_liquid[2] * transition)
        )
        
    # Draw liquid
    cv2.fillPoly(img, [liquid_pts], current_liquid)
    
    # Draw flask outline
    cv2.polylines(img, [flask_pts], True, flask_color, 4)
    
    # Draw dripping drops (one drop every 20 frames before endpoint)
    if frame < endpoint_frame + 20:
        drop_y = 50 + ((frame % 20) * 15)
        if drop_y < 280:
            cv2.circle(img, (320 + shake_x, drop_y + shake_y), 5, drop_color, -1)
            
    # Add text overlay
    cv2.putText(img, f"Noisy Mobile Camera Simulation", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (50, 50, 50), 2)
    cv2.putText(img, f"Frame: {frame}", (50, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (100, 100, 100), 2)

    # Add artificial Gaussian noise to simulate cheap camera sensor
    noise = np.random.normal(0, 15, img.shape).astype(np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    out.write(img)

out.release()
print(f"Noisy Titration video generated at: {output_path}")
