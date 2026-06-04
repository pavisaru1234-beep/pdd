import cv2
import numpy as np
import os

# Video settings
width, height = 640, 480
fps = 30
duration = 8 # seconds
total_frames = fps * duration
endpoint_frame = fps * 5 # Endpoint happens at 5 seconds

# Create video writer
output_path = os.path.join(os.path.expanduser('~'), 'Downloads', 'real_titration_sample.mp4')
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

# Colors (B, G, R)
bg_color = (240, 240, 240)
flask_color = (200, 200, 200)
clear_liquid = (245, 245, 230) # slight yellowish clear
pink_liquid = (200, 150, 255)  # vivid pink endpoint
drop_color = (255, 255, 255)

# Flask coordinates
flask_pts = np.array([[260, 150], [380, 150], [380, 250], [450, 400], [190, 400], [260, 250]], np.int32)
flask_pts = flask_pts.reshape((-1, 1, 2))
liquid_pts = np.array([[240, 280], [400, 280], [440, 390], [200, 390]], np.int32)
liquid_pts = liquid_pts.reshape((-1, 1, 2))

for frame in range(total_frames):
    img = np.full((height, width, 3), bg_color, dtype=np.uint8)
    
    # Determine current liquid color based on endpoint
    if frame < endpoint_frame:
        current_liquid = clear_liquid
    else:
        # Interpolate color transition quickly over ~15 frames
        transition = min(1.0, (frame - endpoint_frame) / 15.0)
        current_liquid = (
            int(clear_liquid[0] * (1 - transition) + pink_liquid[0] * transition),
            int(clear_liquid[1] * (1 - transition) + pink_liquid[1] * transition),
            int(clear_liquid[2] * (1 - transition) + pink_liquid[2] * transition)
        )
        
    # Draw liquid
    cv2.fillPoly(img, [liquid_pts], current_liquid)
    
    # Draw flask outline
    cv2.polylines(img, [flask_pts], True, flask_color, 4)
    
    # Draw dripping drops (one drop every 30 frames before endpoint)
    if frame < endpoint_frame + 30:
        drop_y = 50 + ((frame % 30) * 10)
        if drop_y < 280:
            cv2.circle(img, (320, drop_y), 5, drop_color, -1)
            
    # Add text overlay
    cv2.putText(img, f"Simulated Titration View", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (50, 50, 50), 2)
    cv2.putText(img, f"Frame: {frame}", (50, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (100, 100, 100), 2)

    out.write(img)

out.release()
print(f"Titration video generated at: {output_path}")
