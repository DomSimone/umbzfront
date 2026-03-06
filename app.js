/**
 * Umbuzo Chat Interface - Main Controller
 * Handles all frontend logic, API communication, and UI interactions.
 */

const API_BASE_URL = window.UmbuzoConfig?.API_BASE_URL || 'http://127.0.0.1:8001';
const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');

// Axios configuration
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 300000; 
axios.defaults.headers.common['Content-Type'] = 'application/json';

// --- State Management ---
const state = {
    currentChatId: null,
    conversation: [],
    mode: 'default',
    isConnected: false,
    isRecording: false,
    mediaRecorder: null,
    audioChunks: [],
    socket: null,
    useSearch: false 
};

// --- Topic & App Mapping ---
const TOPIC_MAPPING = {
    'politics': 'Political And Civic Engagement',
    'economics': 'Economic And Labor Trends',
    'urban': 'Urban and community dynamics',
    'demographics': 'Demographic Trends',
    'culture': 'Political And Civic Engagement',
    'history': 'default',
    'default': 'default'
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initializeState();
    setupEventListeners();
    checkBackendConnection();
    initWebSocket();
    setInterval(checkBackendConnection, 10000);
});

function initializeState() {
    const savedMode = localStorage.getItem('umbuzo_mode');
    if (savedMode) {
        state.mode = savedMode;
        const selector = document.getElementById('modelSelector');
        if (selector) selector.value = savedMode;
    }

    const loadChatId = localStorage.getItem('umbuzo_load_chat_id');
    if (loadChatId) {
        localStorage.removeItem('umbuzo_load_chat_id');
        loadChatFromHistory(loadChatId);
    } else {
        renderSidebarHistory();
    }

    const launchApp = localStorage.getItem('umbuzo_launch_app');
    if (launchApp) {
        localStorage.removeItem('umbuzo_launch_app');
        quickAction(launchApp, true);
    }
}

// --- WebSocket Logic ---
function initWebSocket() {
    if (state.socket && (state.socket.readyState === WebSocket.OPEN || state.socket.readyState === WebSocket.CONNECTING)) {
        return;
    }

    console.log("Connecting to WebSocket:", `${WS_BASE_URL}/chat/ws`);
    state.socket = new WebSocket(`${WS_BASE_URL}/chat/ws`);

    state.socket.onopen = () => {
        console.log("WebSocket Connected");
        state.isConnected = true;
    };

    state.socket.onclose = () => {
        console.log("WebSocket Disconnected. Retrying in 5s...");
        state.isConnected = false;
        setTimeout(initWebSocket, 5000);
    };

    state.socket.onerror = (error) => {
        console.error("WebSocket Error:", error);
    };
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    document.getElementById('chatInput')?.addEventListener('keydown', handleKeydown);
    document.getElementById('btnSend')?.addEventListener('click', sendMessage);
    document.getElementById('btnNewChat')?.addEventListener('click', startNewChat);
    document.getElementById('btnMic')?.addEventListener('click', toggleVoiceRecording);
    document.getElementById('modelSelector')?.addEventListener('change', handleTopicChange);
    document.getElementById('btnCheckHealth')?.addEventListener('click', () => checkBackendConnection(true));
    document.getElementById('btnAttach')?.addEventListener('click', () => alert('File attachment feature is coming soon!'));
    
    document.getElementById('btnWebSearch')?.addEventListener('click', toggleWebSearch);

    document.querySelectorAll('.quick-action').forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.currentTarget.getAttribute('onclick').match(/'(.*?)'/)[1];
            quickAction(action);
        });
    });
}

function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function handleTopicChange(e) {
    state.mode = e.target.value;
    localStorage.setItem('umbuzo_mode', state.mode);
    addMessage('System', `Topic switched to: ${e.target.options[e.target.selectedIndex].text}`, { type: 'info' });
}

function toggleWebSearch() {
    state.useSearch = !state.useSearch;
    const btn = document.getElementById('btnWebSearch');
    if (state.useSearch) {
        btn.classList.add('active');
        btn.innerHTML = '<span>🌐</span><span>Search ON</span>';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<span>🌐</span><span>Search</span>';
    }
}

// --- Core Chat Logic (Streaming) ---

async function sendMessage() {
    if (!state.isConnected || state.socket.readyState !== WebSocket.OPEN) {
        addMessage('System', 'Backend is offline or connecting. Please wait...', { type: 'error' });
        initWebSocket();
        return;
    }

    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();

    if (!message) return;

    displayWelcome(false);
    addMessage('user', message);
    chatInput.value = '';

    state.conversation.push({ role: 'user', content: message });
    if (!state.currentChatId) state.currentChatId = Date.now().toString();

    const responseId = `msg-${Date.now()}`;
    addMessage('Umbuzo', '<span class="cursor">|</span>', { id: responseId, topic: state.mode });
    
    const payload = {
        query: message,
        conversation_history: state.conversation.map(msg => ({
            role: msg.role,
            content: msg.content
        })),
        topic: state.mode,
        use_search: state.useSearch 
    };

    state.socket.send(JSON.stringify(payload));

    let fullResponse = "";
    const messageElement = document.getElementById(responseId).querySelector('.message-text');
    
    const messageHandler = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.status) {
            messageElement.innerHTML = `<em>${data.status}</em><span class="cursor">|</span>`;
            return;
        }

        if (data.error) {
            messageElement.innerHTML = `<span style="color:red">Error: ${data.error}</span>`;
            state.socket.removeEventListener('message', messageHandler);
            return;
        }

        if (data.done) {
            state.socket.removeEventListener('message', messageHandler);
            state.conversation.push({ role: 'assistant', content: fullResponse });
            saveChatToHistory();
            messageElement.innerHTML = formatText(fullResponse); 
            return;
        }

        if (data.token) {
            fullResponse += data.token;
            messageElement.innerHTML = formatText(fullResponse) + '<span class="cursor">|</span>';
            const container = document.getElementById('messagesContainer');
            container.scrollTop = container.scrollHeight;
        }
    };

    state.socket.addEventListener('message', messageHandler);
}

// --- Voice Logic (Standard HTTP) ---

async function toggleVoiceRecording() {
    if (!state.isConnected) {
        addMessage('System', 'Cannot use voice: Backend is offline.', { type: 'error' });
        return;
    }
    state.isRecording ? stopRecording() : await startRecording();
}

async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
        alert("Audio recording is not supported.");
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.mediaRecorder = new MediaRecorder(stream);
        state.audioChunks = [];
        state.mediaRecorder.ondataavailable = e => state.audioChunks.push(e.data);
        state.mediaRecorder.onstop = sendVoiceMessage;
        state.mediaRecorder.start();
        state.isRecording = true;
        document.getElementById('btnMic')?.classList.add('recording');
        document.getElementById('chatInput').placeholder = "Listening... Click mic to stop.";
    } catch (err) {
        alert("Microphone access denied.");
    }
}

function stopRecording() {
    if (state.mediaRecorder) {
        state.mediaRecorder.stop();
        state.isRecording = false;
        document.getElementById('btnMic')?.classList.remove('recording');
        document.getElementById('chatInput').placeholder = "Ask Umbuzo anything...";
    }
}

async function sendVoiceMessage() {
    if (state.audioChunks.length === 0) return;
    displayWelcome(false);
    addMessage('user', '🎤 [Voice Message Sent]');
    showLoading(true, "Processing voice...");

    const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'voice.webm');

    try {
        const response = await axios.post('/chat/voice', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            responseType: 'blob'
        });
        const audioUrl = URL.createObjectURL(response.data);
        new Audio(audioUrl).play();
        addMessage('Umbuzo', '🔊 [Audio Response Playing...]');
    } catch (error) {
        handleApiError(error);
    } finally {
        showLoading(false);
        state.audioChunks = [];
    }
}

// --- Quick Actions & App Launching ---
function quickAction(actionName, isAppLaunch = false) {
    const topic = TOPIC_MAPPING[actionName] || 'default';
    state.mode = topic;
    
    const selector = document.getElementById('modelSelector');
    if (selector) selector.value = topic;
    
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.focus();
        let starterText = "";
        switch(actionName) {
            case 'politics': starterText = "Analyze the current political landscape regarding..."; break;
            case 'economics': starterText = "What are the key economic trends in..."; break;
            case 'culture': starterText = "Explain the cultural significance of..."; break;
            case 'history': starterText = "Tell me the history of..."; break;
            case 'research': starterText = "Provide academic research on the topic of..."; break;
            case 'report': starterText = "Generate a detailed report on..."; break;
            case 'analyzer': starterText = "Analyze the following dataset: [paste data here]"; break;
            case 'country': starterText = "Give me a detailed profile of the country..."; break;
            default: starterText = "Ask Umbuzo anything..."; break;
        }
        chatInput.value = starterText;
    }
    if (isAppLaunch) {
        addMessage('System', `Launched '${actionName}' app. Please complete the prompt.`, { type: 'info' });
    }
}

// --- UI & State Helpers ---
function addMessage(sender, text, metadata = {}) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    if (metadata.id) messageDiv.id = metadata.id;
    
    messageDiv.className = `message ${sender.toLowerCase()} ${metadata.type || ''}`;
    messageDiv.innerHTML = `<strong>${sender}:</strong> <div class="message-text">${formatText(text)}</div>`;
    
    if (sender === 'Umbuzo' && metadata.topic) {
        messageDiv.innerHTML += `<div class="message-metadata"><span class="meta-item">🏷️ ${metadata.topic}</span></div>`;
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatText(text) {
    if (!text) return '';
    return text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function displayWelcome(show) {
    document.getElementById('welcomeSection').style.display = show ? 'block' : 'none';
    document.getElementById('messagesContainer').style.display = show ? 'none' : 'block';
}

function showLoading(isLoading, message = "Umbuzo is thinking...") {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.querySelector('p').textContent = message;
        overlay.style.display = isLoading ? 'flex' : 'none';
    }
}

function startNewChat() {
    state.currentChatId = null;
    state.conversation = [];
    document.getElementById('messagesContainer').innerHTML = '';
    displayWelcome(true);
    renderSidebarHistory();
}

// --- History Management ---
function saveChatToHistory() {
    if (!state.currentChatId) return;
    const history = JSON.parse(localStorage.getItem('umbuzo_history') || '[]');
    const title = state.conversation.find(m => m.role === 'user')?.content.substring(0, 40) + "..." || "New Chat";
    const chatEntry = { id: state.currentChatId, title, timestamp: new Date().toISOString(), conversation: state.conversation, mode: state.mode };
    const existingIndex = history.findIndex(h => h.id === state.currentChatId);
    existingIndex >= 0 ? history[existingIndex] = chatEntry : history.unshift(chatEntry);
    localStorage.setItem('umbuzo_history', JSON.stringify(history.slice(0, 50)));
    renderSidebarHistory();
}

function renderSidebarHistory() {
    const list = document.getElementById('chatHistoryList');
    if (!list) return;
    const history = JSON.parse(localStorage.getItem('umbuzo_history') || '[]');
    list.innerHTML = history.slice(0, 10).map(chat => `<div class="chat-history-item" onclick="loadChatFromHistory('${chat.id}')">${chat.title}</div>`).join('');
}

function loadChatFromHistory(chatId) {
    const history = JSON.parse(localStorage.getItem('umbuzo_history') || '[]');
    const chat = history.find(c => c.id === chatId);
    if (chat) {
        state.currentChatId = chat.id;
        state.conversation = chat.conversation;
        state.mode = chat.mode || 'default';
        document.getElementById('modelSelector').value = state.mode;
        displayWelcome(false);
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';
        chat.conversation.forEach(msg => addMessage(msg.role === 'user' ? 'user' : 'Umbuzo', msg.content));
    }
}

// --- System Health ---
async function checkBackendConnection(manual = false) {
    const statusText = document.getElementById('dockerStatusText');
    const indicator = document.getElementById('dockerIndicator');
    try {
        const resp = await axios.get('/health');
        state.isConnected = resp.data.status === 'healthy';
        if (state.isConnected) {
            if (statusText) statusText.textContent = "System Online";
            if (indicator) indicator.className = "docker-indicator running";
            if (manual) addMessage('System', "Backend is healthy!", { type: 'info' });
        } else {
            if (statusText) statusText.textContent = "Model Loading...";
            if (indicator) indicator.className = "docker-indicator loading";
        }
    } catch (e) {
        state.isConnected = false;
        if (statusText) statusText.textContent = "System Offline";
        if (indicator) indicator.className = "docker-indicator error";
    }
}

function handleApiError(error) {
    console.error("API Error:", error);
    addMessage('System', "Could not connect to backend.", { type: 'error' });
}

window.quickAction = quickAction;
window.loadChatFromHistory = loadChatFromHistory;
