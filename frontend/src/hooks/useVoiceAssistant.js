import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const useVoiceAssistant = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState('');

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    setError(null);
    setTranscript('');
    
    const recognition = new SpeechRecognition();
    const langMap = { 'en': 'en-IN', 'hi': 'hi-IN', 'te': 'te-IN' };
    recognition.lang = langMap[i18n.language?.substring(0, 2)] || 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onerror = (e) => { 
      console.error("Speech recognition error:", e.error); 
      setIsListening(false);
      if (e.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permission.');
      } else if (e.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else if (e.error === 'aborted') {
        // User cancelled, no error needed
      } else {
        setError(`Speech error: ${e.error}`);
      }
    };
    
    recognition.onend = () => setIsListening(false);

    recognition.onresult = async (event) => {
      setIsListening(false);
      setIsProcessing(true);
      
      const heard = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      setTranscript(heard);
      console.log(`Voice heard: "${heard}" (confidence: ${(confidence * 100).toFixed(1)}%)`);
      
      try {
        const langNameMap = { 'en': 'English', 'hi': 'Hindi', 'te': 'Telugu' };
        const selectedLanguage = langNameMap[i18n.language?.substring(0, 2)] || 'English';

        const response = await api.post('/api/v1/voice/parse', {
          user_text: heard,
          selected_language: selectedLanguage
        });

        const { intent, specialty, tts_feedback, extracted_time, extracted_date, extracted_doctor_name } = response.data;
        console.log("Voice AI result:", { intent, specialty, tts_feedback, extracted_time, extracted_date, extracted_doctor_name });
        
        // Speak the feedback back to the user
        if (tts_feedback && window.speechSynthesis) {
          window.speechSynthesis.cancel(); // Cancel any previous speech
          const utterance = new SpeechSynthesisUtterance(tts_feedback);
          utterance.lang = recognition.lang;
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
        }

        // Map intent to route and navigate with context
        const intentRoutes = {
          'book_appointment': '/appointments',
          'find_hospital': '/find-care',
          'medicine_reminder': '/reminders',
          'view_records': '/health-records',
          'emergency': '/emergency',
          'navigate_home': '/dashboard',
          'navigate_profile': '/profile',
        };

        const targetRoute = intentRoutes[intent];
        
        if (targetRoute) {
          // Delay navigation so user hears the TTS first
          setTimeout(() => {
            navigate(targetRoute, { 
              state: { 
                fromVoice: true,
                specialty: specialty !== 'None' ? specialty : null,
                voiceIntent: intent,
                openForm: intent === 'book_appointment',
                preferredTime: extracted_time || null,
                preferredDate: extracted_date || null,
                doctorName: extracted_doctor_name || null,
              } 
            });
          }, 1800);
        } else if (intent === 'clarify') {
          // Don't navigate, just show the error
          setError(tts_feedback || 'Could not understand. Please try again.');
          // Clear error after 4 seconds
          setTimeout(() => setError(null), 4000);
        }
      } catch (err) {
        console.error("Voice parse API error:", err);
        const message = err.response?.data?.detail || 'Could not process voice command. Please try again.';
        setError(message);
        
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance("Sorry, I could not process your request. Please try again.");
          utterance.lang = 'en-IN';
          window.speechSynthesis.speak(utterance);
        }
        setTimeout(() => setError(null), 5000);
      } finally {
        setIsProcessing(false);
      }
    };

    recognition.start();
  }, [i18n.language, navigate]);

  return { isListening, isProcessing, error, transcript, startListening };
};

export default useVoiceAssistant;
