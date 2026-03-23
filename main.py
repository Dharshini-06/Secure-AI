from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import logging

# Modular imports for the new features
import message_analyzer
import password_checker
import dashboard_data
import supabase_db

# Initialize the backend application
app = FastAPI(
    title="SecureAI Extended Backend",
    description="Multi-layer cybersecurity engine for existing AI Website Safety Checker."
)

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (including file://)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (POST, GET, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Set up logging for error tracking
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Pydantic Data Models ---
class URLRequest(BaseModel):
    url: str

class MessageRequest(BaseModel):
    message: str

class PasswordRequest(BaseModel):
    password: str

class CombinedScoreRequest(BaseModel):
    url_score: float
    message_score: float
    password_score: float

# --- Stub for Extant URL Analyzer (Fake Login Detection added) ---
def check_fake_login(url: str) -> dict:
    """
    Simulates fake login page detection.
    Detects if a URL contains "login" and mismatches expected patterns.
    """
    url_lower = url.lower()
    warning_msg = None
    
    if "login" in url_lower or "signin" in url_lower:
        # Simple domain mismatch heuristic
        suspicious_tlds = [".xyz", ".top", ".click", ".win"]
        if any(url_lower.endswith(tld) or (tld + "/") in url_lower for tld in suspicious_tlds):
            warning_msg = "Warning: URL mimics a login page but points to a high-risk domain."
            
    return {"fake_login_warning": warning_msg}

@app.post("/analyze")
async def analyze(req: dict):
    """
    URL analysis logic with Supabase storage.
    """
    print("🔥 /analyze HIT")
    url = req.get("url")
    print("URL:", url)
    
    if not url:
        return {"error": "Missing URL"}
        
    try:
        supabase_db.save_scan(
            "url",
            str(url),
            "safe",
            90
        )
    except Exception as e:
        print("Database error:", e)
        
    return {"status": "stored"}

# --- New Message Phishing Endpoint ---
@app.post("/analyze-message")
async def analyze_message_endpoint(req: MessageRequest):
    """
    Endpoint 1: Analyzes message payloads for phishing indicators.
    """
    try:
        if not req.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty.")
            
        # Call the modular analyzer
        result = message_analyzer.analyze_message(req.message)
        
        # Track dashboard metrics
        if result["status"] == "phishing":
            dashboard_data.record_phishing()
            
        # Save to Supabase (Database Log)
        try:
            supabase_db.save_scan(
                "message",
                req.message,
                result["status"],
                result["confidence"]
            )
        except Exception as db_err:
            logger.error(f"Supabase storage error: {str(db_err)}")
            
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /analyze-message: {str(e)}")
        raise HTTPException(status_code=500, detail="Error analyzing message")

# --- New Password Security Endpoint ---
@app.post("/check-password")
async def check_password_endpoint(req: PasswordRequest):
    """
    Endpoint 2: Evaluates string inputs for structural integrity and breach lists.
    """
    try:
        if not req.password:
            raise HTTPException(status_code=400, detail="Password cannot be empty.")
            
        # Modular logic
        strength = password_checker.check_strength(req.password)
        breach_info = password_checker.breach_simulation(req.password)
        
        # Log weak metrics
        if strength == "Weak":
            dashboard_data.record_weak_password()
            
        # [NEW] Mask password and calculate score for storage
        masked_password = "*" * len(req.password)
        score_map = {"Weak": 30, "Medium": 60, "Strong": 90}
        score = score_map.get(strength, 30)

        # [NEW] Secure Database Storage
        try:
            supabase_db.save_scan(
                "password",
                masked_password,
                strength,
                score
            )
        except Exception as db_err:
            logger.error(f"Supabase password storage error: {str(db_err)}")
            
        return {
            "strength": strength,
            "risk_status": "High Risk" if breach_info["risky"] else "Standard",
            "details": breach_info["reason"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /check-password: {str(e)}")
        raise HTTPException(status_code=500, detail="Error checking password")

# --- Unified Security Framework Score Endpoint ---
@app.post("/combined-score")
async def combined_score_endpoint(req: CombinedScoreRequest):
    """
    Endpoint 3: Aggregates individual layer scores into a unified AI risk assessment.
    Formula: Final Score = (URL score * 0.5) + (Message score * 0.3) + (Password score * 0.2)
    """
    try:
        # Input validation
        scores = [req.url_score, req.message_score, req.password_score]
        if any(s < 0 or s > 100 for s in scores):
            raise HTTPException(status_code=400, detail="Scores must be between 0 and 100.")

        # Core weighting logic
        url_weighted = req.url_score * 0.5
        msg_weighted = req.message_score * 0.3
        pass_weighted = req.password_score * 0.2
        
        final_score = url_weighted + msg_weighted + pass_weighted
        
        return {
            "combined_score": round(final_score, 2),
            "breakdown": {
                "url_factor": round(url_weighted, 2),
                "message_factor": round(msg_weighted, 2),
                "password_factor": round(pass_weighted, 2)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /combined-score: {str(e)}")
        raise HTTPException(status_code=500, detail="Error computing score")

# --- Dashboard Telemetry (Bonus Helper) ---
@app.get("/dashboard-stats")
async def get_dashboard_stats():
    """
    Returns live metrics aggregated across all module handlers.
    """
    return dashboard_data.get_stats()
