from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal, Optional
import instructor
from openai import OpenAI
import os
import logging
import asyncio
import re
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

router = APIRouter()

SYSTEM_PROMPT = """You are a healthcare voice assistant for SehatSetu. Analyze the user's speech and extract:
1. intent: What they want to do
2. specialty: Medical department if mentioned
3. tts_feedback: Short reply in {selected_language} (under 12 words)

INTENTS: book_appointment, find_hospital, medicine_reminder, view_records, emergency, navigate_home, navigate_profile, clarify
SPECIALTIES: General Medicine, Orthopedics, Cardiology, Pediatrics, Gynecology, Ophthalmology, Dermatology, ENT, Neurology, None

User said: "{user_input}"
Language: {selected_language}

Reply ONLY with valid JSON."""

class VoiceRequest(BaseModel):
    user_text: str
    selected_language: str

class NavigationCommand(BaseModel):
    intent: str
    specialty: str = "None"
    tts_feedback: str = ""
    extracted_date: Optional[str] = None
    extracted_time: Optional[str] = None
    extracted_doctor_name: Optional[str] = None
    transcript: str = ""

# ─── Keyword-based intent router (fast, reliable) ───────────────────────────

KEYWORD_RULES = [
    # Book appointment keywords (EN, HI, TE)
    {
        "patterns": [
            r"(book|appointment|appoint|schedule|checkup|dikhana|dikhao|అపాయింట్మెంట్|డాక్టర్|చెక్-అప్|చూపించుకోవాలి|బుక్|अपॉइंटमेंट|डॉक्टर|चेकअप|दिखाना|बुक)",
            r"(doctor\s*(?:ko|se|ni)\s*dikha|doctor\s*dekhna|doctor.*milna)",
            r"(doctor.*(?:book|see|visit|meet|consult))",
            r"((?:book|see|visit|meet|consult).*doctor)",
        ],
        "intent": "book_appointment"
    },
    # Find hospital keywords
    {
        "patterns": [
            r"(hospital|clinic|find\s*care|nearby|aspatal|aspataal|davakhana|aasupatri|dispensary|ఆసుపత్రి|క్లినిక్|దగ్గరలో|ఎక్కడ|अस्पताल|क्लीनिक|आसपास|कहाँ)",
            r"((?:find|search|near|closest|nearest).*(?:hospital|clinic|care|doctor))",
            r"((?:hospital|clinic).*(?:find|search|near|closest|nearest|kahan|kidhar|ekkada))",
        ],
        "intent": "find_hospital"
    },
    # Medicine reminder keywords
    {
        "patterns": [
            r"(reminder|medicine|pill\b|tablet|dawa|dawai|goli|mandu|maathra|మందులు|మాత్రలు|రిమైండర్|గుర్తు|दवा|गोली|रिमाइंडर|याद)",
            r"(remind.*(?:medicine|pill|tablet|dawa))",
        ],
        "intent": "medicine_reminder"
    },
    # View records keywords
    {
        "patterns": [
            r"(record|report|blood\s*test|lab\b|prescription|x[\s-]?ray|scan\b|medical\s*history|రికార్డులు|రిపోర్టులు|పరీక్ష|చరిత్ర|రికార్డ్|रिपोर्ट|जांच|इतिहास|रिकॉर्ड)",
            r"((?:show|view|see|open|check|my).*(?:record|report|test|prescription|document))",
        ],
        "intent": "view_records"
    },
    # Emergency keywords
    {
        "patterns": [
            r"(emergency|ambulance|911|112|urgent|sos|help\s*me|bachao|madad|ఎమర్జెన్సీ|ఆంబులెన్స్|సహాయం|అత్యవసర|आपातकाल|एम्बुलेंस|मदद|बचाओ)",
            r"(accident|heart\s*attack|bleeding|stroke|suicide|breath|chest\s*pain|unconscious|high\s*intensity|high|severe|ప్రమాదం|గుండెపోటు|రక్తస్రావం|పక్షవాతం|ఆత్మహత్య|ఊపిరి|శ్వాస|ఛాతీ\s*నొప్పి|అపస్మారక|తీవ్రమైన|दुर्घटना|एक्सीडेंट|दिल\s*का\s*दौरा|हार्ट\s*अटैक|खून\s*बह\s*रहा|रक्तस्राव|लकवा|आत्महत्या|सांस|साँस|सीने\s*में\s*दर्द|छाती\s*में\s*दर्द|बेहोश|गंभीर|तेज)"
        ],
        "intent": "emergency"
    },
    # Navigation: Home/Dashboard
    {
        "patterns": [
            r"(\bhome\b|dashboard|main\s*page|go\s*(?:to\s*)?home|ghar|హోమ్|ఇల్లు|డాష్‌బోర్డ్|होम|घर|डैशबोर्ड)",
        ],
        "intent": "navigate_home"
    },
    # Navigation: Profile
    {
        "patterns": [
            r"(profile|my\s*account|setting|mera\s*(?:profile|account)|ప్రొఫైల్|అకౌంట్|ఖాతా|प्रोफाइल|अकाउंट|खाता)",
        ],
        "intent": "navigate_profile"
    },
]

SPECIALTY_KEYWORDS = {
    "Gynecology": [r"(pregnan|gyn|obstetric|mahila|garbh|stri|lady\s*doctor|delivery|women|periods|menstr|ప్రెగ్న|గర్భ|మహిళ|రుతు|प्रेगन|गर्भ|महिला|स्त्री)"],
    "Orthopedics": [r"(bone|fracture|joint|knee|leg\b|arm\b|ortho|haddi|pair\b|toot|kalu|eluka|sprain|ఎముక|కీళ్లు|కాలు|విరిగిన|हड्डी|पैर|जोड़|फ्रैक्चर)"],
    "Cardiology": [r"(heart|chest\s*pain|cardio|dil\b|hriday|seena|blood\s*pressure|\bbp\b|గుండె|ఛాతి|బీపీ|दिल|हृदय|सीने|छाती|बीपी)"],
    "Pediatrics": [r"(child|baby|kid\b|bachcha|infant|bacha|pillal|pediatr|పిల్ల|బిడ్డ|బాబు|పాప|बच्च|शिशु|बाल)"],
    "Ophthalmology": [r"(eye|vision|blind|aankhon|aankh|nayan|kannu|ophthal|cataract|spectacle|glass|కన్ను|కళ్లు|చూపు|దృష్టి|కళ్లద్దాలు|आंख|नेत्र|दृष्टि|चश्मा)"],
    "Dermatology": [r"(skin|rash|allergy|itching|khujli|charma|derma|pimple|acne|చర్మ|దురద|మచ్చ|త్వచ|खुजली|चर्म|दाने|मुंहासे)"],
    "ENT": [r"(\bear\b|nose|throat|sinus|\bent\b|kaan|naak|gala|చెవి|ముక్కు|గొంతు|ఈఎన్టీ|कान|नाक|गला)"],
    "General Medicine": [r"(fever|cold\b|cough|headache|stomach|pain\b|bukhar|dard|pet\b|sar\b|noppi|jvaram|vomit|diarr|జ్వరం|జలుబు|దగ్గు|నొప్పి|కడుపు|తల|వాంతులు|बुखार|सर्दी|खांसी|दर्द|पेट|सिर|उल्टी)"],
    "Neurology": [r"(brain|nerve|neuro|migraine|seizure|dimag|paralysis|మెదడు|నరం|మూర్చ|పక్షవాతం|दिमाग|नसों|मिर्गी|लकवा)"],
}


def keyword_route(text: str) -> dict:
    """Fast, deterministic keyword-based intent routing."""
    text_lower = text.lower().strip()
    
    # Detect intent
    detected_intent = None
    for rule in KEYWORD_RULES:
        for pattern in rule["patterns"]:
            if re.search(pattern, text_lower, re.IGNORECASE):
                detected_intent = rule["intent"]
                break
        if detected_intent:
            break
    
    # Detect specialty
    detected_specialty = "None"
    for specialty, patterns in SPECIALTY_KEYWORDS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                detected_specialty = specialty
                break
        if detected_specialty != "None":
            break
    
    # If we detected a specialty but no intent, default to book_appointment
    if detected_specialty != "None" and detected_intent is None:
        detected_intent = "book_appointment"
    
    return {
        "intent": detected_intent,
        "specialty": detected_specialty
    }


def extract_time(text: str) -> Optional[str]:
    """Extract time from voice text like '11am', '3:30 pm', '11:00', 'at 2 pm'."""
    text_lower = text.lower()
    
    # Match patterns like: 11:00 am, 3:30pm, 11 am, 2pm, at 11
    patterns = [
        r'(\d{1,2})\s*:\s*(\d{2})\s*(am|pm|a\.?m|p\.?m)',   # 11:00 am
        r'(\d{1,2})\s*:\s*(\d{2})',                           # 11:00
        r'(\d{1,2})\s*(am|pm|a\.?m|p\.?m)',                   # 11am, 3 pm
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text_lower)
        if match:
            groups = match.groups()
            if len(groups) == 3:  # hour:min am/pm
                hour, minute, period = int(groups[0]), groups[1], groups[2]
                if 'p' in period and hour != 12:
                    hour += 12
                elif 'a' in period and hour == 12:
                    hour = 0
                return f"{hour:02d}:{minute}"
            elif len(groups) == 2:
                if groups[1].isdigit():  # hour:min (no am/pm)
                    return f"{int(groups[0]):02d}:{groups[1]}"
                else:  # hour + am/pm
                    hour = int(groups[0])
                    period = groups[1]
                    if 'p' in period and hour != 12:
                        hour += 12
                    elif 'a' in period and hour == 12:
                        hour = 0
                    return f"{hour:02d}:00"
    return None


def extract_doctor_name(text: str) -> Optional[str]:
    """Extract doctor name from voice text like 'with dr sharma', 'doctor kumar', 'Dr. Reddy'."""
    text_lower = text.lower()
    
    patterns = [
        r'(?:with|by)?\s*(?:dr\.?|doctor)\s+([a-zA-Z]+)',    # dr sharma, doctor kumar
        r'([a-zA-Z]+)\s+(?:dr\.?|doctor)',                    # sharma doctor
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text_lower)
        if match:
            name = match.group(1).strip()
            # Filter out common non-name words
            skip_words = {'a', 'an', 'the', 'to', 'for', 'at', 'and', 'or', 'my', 'me', 'ni', 'ko', 'se', 'ka', 'ki', 'ke'}
            if name and name not in skip_words and len(name) > 1:
                return name.capitalize()
    return None


def extract_date(text: str) -> Optional[str]:
    """Extract date from voice text like 'tomorrow', 'next monday', 'august 30', '30th september', 'on 5th'."""
    text_lower = text.lower()
    today = datetime.now()
    
    # Relative dates
    if 'today' in text_lower:
        return today.strftime('%Y-%m-%d')
    if 'tomorrow' in text_lower:
        return (today + timedelta(days=1)).strftime('%Y-%m-%d')
    if 'day after tomorrow' in text_lower:
        return (today + timedelta(days=2)).strftime('%Y-%m-%d')
    
    # Next weekday
    weekdays = {'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3, 'friday': 4, 'saturday': 5, 'sunday': 6}
    for day_name, day_num in weekdays.items():
        if day_name in text_lower:
            days_ahead = day_num - today.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            return (today + timedelta(days=days_ahead)).strftime('%Y-%m-%d')
    
    # Month + day: "august 30", "september 5th", "30th august", "30 august"
    months = {'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
              'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12}
    
    for month_name, month_num in months.items():
        # "august 30th" or "august 30"
        match = re.search(rf'{month_name}\s+(\d{{1,2}})(?:st|nd|rd|th)?', text_lower)
        if match:
            day = int(match.group(1))
            year = today.year if month_num >= today.month else today.year + 1
            try:
                return datetime(year, month_num, day).strftime('%Y-%m-%d')
            except ValueError:
                pass
        # "30th august" or "30 august"
        match = re.search(rf'(\d{{1,2}})(?:st|nd|rd|th)?\s+{month_name}', text_lower)
        if match:
            day = int(match.group(1))
            year = today.year if month_num >= today.month else today.year + 1
            try:
                return datetime(year, month_num, day).strftime('%Y-%m-%d')
            except ValueError:
                pass
    
    # Just a date number: "on 5th", "on the 30th"
    match = re.search(r'(?:on\s+(?:the\s+)?)(\d{1,2})(?:st|nd|rd|th)?', text_lower)
    if match:
        day = int(match.group(1))
        # Assume current or next month
        month = today.month
        year = today.year
        if day < today.day:
            month += 1
            if month > 12:
                month = 1
                year += 1
        try:
            return datetime(year, month, day).strftime('%Y-%m-%d')
        except ValueError:
            pass
    
    return None


def _get_llm_client():
    return instructor.from_openai(OpenAI(
        base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1"),
        api_key="ollama",
        timeout=30.0
    ))


class LLMResponse(BaseModel):
    intent: Literal["book_appointment", "find_hospital", "medicine_reminder", "view_records", "emergency", "navigate_home", "navigate_profile", "clarify"]
    specialty: str = "None"
    tts_feedback: str = ""


def _run_llm_inference(formatted_prompt: str) -> LLMResponse:
    client = _get_llm_client()
    return client.chat.completions.create(
        model="qwen2.5:3b",
        response_model=LLMResponse,
        messages=[
            {"role": "system", "content": "You are a healthcare voice assistant. Reply ONLY with valid JSON."},
            {"role": "user", "content": formatted_prompt}
        ]
    )


# TTS feedback templates
TTS_TEMPLATES = {
    "book_appointment": {
        "English": "Opening appointment booking for you.",
        "Hindi": "आपके लिए अपॉइंटमेंट बुकिंग खोल रहा हूँ।",
        "Telugu": "మీ కోసం అపాయింట్‌మెంట్ బుకింగ్ తెరుస్తున్నాను."
    },
    "find_hospital": {
        "English": "Searching for nearby hospitals.",
        "Hindi": "आस-पास के अस्पताल ढूंढ रहा हूँ।",
        "Telugu": "సమీపంలోని ఆసుపత్రులను వెతుకుతున్నాను."
    },
    "medicine_reminder": {
        "English": "Opening your medicine reminders.",
        "Hindi": "आपके दवा अनुस्मारक खोल रहा हूँ।",
        "Telugu": "మీ మందుల రిమైండర్‌లు తెరుస్తున్నాను."
    },
    "view_records": {
        "English": "Opening your health records.",
        "Hindi": "आपके स्वास्थ्य रिकॉर्ड खोल रहा हूँ।",
        "Telugu": "మీ ఆరోగ్య రికార్డులు తెరుస్తున్నాను."
    },
    "emergency": {
        "English": "Opening emergency services.",
        "Hindi": "आपातकालीन सेवाएं खोल रहा हूँ।",
        "Telugu": "అత్యవసర సేవలు తెరుస్తున్నాను."
    },
    "navigate_home": {
        "English": "Going to home page.",
        "Hindi": "होम पेज पर जा रहा हूँ।",
        "Telugu": "హోమ్ పేజీకి వెళ్తున్నాను."
    },
    "navigate_profile": {
        "English": "Opening your profile.",
        "Hindi": "आपकी प्रोफ़ाइल खोल रहा हूँ।",
        "Telugu": "మీ ప్రొఫైల్ తెరుస్తున్నాను."
    },
    "clarify": {
        "English": "I didn't understand. Please try again.",
        "Hindi": "मुझे समझ नहीं आया। कृपया फिर से बोलें।",
        "Telugu": "నాకు అర్థం కాలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి."
    }
}

SPECIALTY_TTS = {
    "English": "Looking for {specialty} doctors.",
    "Hindi": "{specialty} के डॉक्टर ढूंढ रहा हूँ।",
    "Telugu": "{specialty} డాక్టర్లను వెతుకుతున్నాను."
}


def get_tts_feedback(intent: str, specialty: str, language: str) -> str:
    """Generate localized TTS feedback."""
    if intent in TTS_TEMPLATES and language in TTS_TEMPLATES[intent]:
        base = TTS_TEMPLATES[intent][language]
        if specialty != "None" and intent == "book_appointment":
            base = SPECIALTY_TTS.get(language, SPECIALTY_TTS["English"]).format(specialty=specialty)
        return base
    return TTS_TEMPLATES.get("clarify", {}).get(language, "Please try again.")


@router.post("/api/v1/voice/parse")
async def process_voice_command(request: VoiceRequest):
    text = request.user_text.strip()
    lang = request.selected_language
    
    if not text:
        raise HTTPException(status_code=400, detail="Empty voice input")
    
    # Step 1: Try fast keyword-based routing first
    kw_result = keyword_route(text)
    
    if kw_result["intent"]:
        intent = kw_result["intent"]
        specialty = kw_result["specialty"]
        tts = get_tts_feedback(intent, specialty, lang)
        ext_time = extract_time(text)
        ext_date = extract_date(text)
        ext_doctor = extract_doctor_name(text)
        
        logger.info(f"[KEYWORD] '{text}' → intent={intent}, specialty={specialty}, time={ext_time}, date={ext_date}, doctor={ext_doctor}")
        
        return NavigationCommand(
            intent=intent,
            specialty=specialty,
            tts_feedback=tts,
            extracted_date=ext_date,
            extracted_time=ext_time,
            extracted_doctor_name=ext_doctor,
            transcript=text
        ).model_dump()
    
    # Step 2: Fall back to LLM for ambiguous inputs
    try:
        formatted_prompt = SYSTEM_PROMPT.format(
            selected_language=lang,
            user_input=text
        )
        llm_response = await asyncio.to_thread(_run_llm_inference, formatted_prompt)
        
        intent = llm_response.intent
        specialty = llm_response.specialty if llm_response.specialty else "None"
        tts = llm_response.tts_feedback or get_tts_feedback(intent, specialty, lang)
        
        logger.info(f"[LLM] '{text}' → intent={intent}, specialty={specialty}")
        
        return NavigationCommand(
            intent=intent,
            specialty=specialty,
            tts_feedback=tts,
            transcript=text
        ).model_dump()
    except Exception as e:
        logger.error(f"LLM fallback failed: {e}")
        # Last resort: return clarify
        return NavigationCommand(
            intent="clarify",
            specialty="None",
            tts_feedback=get_tts_feedback("clarify", "None", lang),
            transcript=text
        ).model_dump()
