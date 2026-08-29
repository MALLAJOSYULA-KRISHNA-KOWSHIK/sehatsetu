# 🎙️ SehatSetu Voice Navigation Interface

The Voice Navigation feature in SehatSetu allows rural and remote users, especially those with limited digital literacy or physical impairments, to navigate the platform, find hospitals, and book appointments entirely hands-free. This system is natively integrated with our multi-lingual support, allowing users to speak in their native languages (e.g., Hindi, Telugu, English) and receive a localized voice response.

## 🏗️ Architecture Overview

The system consists of two main components:
1. **Frontend Voice Capture & Execution:** Uses the browser's native Web Speech API for Speech-To-Text (STT) and Text-To-Speech (TTS).
2. **Backend Intent Parsing (Local LLM):** Uses a local LLM (`qwen2.5:3b` via Ollama) and `instructor` to deterministically map user utterances to application routes and medical specialties.

---

## 💻 Frontend Implementation

**Location:** `frontend/src/pages/LandingPage.jsx`

### 1. Speech Recognition (STT)
The frontend utilizes `window.SpeechRecognition` (or `webkitSpeechRecognition`) to capture user audio.
- When the microphone button is clicked, it listens to the user's speech.
- Once speech ends, the transcribed text is captured.

### 2. API Communication
The transcript, along with the user's currently selected language, is sent to the backend endpoint `/api/v1/voice/parse`.

### 3. Speech Synthesis (TTS) & Navigation
Upon receiving the structured response from the backend:
- **TTS:** The browser's `window.speechSynthesis` API speaks the localized `tts_feedback` string returned by the backend.
- **Routing:** Based on the returned `intent` and `specialty`, the React Router redirects the user to the appropriate page (e.g., `/find-care`, `/appointments`).

---

## ⚙️ Backend Implementation

**Location:** `backend/app/routers/voice.py`

### 1. The Endpoint
`POST /api/v1/voice/parse` accepts a `VoiceRequest` payload:
```json
{
  "user_text": "Mera pet bahut dard kar raha hai, koi aspatal batao",
  "selected_language": "Hindi"
}
```

### 2. Local LLM Intent Parsing
To guarantee privacy, low latency, and offline-first capabilities, the application uses a local Large Language Model (`qwen2.5:3b`) served via **Ollama**.
- **Model:** `qwen2.5:3b`
- **Port:** Configured to hit Ollama at `http://localhost:11434/v1`

### 3. Deterministic JSON with `instructor`
The backend uses the `instructor` Python library wrapped around the OpenAI client. This forces the LLM to output a strict JSON payload that matches the `NavigationCommand` Pydantic schema:

```python
class NavigationCommand(BaseModel):
    intent: Literal["book_appointment", "find_hospital", "medicine_reminder", "view_records", "clarify"]
    specialty: Literal["General Medicine", "Orthopedics", "Cardiology", "Pediatrics", "Gynecology", "Ophthalmology", "None"]
    tts_feedback: str
```

### 4. The System Prompt
The LLM is prompted with strict rules:
- Act as a routing engine.
- Output **ONLY** valid JSON.
- Provide `tts_feedback` strictly in the `selected_language` (kept under 15 words).
- Map symptoms to standard medical departments (e.g., "stomach pain" -> "General Medicine").

### Example Output
```json
{
  "intent": "find_hospital",
  "specialty": "General Medicine",
  "tts_feedback": "मैं आपके आस-पास के अस्पताल ढूंढ रहा हूँ।"
}
```

---

## 🚀 Setup & Requirements

1. **Ollama:** Ensure you have Ollama installed and running on your system.
2. **Pull the Model:**
   ```bash
   ollama run qwen2.5:3b
   ```
3. **Environment:** If Ollama is running on a different machine or port, update the `OLLAMA_BASE_URL` environment variable in your backend `.env` file.
4. **Browser Support:** The feature relies on the Web Speech API, which is best supported on Google Chrome, Edge, and Safari. Ensure microphone permissions are granted.
