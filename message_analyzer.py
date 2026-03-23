def analyze_message(message: str) -> dict:
    """
    Analyzes a message text for phishing indicators.
    Uses simple rule-based logic to detect urgent prompts and verification links.
    """
    message_lower = message.lower()
    phishing_keywords = ['urgent', 'verify', 'click now', 'win money', 'account suspended', 'login now']
    
    reasons = []
    score = 0
    
    # Keyword Detection
    for kw in phishing_keywords:
        if kw in message_lower:
            score += 25
            reasons.append(f"Suspicious keyword found: '{kw}'")
    
    # Determine status based on heuristic score
    status = "safe"
    if score >= 50:
        status = "phishing"
    elif score >= 25:
        status = "suspicious"
        
    # Calculate an arbitrary confidence score
    confidence = min(100, score + 40) if score > 0 else 80
    
    return {
        "status": status,
        "confidence": confidence,
        "reasons": reasons,
        "score": min(score, 100)
    }
