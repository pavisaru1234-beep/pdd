import pandas as pd
import os
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Load the dataset
dataset_path = os.path.join(os.path.expanduser('~'), 'Downloads', 'synthetic_titration_dataset.csv')
df = pd.read_csv(dataset_path)

# Separate features (X) and labels (y)
X = df[['max_gradient', 'final_saturation', 'baseline_variance', 'shift_duration_frames']]
y = df['label_valid_endpoint']

# Split into training and testing sets (80% train, 20% test)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Initialize and train the Random Forest Classifier
print("Training Random Forest Classifier on Titration Data...")
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

# Test the model
y_pred = clf.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"\n--- Model Evaluation ---")
print(f"Accuracy: {accuracy * 100:.2f}%\n")
print("Classification Report:")
print(classification_report(y_test, y_pred, target_names=['Invalid/Noisy', 'Valid Endpoint']))

# Save the trained model to disk
model_path = os.path.join(os.path.expanduser('~'), 'Downloads', 'titration_rf_model.pkl')
with open(model_path, 'wb') as f:
    pickle.dump(clf, f)
    
print(f"\nTrained model saved successfully to: {model_path}")
print("You can now load this .pkl file into your FastAPI backend to predict confidence scores!")
