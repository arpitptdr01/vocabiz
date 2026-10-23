const form = document.getElementById("askForm");
const questionInput = document.getElementById("question");
const chat = document.getElementById("chat");
const voiceBtn = document.getElementById("voiceBtn");
const voiceStatus = document.getElementById("voiceStatus");

const business = {
  sales: 124500,
  orders: 248,
  returns: 12,
  products: [
    { name: "Wireless Earbuds", sales: 42000 },
    { name: "Smart Watch", sales: 35500 },
    { name: "Phone Stand", sales: 18000 }
  ]
};

function addMessage(text, type) {
  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;
  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
}

async function askVocaBiz(question) {
  const response = await fetch("/api/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ question })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to get an AI response.");
  }

  return data.answer;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = questionInput.value.trim();
  if (!question) return;

  addMessage(question, "user");
  questionInput.value = "";

  const askButton = form.querySelector('button[type="submit"]');
  if (askButton) askButton.disabled = true;

  addMessage("VocaBiz is thinking...", "bot");
  const thinkingMessage = chat.lastElementChild;

  try {
    const answer = await askVocaBiz(question);
    thinkingMessage.textContent = answer;
    speakVocaBiz(answer);

if ("speechSynthesis" in window) {
  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(answer);
  speech.lang = "hi-IN";
  speech.rate = 1;

  window.speechSynthesis.speak(speech);
}
  } catch (error) {
  console.error("VocaBiz request failed:", error);
  thinkingMessage.textContent =
    "AI request failed. Please check the backend Terminal.";
} finally {
  if (askButton) askButton.disabled = false;
  chat.scrollTop = chat.scrollHeight;
}
});


const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;

  voiceBtn.addEventListener("click", () => {
    voiceStatus.textContent = "Listening…";
    recognition.start();
  });

  recognition.onresult = (event) => {
    const spoken = event.results[0][0].transcript;
    questionInput.value = spoken;
    voiceStatus.textContent = `Heard: "${spoken}"`;
    voiceStatus.textContent = "Question ready. Press Ask to submit.";
  };

  recognition.onerror = () => {
    voiceStatus.textContent =
      "Voice input failed. Please check microphone permission or type your question.";
  };

  recognition.onend = () => {
    if (voiceStatus.textContent === "Listening…") {
      voiceStatus.textContent = "Ready for your next question.";
    }
  };
} else {
  voiceBtn.disabled = true;
  voiceStatus.textContent =
    "Voice input is not supported in this browser. You can still type questions.";
}


const navButtons = document.querySelectorAll(".nav");

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    navButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    const chatPanel = document.querySelector(".workspace .panel");

    if (button.id === "salesNav") {
      chatPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      questionInput.value = "Show my sales";
      form.requestSubmit();
    } else if (button.id === "productsNav") {
      document.querySelector(".workspace .panel:last-child")
        .scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
});

const chart = document.getElementById("salesChart");
const summary = document.getElementById("salesSummary");

const sampleTrends = {
  7: [35, 55, 42, 75, 60, 90, 68],
  30: [30, 45, 38, 65, 48, 80, 95],
  90: [25, 40, 55, 45, 70, 60, 90]
};

function renderChart(period) {
  chart.replaceChildren();

  sampleTrends[period].forEach((value) => {
    const bar = document.createElement("div");
    bar.className = "chart-bar";
    bar.style.height = `${value}%`;
    bar.title = "Illustrative sales trend";
    chart.appendChild(bar);
  });

  summary.textContent =
    `${period}-day illustrative trend. Connect Amazon seller data for real figures.`;
}

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((item) => {
      item.classList.remove("active");
    });

    button.classList.add("active");
    renderChart(Number(button.dataset.period));
  });
});

renderChart(7);

document.getElementById("salesNav").addEventListener("click", () => {
  document.getElementById("analytics").scrollIntoView({
    behavior: "smooth"
  });
});

document.getElementById("productsNav").addEventListener("click", () => {
  document.getElementById("products").scrollIntoView({
    behavior: "smooth"
  });
});
// VocaBiz voice controls
const stopSpeechBtn = document.getElementById("stopSpeechBtn");

// Speak the AI response
function speakVocaBiz(answer) {
  if (!("speechSynthesis" in window)) {
    voiceStatus.textContent = "Speech is not supported in this browser.";
    return;
  }

  // Stop any previous speech before starting a new answer
  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(answer);
  speech.rate = 1;

  // Let the browser select a suitable default voice.
  // Language-specific voice selection can be added separately.
  speech.onstart = () => {
    voiceStatus.textContent = "🔊 VocaBiz is speaking...";
  };

  speech.onend = () => {
    voiceStatus.textContent = "Ready for your next question.";
  };

  speech.onerror = (event) => {
    if (event.error !== "canceled" && event.error !== "interrupted") {
      voiceStatus.textContent = "Voice playback failed.";
    }
  };

  window.speechSynthesis.speak(speech);
}

// Stop button
stopSpeechBtn.addEventListener("click", () => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    voiceStatus.textContent = "🔇 Voice stopped.";
  }
});

// Stop old speech whenever the user submits another question
form.addEventListener("submit", () => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
});