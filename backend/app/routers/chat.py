import os
import instructor
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List, Optional
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

def _get_llm_client():
    return instructor.from_openai(OpenAI(
        base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1"),
        api_key="ollama",
        timeout=30.0
    ))

class AssistantResponse(BaseModel):
    reply: str = Field(description="The short conversational response or basic home remedy (1-2 sentences max)")

@router.post("/message", response_model=ChatResponse)
async def chat_interaction(chat: ChatMessage):
    msg = chat.message.lower()
    
    # 1. Immediate Safety Override for Emergencies
    emergency_keywords = ["emergency", "accident", "heart attack", "bleeding", "stroke", "suicide", "breath", "chest pain"]
    if any(keyword in msg for keyword in emergency_keywords):
        return ChatResponse(
            response="This sounds like a medical emergency. Please contact emergency services immediately or visit the nearest hospital.",
            category="EMERGENCY",
            requires_escalation=True,
            suggested_actions=["Call 112", "Find Nearest Emergency Facility"]
        )
        
    # 2. LLM-based Home Remedy Guidance
    client = _get_llm_client()
    
    target_lang = "Telugu" if chat.language == "te" else "English"
    
    base_prompt = f"""You are a healthcare conversational assistant for a rural healthcare platform.
    
CRITICAL LANGUAGE INSTRUCTION:
You MUST respond entirely in {target_lang}.
If the user asks in {target_lang}, answer ONLY in {target_lang}. Do not mix languages unless using universally understood terms.

HEALTHCARE SAFETY & SIMPLICITY
* Do not diagnose with certainty.
* Do not invent medical information, hospital names, doctor names, phone numbers, ambulance numbers, or availability.
* If the situation appears life-threatening, clearly advise the user to seek emergency medical care.
* Do not delay emergency guidance with unnecessary questions.
* ONLY suggest safe, natural home remedies (like resting, drinking water, or cooling down). 
* ABSOLUTELY DO NOT prescribe medications or suggest specific drug names (e.g., do not mention paracetamol, ibuprofen, etc.).
* DO NOT use complex medical terminology. Use extremely simple, everyday language as if speaking to a rural user with no medical background.
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
        # Run synchronous OpenAI call without strict Instructor JSON formatting to prevent code hallucinations in non-English
        raw_client = OpenAI(
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1"),
            api_key="ollama",
            timeout=30.0
        )
        result = await asyncio.to_thread(
            raw_client.chat.completions.create,
            model="qwen2.5:3b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": chat.message}
            ],
            temperature=0.3
        )
        remedy_text = result.choices[0].message.content.strip()
    except Exception as e:
        import logging
        logging.error(f"LLM Chat Error: {e}")
        remedy_text = "I'm sorry, I cannot process your request right now. Please drink some water and rest."
    
    return ChatResponse(
        response=remedy_text,
        category="HOME_REMEDY",
        requires_escalation=False,
        suggested_actions=["Find Hospital", "Book Appointment"]
    )
