import pandas as pd
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.snowflake_client import conn
from dotenv import load_dotenv
load_dotenv()

def severity_from_attack(attack_type: str) -> str:
    high = {"ddos", "c2", "exploit-attempt", "command-injection"}
    medium = {"brute-force", "sql-injection", "credential-stuffing"}
    low = {"port-scan", "xss", "benign"}
    if attack_type in high:
        return "high"
    if attack_type in medium:
        return "medium"
    return "low"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
df = pd.read_csv(os.path.join(BASE_DIR, "cybersecurity.csv"))

# Keep all 400 threats + 100 benign rows for context
threats = df[df["label"] == 1]
benign_sample = df[df["label"] == 0].sample(100, random_state=42)
combined = pd.concat([threats, benign_sample]).reset_index(drop=True)

print(f"Importing {len(combined)} rows to Snowflake...")

cur = conn.cursor()

rows = [
    (
        str(row["src_ip"]),
        str(row["attack_type"]),
        severity_from_attack(str(row["attack_type"])),
        bool(row["label"]),
        str(row["url"]) if pd.notna(row["url"]) else ""
    )
    for _, row in combined.iterrows()
]

cur.executemany("""
    INSERT INTO threat_data
    (source_ip, threat_type, severity, detection_flag, raw_payload)
    VALUES (%s, %s, %s, %s, %s)
""", rows)

conn.commit()
cur.close()
print(f"Done. {len(rows)} rows imported successfully.")