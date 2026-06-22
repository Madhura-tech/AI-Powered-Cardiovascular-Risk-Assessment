// AI Chatbot functionality
let chatHistory = [];

function quickMessage(message) {
    document.getElementById('chat-message').value = message;
    sendMessage();
}

function initChatbot() {
    // Remove existing chatbot if any
    const existing = document.getElementById('chatbot-container');
    if (existing) {
        existing.remove();
    }
    
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chatbot-container';
    chatContainer.innerHTML = `
        <div id="chatbot-toggle" onclick="toggleChatbot()">
            <i class="fas fa-robot"></i>
            <div class="pulse-ring"></div>
        </div>
        <div id="chatbot-window" class="d-none">
            <div id="chatbot-header">
                <div>
                    <h6><i class="fas fa-robot"></i> AI Health Assistant</h6>
                    <small>Online • Ready to help</small>
                </div>
                <button onclick="toggleChatbot()"><i class="fas fa-times"></i></button>
            </div>
            <div id="chatbot-messages"></div>
            <div id="chatbot-input">
                <input type="text" id="chat-message" placeholder="Ask about heart health..." onkeypress="handleChatKeypress(event)">
                <button onclick="toggleVoiceInput()" id="voice-btn" title="Voice input"><i class="fas fa-microphone"></i></button>
                <button onclick="sendMessage()" title="Send message"><i class="fas fa-paper-plane"></i></button>
            </div>
            <div id="quick-actions">
                <button onclick="quickMessage('What are heart disease symptoms?')">Symptoms</button>
                <button onclick="quickMessage('How to prevent heart disease?')">Prevention</button>
                <button onclick="quickMessage('Heart healthy diet tips')">Diet Tips</button>
            </div>
        </div>
    `;
    document.body.appendChild(chatContainer);
    
    // Add welcome message
    setTimeout(() => {
        addMessage('Hello! I\'m your AI health assistant. Ask me about heart health, symptoms, or prevention.', 'bot');
    }, 100);
    
    console.log('Chatbot initialized successfully');
}

function toggleChatbot() {
    const window = document.getElementById('chatbot-window');
    window.classList.toggle('d-none');
}

function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('chat-message');
    const message = input.value.trim();
    
    if (!message) return;
    
    addMessage(message, 'user');
    input.value = '';
    
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        addMessage('Please login to use the AI assistant.', 'bot');
        return;
    }
    
    // Show typing indicator
    addMessage('Typing...', 'bot');
    
    try {
        const response = await fetch('http://127.0.0.1:5000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ message })
        });
        
        // Remove typing indicator
        const messages = document.getElementById('chatbot-messages');
        if (messages.lastChild) {
            messages.removeChild(messages.lastChild);
        }
        
        const data = await response.json();
        
        if (response.ok) {
            addMessage(data.response, 'bot');
        } else {
            addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        }
    } catch (error) {
        // Remove typing indicator
        const messages = document.getElementById('chatbot-messages');
        if (messages.lastChild) {
            messages.removeChild(messages.lastChild);
        }
        addMessage('Connection error. Please check if the server is running.', 'bot');
    }
}

function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    // Format text with markdown-like styling
    const formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
        .replace(/•/g, '&bull;');
    
    messageDiv.innerHTML = `
        <div class="message-content">
            ${sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>'}
            <span>${formattedText}</span>
        </div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add typing animation for bot messages
    if (sender === 'bot') {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(10px)';
        setTimeout(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 100);
    }
}

// Initialize chatbot immediately
function showChatbot() {
    initChatbot();
}

let recognition;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('chat-message').value = transcript;
        document.getElementById('voice-btn').innerHTML = '<i class="fas fa-microphone"></i>';
    };
    
    recognition.onerror = () => {
        document.getElementById('voice-btn').innerHTML = '<i class="fas fa-microphone"></i>';
    };
    
    recognition.onend = () => {
        document.getElementById('voice-btn').innerHTML = '<i class="fas fa-microphone"></i>';
    };
}

function toggleVoiceInput() {
    if (!recognition) {
        alert('Voice input not supported in your browser');
        return;
    }
    const btn = document.getElementById('voice-btn');
    if (btn.innerHTML.includes('fa-stop')) {
        recognition.stop();
        btn.innerHTML = '<i class="fas fa-microphone"></i>';
    } else {
        recognition.start();
        btn.innerHTML = '<i class="fas fa-stop"></i>';
    }
}

// Initialize when DOM loads and after login
document.addEventListener('DOMContentLoaded', function() {
    initChatbot();
});

// Also initialize after successful login
setTimeout(() => {
    if (typeof window.updateUIForLoggedInUser === 'function') {
        const originalUpdate = window.updateUIForLoggedInUser;
        window.updateUIForLoggedInUser = function() {
            originalUpdate();
            setTimeout(initChatbot, 500);
        };
    }
}, 2000);