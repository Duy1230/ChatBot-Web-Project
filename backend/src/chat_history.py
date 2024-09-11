import uuid
import sqlite3
import time


def create_session_id():
    # get current time
    current_time = int(time.time())
    return current_time


def initialize_session_table():
    conn = sqlite3.connect('chatbot.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS sessions
                 (session_id TEXT PRIMARY KEY,
                  table_name TEXT)''')
    conn.commit()
    conn.close()


def start_new_session():
    session_id = str(uuid.uuid4()).replace(
        '-', '_')  # Generate a unique session ID
    table_name = f"chat_history_{session_id}"

    # Create a new table for the chat session
    conn = sqlite3.connect('chatbot.db')
    c = conn.cursor()
    c.execute(f'''CREATE TABLE IF NOT EXISTS {table_name}
                  (id INTEGER PRIMARY KEY AUTOINCREMENT,
                   role TEXT,
                   content TEXT)''')
    conn.commit()
    conn.close()

    # Save session ID and table name to the sessions table
    conn = sqlite3.connect('chatbot.db')
    c = conn.cursor()
    c.execute('INSERT INTO sessions (session_id, table_name) VALUES (?, ?)',
              (session_id, table_name))
    conn.commit()
    conn.close()

    return session_id


def store_message_in_session(session_id, role, content):
    conn = sqlite3.connect('chatbot.db')
    c = conn.cursor()

    # Retrieve the table name for the session ID
    c.execute('SELECT table_name FROM sessions WHERE session_id = ?', (session_id,))
    table_name = c.fetchone()[0]

    # Insert the message into the correct table
    c.execute(f'INSERT INTO {
              table_name} (role, content) VALUES (?, ?)', (role, content))
    conn.commit()
    conn.close()


def load_history_by_session(session_id):
    conn = sqlite3.connect('chatbot.db')
    c = conn.cursor()

    # Retrieve the table name for the session ID
    c.execute('SELECT table_name FROM sessions WHERE session_id = ?', (session_id,))
    table_name = c.fetchone()[0]

    # Fetch the chat history from the corresponding table
    c.execute(f'SELECT role, content FROM {table_name}')
    rows = c.fetchall()
    conn.close()
    return rows


def load_all_sessions():
    conn = sqlite3.connect('chatbot.db')
    c = conn.cursor()
    c.execute('SELECT * FROM sessions')
    rows = c.fetchall()
    conn.close()
    return [row[1] for row in rows]
