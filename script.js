// DOM Elements
const circleEl = document.getElementById('circle');
const liveEl = document.getElementById('live');
const translatedEl = document.getElementById('translated');
const micBtn = document.getElementById('micBtn');
const stopBtn = document.getElementById('stopBtn');
const langSelect = document.getElementById('langSelect');
const historyList = document.getElementById('history-list');
const modal = document.getElementById('chatModal');
const modalClose = document.querySelector('.modal-close');
const chatDisplay = document.getElementById('chatDisplay');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');

let recognition;
let recognizing = false;
let silenceTimer;
let finalTranscript = "";
let targetLang = "en-US";

// --- Event Listeners ---
langSelect.addEventListener("change", () => {
    targetLang = langSelect.value;
});
micBtn.addEventListener('click', startRecognition);
stopBtn.addEventListener('click', stopRecognition);
modalClose.onclick = () => modal.style.display = "none";
window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};
chatSendBtn.onclick = () => {
    const userMessage = chatInput.value.trim();
    if (userMessage) {
        addMessageToChat('user', userMessage);
        chatInput.value = '';
        handleChatMessage(userMessage);
    }
};
chatInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        chatSendBtn.click();
    }
});

// --- Speech Recognition Logic ---
function createRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        liveEl.textContent = "Browser not supported.";
        return null;
    }
    const r = new SpeechRecognition();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = true;

    r.onstart = () => {
        recognizing = true;
        finalTranscript = "";
        circleEl.classList.add("shrink", "recording");
        liveEl.textContent = "Listening...";
        translatedEl.textContent = "";
        resetSilenceTimer();
    };

    r.onresult = (event) => {
        let interimTranscript = "";
        finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        liveEl.textContent = finalTranscript + interimTranscript;
        resetSilenceTimer();
    };

    r.onend = () => {
        recognizing = false;
        circleEl.classList.remove("shrink", "recording");
        clearTimeout(silenceTimer);
        if (finalTranscript.trim()) {
            handleFinal(finalTranscript);
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

function startRecognition() {
    if (recognizing) return;
    recognition = createRecognition();
    if (recognition) {
        recognition.start();
    }
}

function stopRecognition() {
    if (recognition && recognizing) {
        recognition.stop();
    }
}

function resetSilenceTimer() {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
        if (recognizing) {
            stopRecognition();
        }
    }, 5000);
}

async function handleFinal(text) {
    liveEl.textContent = text;
    try {
        const translated = await translateText(text, targetLang);
        translatedEl.textContent = translated;
        playTranslatedVoice(translated, targetLang);
        addToHistory(text, translated);
    } catch (error) {
        console.error("Translation/synthesis error:", error);
        translatedEl.textContent = "Error during translation.";
    }
}

// --- API & Synthesis Placeholders ---
async function translateText(txt, lang) {
    console.log(`Translating "${txt}" to ${lang}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return `${txt} [translated to ${lang}]`;
}

function playTranslatedVoice(txt, lang) {
    if (!window.speechSynthesis) {
        console.error("Speech Synthesis not supported.");
        return;
    }
    const utter = new SpeechSynthesisUtterance(txt);
    utter.lang = lang;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
}

// --- Sidebar, History & Chatbox Logic ---
function addToHistory(originalText, translatedText) {
    const listItem = document.createElement('li');
    listItem.dataset.original = originalText;
    listItem.dataset.translated = translatedText;
    listItem.textContent = originalText.length > 25 ? originalText.substring(0, 22) + '...' : originalText;

    listItem.addEventListener('click', () => {
        openChatbox(listItem.dataset.original, listItem.dataset.translated);
    });

    historyList.prepend(listItem);
}

function toggleSidebar() {
    const sidebar = document.getElementById('history-sidebar');
    const main = document.getElementById('main-content');
    if (sidebar.style.width === '280px') {
        sidebar.style.width = '0';
        main.style.marginLeft = '0';
    } else {
        sidebar.style.width = '280px';
        main.style.marginLeft = '280px';
    }
}

function openChatbox(originalText, translatedText) {
    chatDisplay.innerHTML = '';
    addMessageToChat('user', originalText);
    addMessageToChat('bot', translatedText);
    modal.style.display = 'block';
    chatInput.focus();
}

function addMessageToChat(sender, message) {
    const msgDiv = document.createElement('div');
    msgDiv.className = sender === 'user' ? 'user-msg' : 'bot-msg';
    msgDiv.textContent = message;
    chatDisplay.appendChild(msgDiv);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

async function handleChatMessage(message) {
    console.log(`Sending to API: "${message}"`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const botResponse = `This is a simulated response to "${message}"`;
    addMessageToChat('bot', botResponse);
}
