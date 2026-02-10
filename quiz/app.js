const FILE_PATH = "questions.json";
const ADDED_KEY = "nepali_quiz_added_v1";
const LEVEL_KEY = "nepali_quiz_level";
const COMPLETED_QUESTIONS_KEY = "nepali_quiz_completed";
const MAX_QUESTIONS = 50;
const QUESTIONS_PER_LEVEL = 10;
const ADMIN_CODE = "9605";

const questionNumberEl = document.getElementById("questionNumber");
const questionTextEl = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const progressBar = document.getElementById("progressBar");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const resultsCard = document.getElementById("results");
const quizCard = document.getElementById("quizCard");
const finalScoreEl = document.getElementById("finalScore");
const resultMessageEl = document.getElementById("resultMessage");
const retakeBtn = document.getElementById("retakeBtn");
const feedbackEl = document.getElementById("feedback");
const levelDisplayEl = document.getElementById("levelDisplay");

const openAdminBtn = document.getElementById("openAdmin");
const closeAdminBtn = document.getElementById("closeAdmin");
const adminModal = document.getElementById("adminModal");
const adminCodeInput = document.getElementById("adminCodeInput");
const unlockAdminBtn = document.getElementById("unlockAdmin");
const adminBody = document.getElementById("adminBody");
const adminForm = document.getElementById("adminForm");
const adminStatus = document.getElementById("adminStatus");
const resetQuestionsBtn = document.getElementById("resetQuestions");
const downloadQuestionsBtn = document.getElementById("downloadQuestions");

const newQuestionInput = document.getElementById("newQuestion");
const optAInput = document.getElementById("optA");
const optBInput = document.getElementById("optB");
const optCInput = document.getElementById("optC");
const optDInput = document.getElementById("optD");
const correctIndexSelect = document.getElementById("correctIndex");

let allQuestions = [];
let questions = [];
let currentQuestion = 0;
let userAnswers = [];
let currentLevel = 1;
let completedQuestions = [];

function generateDefaultQuestions(count) {
  const samples = [];
  for (let i = 1; i <= count; i += 1) {
    samples.push({
      question: `प्रश्न ${i}: नेपाल सम्बन्धी सामान्य ज्ञान (Sample)`,
      options: [
        `विकल्प A ${i}`,
        `विकल्प B ${i}`,
        `विकल्प C ${i}`,
        `विकल्प D ${i}`
      ],
      answer: `विकल्प ${String.fromCharCode(65 + (i % 4))} ${i}`
    });
  }
  return samples;
}

function normalizeQuestion(rawQuestion) {
  const options = Array.isArray(rawQuestion.options) ? rawQuestion.options : [];
  const answer = typeof rawQuestion.answer === "string" ? rawQuestion.answer : options[0] || "";
  const answerIndex = Math.max(0, options.indexOf(answer));
  return {
    question: rawQuestion.question || "",
    options,
    answer,
    answerIndex
  };
}

function getAddedQuestions() {
  try {
    const stored = JSON.parse(localStorage.getItem(ADDED_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.warn("Failed to parse added questions", error);
    return [];
  }
}

function saveAddedQuestions(added) {
  localStorage.setItem(ADDED_KEY, JSON.stringify(added));
}

function getCurrentLevel() {
  try {
    const level = parseInt(localStorage.getItem(LEVEL_KEY) || "1");
    return level > 0 ? level : 1;
  } catch (error) {
    return 1;
  }
}

function saveCurrentLevel(level) {
  localStorage.setItem(LEVEL_KEY, level.toString());
}

function getCompletedQuestions() {
  try {
    const completed = JSON.parse(localStorage.getItem(COMPLETED_QUESTIONS_KEY) || "[]");
    return Array.isArray(completed) ? completed : [];
  } catch (error) {
    return [];
  }
}

function saveCompletedQuestions(completed) {
  localStorage.setItem(COMPLETED_QUESTIONS_KEY, JSON.stringify(completed));
}

function selectQuestionsForLevel(level) {
  const completed = getCompletedQuestions();
  
  // Filter out already completed questions
  const available = allQuestions.filter(q => {
    const questionKey = q.question + JSON.stringify(q.options);
    return !completed.includes(questionKey);
  });

  // If not enough available questions, reset completed list
  if (available.length < QUESTIONS_PER_LEVEL) {
    completedQuestions = [];
    saveCompletedQuestions([]);
    return allQuestions.slice(0, QUESTIONS_PER_LEVEL);
  }

  // Shuffle and select questions for this level
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, QUESTIONS_PER_LEVEL);
}

async function loadQuestions() {
  let fileQuestions = [];
  
  // Try to load from file
  try {
    const response = await fetch(FILE_PATH);
    if (response.ok) {
      const json = await response.json();
      if (Array.isArray(json) && json.length > 0) {
        fileQuestions = json;
        console.log(`Loaded ${fileQuestions.length} questions from file`);
      }
    }
  } catch (error) {
    console.warn("Failed to load questions file:", error);
  }

  // Use embedded questions if file loading failed
  if (!fileQuestions.length) {
    console.log("Using embedded questions");
    fileQuestions = [
      {
        "question": "नेपालको राजधानी कहाँ छ?",
        "options": ["काठमाडौं", "पोखरा", "भक्तपुर", "ललितपुर"],
        "answer": "काठमाडौं"
      },
      {
        "question": "नेपालको सबैभन्दा अग्लो हिमाल कुन हो?",
        "options": ["मकालु", "धौलागिरी", "सगरमाथा", "अन्नपूर्ण"],
        "answer": "सगरमाथा"
      },
      {
        "question": "नेपालको राष्ट्रिय फूल कुन हो?",
        "options": ["गुलाफ", "लालीगुराँस", "सुर्यमुखी", "गोदावरी"],
        "answer": "लालीगुराँस"
      },
      {
        "question": "नेपालको राष्ट्रिय चरा कुन हो?",
        "options": ["मयूर", "डाँफे", "हाँस", "काग"],
        "answer": "डाँफे"
      },
      {
        "question": "नेपालमा कति जिल्ला छन्?",
        "options": ["75", "77", "80", "72"],
        "answer": "77"
      },
      {
        "question": "नेपालको राष्ट्रिय रङ्ग कुन हो?",
        "options": ["रातो", "नीलो", "हरियो", "सेतो"],
        "answer": "रातो"
      },
      {
        "question": "नेपालको राष्ट्रिय पशु कुन हो?",
        "options": ["बाघ", "गाई", "हात्ती", "गैंडा"],
        "answer": "गाई"
      },
      {
        "question": "नेपालको क्षेत्रफल कति वर्ग किलोमिटर छ?",
        "options": ["1,47,181", "1,50,000", "1,40,000", "1,60,000"],
        "answer": "1,47,181"
      },
      {
        "question": "नेपालको पहिलो राजा को हुनुहुन्थ्यो?",
        "options": ["महेन्द्र", "त्रिभुवन", "पृथ्वीनारायण शाह", "वीरेन्द्र"],
        "answer": "पृथ्वीनारायण शाह"
      },
      {
        "question": "नेपालको संविधान कहिले जारी भएको थियो?",
        "options": ["2072 असोज 3", "2071 असोज 3", "2073 असोज 3", "2070 असोज 3"],
        "answer": "2072 असोज 3"
      },
      {
        "question": "नेपालको सबैभन्दा लामो नदी कुन हो?",
        "options": ["कर्णाली", "कोशी", "गण्डकी", "महाकाली"],
        "answer": "कर्णाली"
      },
      {
        "question": "नेपालको राष्ट्रिय खेल कुन हो?",
        "options": ["क्रिकेट", "भलिबल", "फुटबल", "कुनै पनि होइन"],
        "answer": "कुनै पनि होइन"
      },
      {
        "question": "नेपालमा कति प्रदेश छन्?",
        "options": ["5", "6", "7", "8"],
        "answer": "7"
      },
      {
        "question": "नेपालको सबैभन्दा ठूलो जिल्ला कुन हो?",
        "options": ["दोलखा", "हुम्ला", "मुस्ताङ", "डोल्पा"],
        "answer": "डोल्पा"
      },
      {
        "question": "सगरमाथाको उचाइ कति मिटर छ?",
        "options": ["8848.86", "8611", "8516", "8201"],
        "answer": "8848.86"
      },
      {
        "question": "नेपालको मुद्रा के हो?",
        "options": ["रुपैयाँ", "टका", "डलर", "रुपिया"],
        "answer": "रुपैयाँ"
      },
      {
        "question": "नेपालको राष्ट्रिय गान कसले लेखेका हुन्?",
        "options": ["भानुभक्त आचार्य", "लक्ष्मीप्रसाद देवकोटा", "व्यकुल मैला", "प्रदीप कुमार राई"],
        "answer": "व्यकुल मैला"
      },
      {
        "question": "पोखरा कुन प्रदेशमा पर्दछ?",
        "options": ["प्रदेश १", "गण्डकी प्रदेश", "लुम्बिनी प्रदेश", "कर्णाली प्रदेश"],
        "answer": "गण्डकी प्रदेश"
      },
      {
        "question": "नेपालको सबैभन्दा पुरानो सहर कुन हो?",
        "options": ["काठमाडौं", "पाटन", "भक्तपुर", "किर्तिपुर"],
        "answer": "काठमाडौं"
      },
      {
        "question": "लुम्बिनी कहाँ अवस्थित छ?",
        "options": ["कपिलवस्तु", "रुपन्देही", "नवलपरासी", "दाङ"],
        "answer": "रुपन्देही"
      },
      {
        "question": "नेपालको राष्ट्रिय नृत्य कुन हो?",
        "options": ["मारुनी", "लाखे", "झ्याउरे", "कुनै पनि होइन"],
        "answer": "कुनै पनि होइन"
      },
      {
        "question": "नेपालमा कति भाषा बोलिन्छ?",
        "options": ["100+", "123+", "50+", "75+"],
        "answer": "123+"
      },
      {
        "question": "नेपालको पहिलो राष्ट्रपति को हुनुहुन्थ्यो?",
        "options": ["डा. रामबरण यादव", "विद्यादेवी भण्डारी", "राजेन्द्र प्रसाद", "कृष्णप्रसाद भट्टराई"],
        "answer": "डा. रामबरण यादव"
      },
      {
        "question": "चितवन राष्ट्रिय निकुञ्ज कहिले स्थापना भएको?",
        "options": ["2030", "2029", "2031", "2028"],
        "answer": "2029"
      },
      {
        "question": "नेपालको सबैभन्दा ठूलो ताल कुन हो?",
        "options": ["रारा", "फेवा", "बेगनास", "तिलिचो"],
        "answer": "रारा"
      },
      {
        "question": "नेपालको झण्डाको आकार कस्तो छ?",
        "options": ["आयताकार", "त्रिकोणीय", "वर्गाकार", "गोलाकार"],
        "answer": "त्रिकोणीय"
      },
      {
        "question": "नेपालमा कति जातजाति छन्?",
        "options": ["100+", "125+", "150+", "75+"],
        "answer": "125+"
      },
      {
        "question": "नेपालको मुख्य खाद्यान्न के हो?",
        "options": ["गहुँ", "धान", "मकै", "कोदो"],
        "answer": "धान"
      },
      {
        "question": "नेपालको सबैभन्दा लामो झोलुङ्गे पुल कहाँ छ?",
        "options": ["बागलुङ", "कुश्मा", "रामेछाप", "पर्बत"],
        "answer": "कुश्मा"
      },
      {
        "question": "नेपालको राष्ट्रिय वन कुन हो?",
        "options": ["साल", "पीपल", "बर", "कुनै पनि होइन"],
        "answer": "कुनै पनि होइन"
      }
    ];
  }

  const added = getAddedQuestions();
  const merged = [...fileQuestions, ...added];
  allQuestions = merged.map(normalizeQuestion);
  
  console.log(`Total questions available: ${allQuestions.length}`);
  
  // Load current level and completed questions
  currentLevel = getCurrentLevel();
  completedQuestions = getCompletedQuestions();
  
  // Select questions for current level
  questions = selectQuestionsForLevel(currentLevel);
  
  console.log(`Selected ${questions.length} questions for level ${currentLevel}`);
  
  // Update level display
  if (levelDisplayEl) {
    levelDisplayEl.textContent = `Level ${currentLevel}`;
  }
}

function updateProgress() {
  const total = questions.length || 1;
  const current = currentQuestion + 1;
  progressBar.style.width = `${(current / total) * 100}%`;
  questionNumberEl.textContent = `Question ${current} of ${total}`;
}

function renderOptions(question) {
  optionsContainer.innerHTML = "";
  const locked = userAnswers[currentQuestion] !== undefined;
  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option";
    button.textContent = option;
    if (userAnswers[currentQuestion] === index) {
      button.classList.add("selected");
    }
    if (locked) {
      button.disabled = true;
    } else {
      button.addEventListener("click", () => {
        userAnswers[currentQuestion] = index;
        renderOptions(question);
        updateFeedback();
        nextBtn.disabled = false;
      });
    }
    optionsContainer.appendChild(button);
  });
}

function updateFeedback() {
  feedbackEl.className = "feedback";
  const answerIndex = userAnswers[currentQuestion];
  if (answerIndex === undefined) {
    feedbackEl.textContent = "";
    return;
  }
  const question = questions[currentQuestion];
  if (answerIndex === question.answerIndex) {
    feedbackEl.textContent = "Correct answer!";
    feedbackEl.classList.add("correct");
  } else {
    const correctText = question.options[question.answerIndex];
    feedbackEl.textContent = `Wrong answer. Correct: ${correctText}`;
    feedbackEl.classList.add("wrong");
  }
}

function displayQuestion() {
  if (!questions.length) {
    questionTextEl.textContent = "No questions available.";
    optionsContainer.innerHTML = "";
    return;
  }
  const question = questions[currentQuestion];
  questionTextEl.textContent = question.question;
  renderOptions(question);
  updateFeedback();
  updateProgress();
  prevBtn.disabled = currentQuestion === 0;
  nextBtn.textContent = currentQuestion === questions.length - 1 ? "Finish" : "Next";
  nextBtn.disabled = userAnswers[currentQuestion] === undefined;
}

function calculateScore() {
  let total = 0;
  questions.forEach((question, index) => {
    if (userAnswers[index] === question.answerIndex) {
      total += 1;
    }
  });
  return total;
}

function showResults() {
  const totalScore = calculateScore();
  finalScoreEl.textContent = `${totalScore}/${questions.length}`;
  const percentage = Math.round((totalScore / questions.length) * 100);
  
  // Mark current questions as completed
  const completed = getCompletedQuestions();
  questions.forEach(q => {
    const questionKey = q.question + JSON.stringify(q.options);
    if (!completed.includes(questionKey)) {
      completed.push(questionKey);
    }
  });
  saveCompletedQuestions(completed);
  
  // Determine if user passed (70% or higher)
  const passed = percentage >= 70;
  
  if (passed) {
    currentLevel++;
    saveCurrentLevel(currentLevel);
    resultMessageEl.innerHTML = `🎉 Excellent! You scored ${percentage}%<br>Level ${currentLevel} unlocked! Click "Next Level" to continue.`;
    retakeBtn.textContent = "Next Level";
  } else {
    resultMessageEl.innerHTML = `You scored ${percentage}%<br>You need 70% to advance. Try again!`;
    retakeBtn.textContent = "Retry Level";
  }
  
  quizCard.classList.add("hidden");
  resultsCard.classList.remove("hidden");
}

function resetQuiz() {
  currentQuestion = 0;
  userAnswers = [];
  
  // Select new questions for current level
  questions = selectQuestionsForLevel(currentLevel);
  
  // Update level display
  if (levelDisplayEl) {
    levelDisplayEl.textContent = `Level ${currentLevel}`;
  }
  
  resultsCard.classList.add("hidden");
  quizCard.classList.remove("hidden");
  displayQuestion();
}

function nextQuestion() {
  if (userAnswers[currentQuestion] === undefined) {
    feedbackEl.className = "feedback wrong";
    feedbackEl.textContent = "Please choose an answer to continue.";
    return;
  }
  if (currentQuestion < questions.length - 1) {
    currentQuestion += 1;
    displayQuestion();
  } else {
    showResults();
  }
}

function previousQuestion() {
  if (currentQuestion > 0) {
    currentQuestion -= 1;
    displayQuestion();
  }
}

function openAdmin() {
  adminModal.classList.remove("hidden");
  adminCodeInput.value = "";
  adminBody.classList.add("hidden");
  adminStatus.textContent = "";
}

function closeAdmin() {
  adminModal.classList.add("hidden");
}

function unlockAdmin() {
  if (adminCodeInput.value.trim() === ADMIN_CODE) {
    adminBody.classList.remove("hidden");
    adminStatus.textContent = "Access granted. You can add questions.";
  } else {
    adminStatus.textContent = "Invalid code. Try again.";
  }
}

function addQuestion(event) {
  event.preventDefault();
  if (allQuestions.length >= MAX_QUESTIONS) {
    adminStatus.textContent = `Limit reached. Max ${MAX_QUESTIONS} questions.`;
    return;
  }
  const questionText = newQuestionInput.value.trim();
  const options = [
    optAInput.value.trim(),
    optBInput.value.trim(),
    optCInput.value.trim(),
    optDInput.value.trim()
  ];

  if (!questionText || options.some(option => !option)) {
    adminStatus.textContent = "Please fill in the question and all options.";
    return;
  }

  const answerIndex = Number(correctIndexSelect.value);
  const newQuestion = {
    question: questionText,
    options,
    answer: options[answerIndex]
  };

  const added = getAddedQuestions();
  added.push(newQuestion);
  saveAddedQuestions(added);
  allQuestions.push(normalizeQuestion(newQuestion));
  adminStatus.textContent = `Question added. Total questions: ${allQuestions.length}.`;
  adminForm.reset();
}

async function resetQuestions() {
  saveAddedQuestions([]);
  saveCurrentLevel(1);
  saveCompletedQuestions([]);
  currentLevel = 1;
  await loadQuestions();
  adminStatus.textContent = "Reset complete. All progress cleared.";
  resetQuiz();
}

function downloadQuestions() {
  const payload = allQuestions.map(question => ({
    question: question.question,
    options: question.options,
    answer: question.answer
  }));
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = FILE_PATH;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  adminStatus.textContent = "Downloaded updated questions file.";
}

prevBtn.addEventListener("click", previousQuestion);
nextBtn.addEventListener("click", nextQuestion);
retakeBtn.addEventListener("click", resetQuiz);

openAdminBtn.addEventListener("click", openAdmin);
closeAdminBtn.addEventListener("click", closeAdmin);
unlockAdminBtn.addEventListener("click", unlockAdmin);
adminForm.addEventListener("submit", addQuestion);
resetQuestionsBtn.addEventListener("click", resetQuestions);
downloadQuestionsBtn.addEventListener("click", downloadQuestions);

window.addEventListener("click", event => {
  if (event.target === adminModal) {
    closeAdmin();
  }
});

loadQuestions().then(displayQuestion);