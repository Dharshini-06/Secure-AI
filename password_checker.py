import re

def check_strength(password: str) -> str:
    """
    Checks password strength based on length, uppercase/lowercase letters, numbers, and symbols.
    """
    length_ok = len(password) >= 8
    has_upper = re.search(r'[A-Z]', password) is not None
    has_lower = re.search(r'[a-z]', password) is not None
    has_num = re.search(r'[0-9]', password) is not None
    has_sym = re.search(r'[^A-Za-z0-9]', password) is not None
    
    score = sum([length_ok, has_upper, has_lower, has_num, has_sym])
    
    if score < 3:
        return "Weak"
    elif score == 3 or score == 4:
        return "Medium"
    else:
        return "Strong"

def breach_simulation(password: str) -> dict:
    """
    Checks if the password contains common/easily guessable patterns.
    """
    pw_lower = password.lower()
    risky_patterns = ["123", "password", "admin", "qwerty", "letmein"]
    
    for pattern in risky_patterns:
        if pattern in pw_lower:
            return {"risky": True, "reason": f"Contains commonly breached or risky pattern: '{pattern}'"}
            
    return {"risky": False, "reason": "No obvious breach patterns detected"}
