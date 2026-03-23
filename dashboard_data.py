# In-memory storage for simple analytics metrics

dashboard_stats = {
    "total_scans": 0,
    "phishing_detected": 0,
    "weak_passwords": 0
}

def record_scan():
    dashboard_stats["total_scans"] += 1

def record_phishing():
    dashboard_stats["phishing_detected"] += 1

def record_weak_password():
    dashboard_stats["weak_passwords"] += 1

def get_stats() -> dict:
    return dashboard_stats
