// --- Global Variables ---
let recognition;
let recognizing = false;
let silenceTimer;
let finalTranscript = "";
let targetLang = "en-US"; // Default language

// --- DOM Element References ---
const circleEl = document.getElementById("circle");
const liveEl = document.getElementById("live");
const translatedEl = document.getElementById("translated");
const micBtn = document.getElementById("micBtn");
const stopBtn = document.getElementById("stopBtn");
const langSelect = document.getElementById("langSelect");

// --- Event Listeners ---
langSelect.addEventListener("change", () => {
    targetLang = langSelect.value;
});

micBtn.onclick = () => {
    if (!recognizing) {
        startRecognition();
    }
};

stopBtn.onclick = stopRecognition;


// --- Core Functions ---

/**
 * Creates and configures a new SpeechRecognition instance.
 */
function createRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        return null; // Browser doesn't support the API
    }

    const r = new SpeechRecognition();
    r.lang = "en-US"; // The language spoken by the user
    r.continuous = true; // Keep listening even after a pause
    r.interimResults = true; // Get results as the user speaks

    // --- Recognition Event Handlers ---
    r.onstart = () => {
        recognizing = true;
        finalTranscript = "";
        circleEl.classList.add("shrink"); // Visual feedback
        liveEl.textContent = "Listening...";
        translatedEl.textContent = "";
        resetSilenceTimer();
    };

    r.onresult = (event) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        liveEl.textContent = finalTranscript + interimTranscript;
        resetSilenceTimer(); // Reset timer on new speech
    };

    r.onend = () => {
        recognizing = false;
        circleEl.classList.remove("shrink"); // Reset visual feedback
        clearTimeout(silenceTimer);
        if (finalTranscript.trim()) {
            handleFinalTranscript(finalTranscript);
        } else {
            liveEl.textContent = "Tap mic and speak…";
        }
    };

    r.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        liveEl.textContent = "Error: " + event.error;
    };

    return r;
}

/**
 * Starts the speech recognition process.
 */
function startRecognition() {
    if (!recognition) {
        recognition = createRecognition();
    }
    if (!recognition) {
        liveEl.textContent = "Browser not supported.";
        return;
    }
    recognition.start();
}

/**
 * Manually stops the speech recognition process.
 */
function stopRecognition() {
    if (recognition && recognizing) {
        recognition.stop();
    }
    recognizing = false;
    circleEl.classList.remove("shrink");
    liveEl.textContent = "Stopped by user.";
}

/**
 * Resets the timer that auto-stops recognition after a period of silence.
 */
function resetSilenceTimer() {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
        if (recognizing) {
            console.log("Silence detected, stopping recognition.");
            recognition.stop();
        }
    }, 5000); // Stop after 5 seconds of silence
}

/**
 * Processes the final transcript after recognition ends.
 * @param {string} text The final recognized text.
 */
async function handleFinalTranscript(text) {
    liveEl.textContent = `Recognized: "${text}"`;
    translatedEl.textContent = "Translating...";
    
    // Call translation and speech synthesis
    const translatedText = await translateText(text, targetLang);
    translatedEl.textContent = `Translated: "${translatedText}"`;
    playTranslatedVoice(translatedText, targetLang);
}


// --- Placeholder API Functions ---

/**
 * (Placeholder) Simulates calling a translation API.
 * @param {string} txt The text to translate.
 * @param {string} lang The target language code (e.g., "es-ES").
 * @returns {Promise<string>} The translated text.
 */
async function translateText(txt, lang) {
    console.log(`Placeholder: Translating "${txt}" to ${lang}`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200)); 
    // This is where you would make a real API call.
    return txt + " [translated to " + lang + "]";
}

/**
 * Plays the given text using the browser's speech synthesis.
 * @param {string} txt The text to speak.
 * @param {string} lang The language code for the voice.
 */
function playTranslatedVoice(txt, lang) {
    if (!window.speechSynthesis) {
        console.warn("Browser does not support speech synthesis.");
        return;
    }
    const utterance = new SpeechSynthesisUtterance(txt);
    utterance.lang = lang; // Set the voice language
    
    // Stop any currently speaking utterance before starting a new one
    speechSynthesis.cancel(); 
    speechSynthesis.speak(utterance);
}
