from flask import Flask, request, jsonify
import numpy as np
import joblib

app = Flask(__name__)

# Load trained ensemble
model_data = joblib.load("ensemble_stack_model.pkl")
gb_model = model_data['gb_model']
lgb_model = model_data['lgb_model']
xgb_model = model_data['xgb_model']
weights = model_data['weights']
poly = model_data['poly']
label_encoder = model_data['label_encoder']

@app.route('/')
def home(): 
    return "✅ Water Quality Prediction API is running!"

@app.route('/test')
def test():
    return "✅ Test endpoint is working!"

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(force=True)
        print("🔹 Received data:", data)   # 👈 log incoming payload
        # Extract input in correct order
        features = [data[col] for col in ['DO', 'DO_SAT', 'BOD', 'COD', 'SS', 'pH', 'NH3N', 'TEMP']]
        features = np.array(features).reshape(1, -1)

        # Transform input
        X_poly = poly.transform(features)

        # Predictions from each model
        preds_gb = gb_model.predict_proba(X_poly)
        preds_lgb = lgb_model.predict_proba(X_poly)
        preds_xgb = xgb_model.predict_proba(X_poly)

        # Weighted average
        final_preds = (
            weights['w_gb'] * preds_gb +
            weights['w_lgb'] * preds_lgb +
            weights['w_xgb'] * preds_xgb
        ) / (weights['w_gb'] + weights['w_lgb'] + weights['w_xgb'])

        # Final class index
        final_label = np.argmax(final_preds, axis=1)[0]
        final_class = label_encoder.inverse_transform([final_label])[0]

        # Confidence
        confidence = float(np.max(final_preds)) * 100

        return jsonify({
            "prediction": final_class,
            "confidence": round(confidence, 2),
            "probabilities": {
                str(label_encoder.inverse_transform([i])[0]): float(final_preds[0][i])
                for i in range(len(final_preds[0]))
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)
