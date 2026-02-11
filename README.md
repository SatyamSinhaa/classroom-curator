# Classroom Curator

Classroom Curator is an AI-powered educational tool designed to assist teachers in creating lesson plans, assessments, and managing classroom content efficiently.

## Project Structure

- `client/`: Frontend application built with React and Vite.
- `server/`: Backend API built with FastAPI and Python.

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **Python** (v3.9 or higher recommended)
- **MySQL Database**
- **Supabase Account** (for authentication)
- **Gemini API Key** (for AI features)
- **Pinecone Account** (for vector search)

---

### Backend Setup (Server)

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Create a `.env` file in the `server` directory and add the following:
   ```env
   DATABASE_URL=mysql+pymysql://<user>:<password>@<host>/<database_name>
   GEMINI_API_KEY=your_gemini_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX_NAME=your_pinecone_index_name
   ```

5. **Run the server:**
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`.

---

### Frontend Setup (Client)

1. **Navigate to the client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the `client` directory and add the following:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

---

## Features

- **Automated Lesson Planning**: Generate structured lesson plans with AI.
- **Assessment Builder**: Create quizzes and assessments based on taught topics.
- **Pinecone Integration**: Efficient vector search for educational content.
- **Supabase Authentication**: Secure login for teachers and administrators.
- **Voice Support**: Integrated TTS for lesson accessibility.

## License

[Add License Information Here]
