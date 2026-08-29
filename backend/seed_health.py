import asyncio
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import sessionmaker
from app.database import engine
from app.models.health_info import HealthInformation

async def seed_health():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    health_data = [
        {
            "title": "Managing High Blood Pressure",
            "category": "Cardiology",
            "description": "High blood pressure (hypertension) is a common condition in which the long-term force of the blood against your artery walls is high enough that it may eventually cause health problems, such as heart disease.",
            "symptoms": "Most people with high blood pressure have no signs or symptoms, even if blood pressure readings reach dangerously high levels. A few people may have headaches, shortness of breath or nosebleeds.",
            "general_precautions": "Eat a heart-healthy diet with less salt, get regular physical activity, maintain a healthy weight, limit alcohol, and don't smoke.",
            "when_to_seek_care": "Have your blood pressure checked at least every two years starting at age 18. If you're age 40 or older, ask your doctor for a blood pressure reading every year.",
            "emergency_warning_signs": "Severe headaches, chest pain, dizziness, difficulty breathing, nausea, vomiting, blurred vision or other vision changes."
        },
        {
            "title": "Recognizing Stroke Symptoms",
            "category": "Emergency",
            "description": "A stroke occurs when the blood supply to part of your brain is interrupted or reduced, preventing brain tissue from getting oxygen and nutrients. Brain cells begin to die in minutes.",
            "symptoms": "Trouble speaking and understanding what others are saying, paralysis or numbness of the face, arm or leg, problems seeing in one or both eyes, headache, trouble walking.",
            "general_precautions": "Control high blood pressure, lower cholesterol, quit tobacco use, control diabetes, maintain a healthy weight.",
            "when_to_seek_care": "Seek immediate medical attention if you notice any signs or symptoms of a stroke, even if they seem to come and go or they disappear completely.",
            "emergency_warning_signs": "Think FAST: Face drooping, Arm weakness, Speech difficulty, Time to call 112/911. Any sudden numbness, confusion, trouble seeing, trouble walking, or severe headache with no known cause."
        },
        {
            "title": "Preventing Dehydration in Children",
            "category": "Pediatrics",
            "description": "Dehydration occurs when your child loses more fluids than they take in. If it isn't treated, it can get worse and become a serious problem. Severe dehydration is a medical emergency.",
            "symptoms": "Dry mouth and tongue, no tears when crying, no wet diapers for three hours, sunken eyes, cheeks, sunken soft spot on top of skull, listlessness or irritability.",
            "general_precautions": "Give plenty of fluids when child is sick. Offer oral rehydration solutions. Do not give plain water to infants. Avoid juices or sodas as they can make diarrhea worse.",
            "when_to_seek_care": "Contact a doctor if the child has had diarrhea for 24 hours or more, is irritable or disoriented, cannot keep down fluids, or has bloody or black stool.",
            "emergency_warning_signs": "Extreme thirst, extreme fussiness or sleepiness in infants, sunken eyes, lack of urination for 8 hours, fast heartbeat, or rapid breathing."
        },
        {
            "title": "First Aid for Minor Burns",
            "category": "First Aid",
            "description": "Minor burns are first-degree burns and second-degree burns that are no larger than 3 inches (about 8 centimeters) in diameter. These can usually be treated at home.",
            "symptoms": "Redness, mild pain, swelling, and sometimes small blisters. The skin may peel after a day or two.",
            "general_precautions": "Keep dangerous objects like hot drinks, irons, and curling irons out of reach of children. Set water heater thermostats no higher than 120°F (48.9°C).",
            "when_to_seek_care": "If the burn covers a large area of the body, involves the face, hands, feet, groin, buttocks, or a major joint, or if the burn looks deep or leathery.",
            "emergency_warning_signs": "Signs of infection, such as increased pain, redness, swelling, oozing, or a fever. Burns that cause white or charred skin (third-degree burns)."
        },
        {
            "title": "Understanding Type 2 Diabetes",
            "category": "Endocrinology",
            "description": "Type 2 diabetes is an impairment in the way the body regulates and uses sugar (glucose) as a fuel. This long-term (chronic) condition results in too much sugar circulating in the bloodstream.",
            "symptoms": "Increased thirst, frequent urination, increased hunger, unintended weight loss, fatigue, blurred vision, slow-healing sores, frequent infections.",
            "general_precautions": "Eat healthy foods, get active, lose weight if overweight, avoid inactivity for long periods.",
            "when_to_seek_care": "If you notice any possible diabetes symptoms, contact your doctor. The earlier the condition is diagnosed, the sooner treatment can begin.",
            "emergency_warning_signs": "Very high blood sugar (hyperglycemia) leading to diabetic coma, or very low blood sugar (hypoglycemia) leading to seizures or loss of consciousness."
        }
    ]

    async with async_session() as session:
        for data in health_data:
            # Check if exists
            stmt = select(HealthInformation).where(HealthInformation.title == data["title"])
            result = await session.execute(stmt)
            if not result.scalars().first():
                new_info = HealthInformation(**data)
                session.add(new_info)
        
        await session.commit()
        print("Health information seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_health())
