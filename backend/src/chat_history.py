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
    try:
        c.execute('INSERT INTO sessions (session_id, table_name, description) VALUES (?, ?, ?)',
                  (session_id, table_name, "New Chat"))
        conn.commit()
    except sqlite3.Error as e:
        print(f"Error creating session: {e}")
    finally:
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
    return [row[1] for row in rows], [row[2] for row in rows]


def add_a_column_to_table(table_name, column_name, column_type):
    conn = sqlite3.connect('chatbot.db')
    c = conn.cursor()
    c.execute(f'ALTER TABLE {table_name} ADD COLUMN {
              column_name} {column_type}')
    conn.commit()
    conn.close()
    print(f"Column {column_name} added to table {table_name}")


def update_a_column(table_name, column_name, column_value):
    conn = sqlite3.connect('chatbot.db')
    c = conn.cursor()
    try:
        c.execute(f'UPDATE {table_name} SET {
                  column_name} = ?', (column_value,))
        conn.commit()
        print(f"Column {column_name} updated in table {table_name}")
    except sqlite3.Error as e:
        print(f"Error updating column {
              column_name} in table {table_name}: {e}")
    finally:
        conn.close()


def general_update(query: str, params: tuple):
    conn = sqlite3.connect('chatbot.db')
    c = conn.cursor()
    try:
        if "DROP TABLE" in query:
            # Directly execute the query without parameters for DROP TABLE
            c.execute(query.replace("?", params[0]))
        else:
            c.execute(query, params)
        conn.commit()
        print("Query executed successfully")
    except sqlite3.Error as e:
        print(f"Error executing query: {e}")
        raise e
    finally:
        conn.close()
