import os
import instructor
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from fastapi import APIRouter
import asyncio

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatMessage(BaseModel):
    message: str
    language: str = "en"

class ChatResponse(BaseModel):
    response: str
    category: str
    requires_escalation: bool
    suggested_actions: List[str]
    urgency: str = "LOW"
    action: str = "NONE"

def _get_llm_client():
    return instructor.from_openai(OpenAI(
        base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1"),
        api_key="ollama",
        timeout=30.0
    ))

class AssistantResponse(BaseModel):
    intent: Literal["RESPOND", "ESCALATE"] = Field(description="Use ESCALATE if professional care is needed. Use RESPOND for general info.")
    urgency: Literal["LOW", "MEDIUM", "HIGH"] = Field(description="LOW for general info, MEDIUM for persistent symptoms, HIGH for emergencies.")
    reason: str = Field(description="Short explanation of why professional care is recommended.")
    recommended_facility: Literal["NONE", "AAM", "PHC", "CHC", "HOSPITAL", "EMERGENCY"] = Field(description="The recommended facility type")
    action: Literal["NONE", "BOOK_APPOINTMENT", "FIND_FACILITY", "EMERGENCY_ASSISTANCE"] = Field(description="The action the user should take")
    requires_immediate_attention: bool = Field(description="True if the situation is life-threatening")
    conversational_reply: str = Field(description="The natural language conversational reply to the user. This MUST be in the requested language.")
@router.post("/message", response_model=ChatResponse)
async def chat_interaction(chat: ChatMessage):
    msg = chat.message.lower()
    
    # 1. Immediate Safety Override for Emergencies
    emergency_keywords = [
        "emergency", "accident", "heart attack", "bleeding", "stroke", "suicide", "breath", "chest pain","unconscious","high","high intensity","severe",
        "ఎమర్జెన్సీ", "అత్యవసర", "ప్రమాదం", "గుండెపోటు", "రక్తస్రావం", "పక్షవాతం", "ఆత్మహత్య", "ఊపిరి", "శ్వాస", "ఛాతీ నొప్పి", "అపస్మారక", "తీవ్రమైన",
        "आपातकाल", "दुर्घटना", "एक्सीडेंट", "दिल का दौरा", "हार्ट अटैक", "खून बह रहा", "रक्तस्राव", "लकवा", "आत्महत्या", "सांस", "साँस", "सीने में दर्द", "छाती में दर्द", "बेहोश", "गंभीर", "तेज"
    ]
    if any(keyword in msg for keyword in emergency_keywords):
        return ChatResponse(
            response="This sounds like a medical emergency. Please contact emergency services immediately or visit the nearest hospital.",
            category="EMERGENCY",
            requires_escalation=True,
            suggested_actions=["Call 112", "Find Nearest Emergency Facility"],
            urgency="HIGH",
            action="EMERGENCY_ASSISTANCE"
        )
        
    # 2. LLM-based Home Remedy Guidance
    client = _get_llm_client()
    
    target_lang = "Telugu" if chat.language == "te" else "English"
    
    base_prompt = f"""You are the SehatSetu healthcare navigation assistant. Your role is to provide safe health guidance, understand the user's needs, and connect the user to an appropriate healthcare professional when necessary.
    
CRITICAL LANGUAGE INSTRUCTION:
You MUST respond entirely in {target_lang}. The 'conversational_reply' field MUST be in {target_lang}.

### 1. Do NOT diagnose
Never claim to definitively diagnose a disease or medical condition.
Do not say: "You definitely have..." or "You don't need a doctor."
Instead, explain that symptoms can have multiple causes and recommend appropriate professional care when needed.

### 2. Identify when escalation is necessary
Escalate the user to a healthcare professional (intent="ESCALATE") when:
* Symptoms are persistent, worsening, severe, unusual, or unclear.
* The user reports multiple concerning symptoms.
* The user asks for diagnosis of a potentially serious condition.
* The user explicitly asks to speak with a doctor, nurse, or healthcare worker.

### 3. Emergency escalation
Immediately treat the situation as potentially urgent (HIGH) when the user reports symptoms such as:
* Severe chest pain, breathing difficulty, loss of consciousness, severe bleeding, sudden weakness, confusion, seizure, trauma, suspected stroke/heart attack, severe allergic reaction, poisoning, suicidal thoughts.
For emergencies: Tell the user to seek emergency medical help immediately. Do not delay with unnecessary conversation.

### 4. Escalation levels
LOW: General health info, mild non-concerning symptoms. Provide info and advise monitoring.
MEDIUM: Persistent/worsening symptoms requiring clinical assessment. Action: BOOK_APPOINTMENT or FIND_FACILITY.
HIGH: Potentially life-threatening. Action: EMERGENCY_ASSISTANCE.

### 5. Patient-friendly communication
When escalating, use simple language. Never block access to healthcare. ONLY suggest safe, natural home remedies. ABSOLUTELY DO NOT prescribe medications or suggest specific drug names.
"""

    telugu_rules = """
TELUGU RESPONSE RULES
* Answer the question directly in natural, conversational Telugu.
* Use simple Telugu that an ordinary person would understand.
* Use commonly understood medical words such as డాక్టర్, అంబులెన్స్, హాస్పిటల్, టాబ్లెట్, ఇంజెక్షన్.
* Do NOT translate word-by-word. NEVER invent Telugu words.
* Ensure the Telugu is grammatically correct and meaningful.
* Do not output corrupted phrases such as: "సమర్థన ప్రకారం", "సుమారు నీక్క నీ మంచి నీరు".
"""

    english_rules = """
ENGLISH RESPONSE RULES
* Answer the question directly in natural, conversational English.
* Keep the response concise and empathetic.
* Ensure the grammar is correct and professional.
"""

    system_prompt = base_prompt + (telugu_rules if target_lang == "Telugu" else english_rules) + f"""
OUTPUT RULE
Return ONLY the conversational answer. Do not output internal reasoning, translations, or markdown.

CORE RULE:
{target_lang.upper()} INPUT → UNDERSTAND MEANING → ANSWER DIRECTLY IN NATURAL {target_lang.upper()}
"""


    try:
        # Re-enable instructor to enforce JSON output for the Escalation Protocol
        response_data = await asyncio.to_thread(
            client.chat.completions.create,
            model="qwen2.5:3b",
            response_model=AssistantResponse,
            messages=[
                {"role": "system", "content": system_prompt.strip()},
                {"role": "user", "content": chat.message}
            ],
            temperature=0.3
        )
        
        return ChatResponse(
            response=response_data.conversational_reply,
            category=response_data.intent,
            requires_escalation=(response_data.intent == "ESCALATE"),
            suggested_actions=[response_data.action] if response_data.action != "NONE" else [],
            urgency=response_data.urgency,
            action=response_data.action
        )
    except Exception as e:
        import logging
        logging.error(f"LLM Chat Error: {e}")
        return ChatResponse(
            response="I'm sorry, I cannot process your request right now. Please drink some water and rest.",
            category="HOME_REMEDY",
            requires_escalation=False,
            suggested_actions=["Find Hospital", "Book Appointment"],
            urgency="LOW",
            action="NONE"
        )
