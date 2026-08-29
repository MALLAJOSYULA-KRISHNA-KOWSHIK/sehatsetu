from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from app.routers import auth, user, facilities, doctors, appointments, health_records, reminders, health_info, escalations, chat, emergency, hospital, voice

load_dotenv()

# Configure logging so we can see Overpass / external API errors
logging.basicConfig(level=logging.INFO)
logging.getLogger("app.services.leapleaf_client").setLevel(logging.DEBUG)

app = FastAPI(
    title="SehatSetu API",
    description="Backend API for SehatSetu digital healthcare platform",
    version="1.0.0",
)

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
os.makedirs("uploads/records", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(facilities.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(health_records.router)
app.include_router(reminders.router)
app.include_router(health_info.router)
app.include_router(escalations.router)
app.include_router(chat.router)
app.include_router(emergency.router)
app.include_router(hospital.router)
app.include_router(voice.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to SehatSetu API"}
