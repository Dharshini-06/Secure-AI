import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Automatically load environment variables from .env
load_dotenv()

# Connect using environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Initialize the Supabase client
supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"[!] Supabase connection error: {e}")

def save_scan(type, input_data, result, score):
    """
    Inserts a new scan log into the Supabase database.
    - Insert into table: scan_logs
    - Columns: type, input_data, result, score
    - Print success or error
    """
    if not supabase:
        print("[!] Database not connected. Data could not be saved.")
        return None

    try:
        # Prepare the payload
        data = {
            "type": type,
            "input_data": input_data,
            "result": result,
            "score": score
        }
        
        # Insert into scan_logs table
        response = supabase.table("scan_logs").insert(data).execute()
        
        # Check if successful (supabase-py usually raises exception on failure, but we print success if it proceeds)
        print(f"[+] Scan successfully stored in Supabase: {type}")
        return response
    except Exception as e:
        print(f"[!] Error saving to database: {e}")
        return None
