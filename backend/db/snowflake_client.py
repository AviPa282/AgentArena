import snowflake.connector
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return snowflake.connector.connect(
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        database=os.getenv("SNOWFLAKE_DATABASE"),
        schema=os.getenv("SNOWFLAKE_SCHEMA"),
        warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
        role=os.getenv("SNOWFLAKE_ROLE"), 
    )

conn = get_connection()

def log_event(scenario, agent, action, message, risk, flagged, turn):
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO agent_events
        (scenario, agent_name, action_type, message, risk_score, flagged, turn_num)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (scenario, agent, action, message, risk, flagged, turn))
    conn.commit()
    cur.close()

def get_events(scenario, limit=100):
    cur = conn.cursor()
    cur.execute("""
        SELECT ts, agent_name, action_type, message,
               risk_score, flagged, turn_num
        FROM agent_events
        WHERE scenario = %s
        ORDER BY ts DESC LIMIT %s
    """, (scenario, limit))
    rows = cur.fetchall()
    cur.close()
    return rows

def get_threat_data(limit=200):
    cur = conn.cursor()
    cur.execute("SELECT * FROM threat_data LIMIT %s", (limit,))
    rows = cur.fetchall()
    cur.close()
    return rows

def get_forensic(scenario):
    cur = conn.cursor()
    cur.execute("""
        SELECT e.ts, e.agent_name, e.message,
               e.risk_score, e.flagged, e.turn_num,
               t.threat_type, t.severity, t.detection_flag
        FROM agent_events e
        LEFT JOIN threat_data t
          ON CONTAINS(e.message, t.source_ip)
        WHERE e.scenario = %s
        ORDER BY e.turn_num ASC
    """, (scenario,))
    cols = [d[0] for d in cur.description]
    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
    cur.close()
    return rows

def get_analytics():
    cur = conn.cursor()
    cur.execute("""
        SELECT scenario, agent_name,
               ROUND(AVG(risk_score), 3) AS avg_risk,
               COUNT(*) AS total_events,
               SUM(CASE WHEN flagged THEN 1 ELSE 0 END) AS flags
        FROM agent_events
        GROUP BY scenario, agent_name
        ORDER BY avg_risk DESC
    """)
    cols = [d[0] for d in cur.description]
    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
    cur.close()
    return rows