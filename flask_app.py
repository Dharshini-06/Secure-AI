import os
import pickle
from flask import Flask, request, jsonify

app = Flask(__name__)

# ==========================================
# 1. LOAD PRE-TRAINED MODELS & VECTORIZER
# ==========================================
# We wrap this in a safe try-except block to gracefully 
# fallback when the .pkl files are moved or missing.
URL_MODEL_PATH = "url_model.pkl"
MSG_MODEL_PATH = "msg_model.pkl"
VECTORIZER_PATH = "vectorizer.pkl"

def load_model(path):
    if os.path.exists(path):
        try:
            with open(path, "rb") as f:
                return pickle.load(f)
        except Exception as e:
            print(f"[!] Error loading {path}: {e}")
    return None

# Load states into memory at startup
url_model = load_model(URL_MODEL_PATH)
msg_model = load_model(MSG_MODEL_PATH)
vectorizer = load_model(VECTORIZER_PATH)

# ==========================================
# 2. EMERGENCY RULE-BASED FALLBACKS
# ==========================================
def fallback_analyze_message(message):
    message_lower = message.lower()
    keywords = ["urgent", "verify", "click", "win"]
    reasons = []
    score = 0
    for kw in keywords:
        if kw in message_lower:
            score += 25
            reasons.append(f"Suspicious keyword found: '{kw}'")
    status = "Phishing" if score >= 50 else ("Safe" if score < 25 else "Safe")
    return {
        "status": status,
        "score": min(score, 100),
        "reasons": reasons
    }

def fallback_analyze_url(url):
    score = 0
    if not url.startswith("https://"):
        score += 30
    if len(url) > 50:
        score += 20
    if url.count(".") > 3:
        score += 20
    status = "Malicious" if score >= 60 else "Safe"
    return {
        "status": "Safe" if score < 60 else "Malicious",
        "score": min(score, 100)
    }

# ==========================================
# 3. AI API ENDPOINTS
# ==========================================

@app.route("/analyze", methods=["POST"])
def analyze_url():
    """
    Endpoint A: Analyzes URLs using `url_model.pkl`
    Expects JSON: {"url": "https://example.com"}
    """
    try:
        data = request.get_json()
        if not data or "url" not in data:
            return jsonify({"error": "No url provided"}), 400
            
        url = data["url"]
        
        # Primary: Attempt ML Prediction
        if url_model:
            try:
                # Extract features: length, https presence, dot count
                length = len(url)
                https_presence = 1 if url.startswith("https://") else 0
                dot_count = url.count(".")
                features = [[length, https_presence, dot_count]]
                
                prediction = url_model.predict(features)[0]
                
                # Flexible scoring check if predict_proba is available
                if hasattr(url_model, "predict_proba"):
                    probs = url_model.predict_proba(features)[0]
                    score = int(probs[1] * 100) if len(probs) > 1 else (90 if prediction == 1 else 10)
                else:
                    score = 90 if prediction == 1 else 10
                    
                status = "Malicious" if prediction == 1 else "Safe"
                return jsonify({"status": status, "score": score})
            except Exception as e:
                print(f"[!] ML Model Predict Error (URL): {e}")
                # If error, automatically drop to fallback below
                
        # Secondary: Graceful Fallback rule logic
        return jsonify(fallback_analyze_url(url))

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/analyze-message", methods=["POST"])
def analyze_message():
    """
    Endpoint B: Analyzes text payloads using `msg_model.pkl` & `vectorizer.pkl`.
    Expects JSON: {"message": "Urgent, click here!"}
    """
    try:
        data = request.get_json()
        if not data or "message" not in data:
            return jsonify({"error": "No message provided"}), 400
            
        message = data["message"]
        
        # Primary: Attempt ML Prediction
        if msg_model and vectorizer:
            try:
                # Transform using vectorizer
                vec_msg = vectorizer.transform([message])
                prediction = msg_model.predict(vec_msg)[0]
                
                score = 0
                if hasattr(msg_model, "predict_proba"):
                    probs = msg_model.predict_proba(vec_msg)[0]
                    score = int(probs[1] * 100) if len(probs) > 1 else (90 if prediction == 1 else 10)
                else:
                    score = 90 if prediction == 1 else 10
                    
                status = "Phishing" if prediction == 1 else "Safe"
                reasons = ["AI Model flagged deep text semantics"] if prediction == 1 else []
                
                return jsonify({"status": status, "score": score, "reasons": reasons})
            except Exception as e:
                print(f"[!] ML Transform/Predict Error (Message): {e}")
                # If error, automatically drop to fallback
                
        # Secondary: Graceful Fallback rule logic
        return jsonify(fallback_analyze_message(message))

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run the server (default port 5000 for Flask). 
    # Threaded automatically keeps response fast (<1 sec overhead)
    app.run(host="0.0.0.0", port=5000, debug=True)
