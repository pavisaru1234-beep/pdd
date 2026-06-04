import numpy as np
import pandas as pd
import os

# Generates a synthetic dataset for training a Titration Machine Learning Model
# In the real world, you would generate this CSV by running your OpenCV pipeline 
# across hundreds of real titration videos and saving the metrics.

num_samples = 500
data = []

for i in range(num_samples):
    # 50% chance of being a successful titration, 50% chance of being failed/noisy
    is_valid = np.random.choice([0, 1])
    
    if is_valid == 1:
        # Successful Titration Features
        # High max gradient (sudden color shift)
        max_gradient = np.random.normal(15.0, 3.0) 
        # Mean saturation after shift is high (turned pink)
        final_saturation = np.random.normal(120.0, 15.0) 
        # Low noise before the shift
        baseline_variance = np.random.normal(2.0, 0.5)
        # Shift happens reasonably fast
        shift_duration_frames = np.random.normal(15, 5)
    else:
        # Failed / Noisy Titration Features
        # Low max gradient (no sudden shift, just gradual noise)
        max_gradient = np.random.normal(3.0, 2.0)
        # Saturation stays low or fluctuates wildly
        final_saturation = np.random.normal(40.0, 20.0)
        # High noise (e.g. hands moving, bad lighting)
        baseline_variance = np.random.normal(15.0, 8.0)
        # If there is a shift, it's very slow (not a chemical endpoint)
        shift_duration_frames = np.random.normal(60, 20)

    # Ensure no negative values for physical properties
    max_gradient = max(0.1, max_gradient)
    final_saturation = max(0.0, final_saturation)
    baseline_variance = max(0.1, baseline_variance)
    shift_duration_frames = max(1, shift_duration_frames)

    data.append({
        'max_gradient': round(max_gradient, 2),
        'final_saturation': round(final_saturation, 2),
        'baseline_variance': round(baseline_variance, 2),
        'shift_duration_frames': int(shift_duration_frames),
        'label_valid_endpoint': is_valid
    })

df = pd.DataFrame(data)
output_path = os.path.join(os.path.expanduser('~'), 'Downloads', 'synthetic_titration_dataset.csv')
df.to_csv(output_path, index=False)

print(f"Synthetic dataset generated successfully at: {output_path}")
print("Head of dataset:")
print(df.head())
