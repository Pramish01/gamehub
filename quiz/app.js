const FILE_PATH = "questions.json";
const ADDED_KEY = "nepali_quiz_added_v1";
const LEVEL_KEY = "nepali_quiz_level";
const COMPLETED_QUESTIONS_KEY = "nepali_quiz_completed";
const MAX_QUESTIONS = 50;
const QUESTIONS_PER_LEVEL = 10;
const ADMIN_CODE = "9605";

const sounds = {
  bg: new Audio('bg.mp3')
};

sounds.bg.loop = true;
sounds.bg.volume = 0.3;

function playBgMusic() {
  sounds.bg.play().catch(e => console.log('Background music play failed:', e));
}

function stopBgMusic() {
  sounds.bg.pause();
  sounds.bg.currentTime = 0;
}

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

  console.log(`Level ${level}: ${available.length} questions available (${completed.length} completed)`);

  // If not enough questions available, reset progress
  if (available.length < QUESTIONS_PER_LEVEL) {
    console.log("Not enough new questions available. Resetting progress to allow question reuse.");
    completedQuestions = [];
    saveCompletedQuestions([]);
    // Shuffle all questions and select
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, QUESTIONS_PER_LEVEL);
  }

  // Shuffle available questions and select the required amount
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, QUESTIONS_PER_LEVEL);
}

async function loadQuestions() {
  playBgMusic();
  let fileQuestions = [];

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

  if (!fileQuestions.length) {
    console.log("Using embedded questions");
    fileQuestions = [
      {"question": "नेपालको राजधानी कुन हो ?", "options": ["पोखरा", "ललितपुर", "काठमाडौं", "विराटनगर"], "answer": "काठमाडौं"},
      {"question": "नेपालको राष्ट्रिय जनावर कुन हो ?", "options": ["बाघ", "गैंडा", "गाई", "हात्ती"], "answer": "गाई"},
      {"question": "नेपालको राष्ट्रिय फूल कुन हो ?", "options": ["कमल", "लालीगुराँस", "चमेली", "सुनाखरी"], "answer": "लालीगुराँस"},
      {"question": "नेपालको सबैभन्दा अग्लो हिमाल कुन हो ?", "options": ["मकालु", "धौलागिरी", "सगरमाथा", "कञ्चनजङ्घा"], "answer": "सगरमाथा"},
      {"question": "बुद्धको जन्मस्थल कहाँ हो ?", "options": ["जनकपुर", "लुम्बिनी", "कपिलवस्तु", "पोखरा"], "answer": "लुम्बिनी"},
      {"question": "नेपालमा कति वटा प्रदेश छन् ?", "options": ["5", "6", "7", "8"], "answer": "7"},
      {"question": "नेपालको राष्ट्रिय खेल कुन हो ?", "options": ["क्रिकेट", "फुटबल", "भलिबल", "कबड्डी"], "answer": "भलिबल"},
      {"question": "नेपालको मुद्रा के हो ?", "options": ["डलर", "रुपैया", "टका", "रुपैयाँ"], "answer": "रुपैया"},
      {"question": "नेपालको झण्डा कस्तो आकारको छ ?", "options": ["आयताकार", "वर्गाकार", "दुई त्रिकोणात्मक", "गोलाकार"], "answer": "दुई त्रिकोणात्मक"},
      {"question": "जनकपुर कुन प्रदेशमा पर्दछ ?", "options": ["कोशी", "मधेश", "बागमती", "लुम्बिनी"], "answer": "मधेश"},
      {"question": "नेपालको सबैभन्दा ठूलो ताल कुन हो ?", "options": ["फेवा ताल", "रारा ताल", "तिलिचो ताल", "बेगनास ताल"], "answer": "रारा ताल"},
      {"question": "नेपालको सबैभन्दा लामो नदी कुन हो ?", "options": ["कर्णाली", "कोशी", "गण्डकी", "बागमती"], "answer": "कर्णाली"},
      {"question": "नेपालको संविधान कहिले जारी भयो ?", "options": ["२०७०", "२०७१", "२०७२", "२०७३"], "answer": "२०७२"},
      {"question": "नेपाल कहिले गणतन्त्र घोषणा भयो ?", "options": ["२०६२", "२०६३", "२०६५", "२०७०"], "answer": "२०६५"},
      {"question": "पशुपतिनाथ मन्दिर कुन नदीको किनारमा छ ?", "options": ["कोशी", "कर्णाली", "बागमती", "गण्डकी"], "answer": "बागमती"},
      {"question": "पोखरा कुन प्रदेशमा पर्दछ ?", "options": ["बागमती", "गण्डकी", "लुम्बिनी", "सुदूरपश्चिम"], "answer": "गण्डकी"},
      {"question": "चितवन राष्ट्रिय निकुञ्ज कुन जनावरका लागि प्रसिद्ध छ ?", "options": ["एकसिङ्गे गैंडा", "बाघ", "हात्ती", "चितुवा"], "answer": "एकसिङ्गे गैंडा"},
      {"question": "नेपालको समय GMT भन्दा कति अगाडि छ ?", "options": ["5 घण्टा", "5:30 घण्टा", "5:45 घण्टा", "6 घण्टा"], "answer": "5:45 घण्टा"},
      {"question": "नेपालको एकीकरण गर्ने राजा को हुन् ?", "options": ["महेन्द्र", "त्रिभुवन", "पृथ्वीनारायण शाह", "बीरेन्द्र"], "answer": "पृथ्वीनारायण शाह"},
      {"question": "रारा ताल कुन जिल्लामा पर्छ ?", "options": ["मुगु", "डोल्पा", "हुम्ला", "मुस्ताङ"], "answer": "मुगु"},
      {"question": "नेपालको क्षेत्रफल कति छ ?", "options": ["1,47,181", "1,48,181", "1,49,181", "1,50,181"], "answer": "1,48,181"},
      {"question": "नेपाल UN को सदस्य कहिले बन्यो ?", "options": ["1950", "1953", "1955", "1960"], "answer": "1955"},
      {"question": "नेपालको सबैभन्दा होचो स्थान कुन हो ?", "options": ["केचनाकलाँ", "झापा", "धनुषा", "विराटनगर"], "answer": "केचनाकलाँ"},
      {"question": "नेपालमा कुल जिल्ला कति छन् ?", "options": ["75", "76", "77", "78"], "answer": "77"},
      {"question": "नेपालको पहिलो निर्वाचित प्रधानमन्त्री को थिए ?", "options": ["बी.पी. कोइराला", "मनमोहन अधिकारी", "गिरिजा कोइराला", "पुष्पकमल दाहाल"], "answer": "बी.पी. कोइराला"},
      {"question": "नेपालको सर्वोच्च शिखरको उचाइ कति हो ?", "options": ["8848m", "8849m", "8850m", "8847m"], "answer": "8849m"},
      {"question": "नेपालको पहिलो महिला राष्ट्रपति को हुन् ?", "options": ["विद्या भण्डारी", "ओनसरी घर्ती", "सुजाता कोइराला", "हिसिला यमी"], "answer": "विद्या भण्डारी"},
      {"question": "तिलिचो ताल कुन जिल्लामा पर्छ ?", "options": ["मनाङ", "मुस्ताङ", "डोल्पा", "हुम्ला"], "answer": "मनाङ"},
      {"question": "नेपालको पहिलो जनगणना कहिले भयो ?", "options": ["1911", "1952", "1961", "2007"], "answer": "1911"},
      {"question": "नेपालको सबैभन्दा ठूलो निकुञ्ज कुन हो ?", "options": ["चितवन", "बर्दिया", "शे-फोक्सुण्डो", "सगरमाथा"], "answer": "शे-फोक्सुण्डो"},
      {"question": "नेपालको पहिलो संविधान कहिले जारी भयो ?", "options": ["2004", "2007", "2015", "2019"], "answer": "2007"},
      {"question": "कोशी परियोजना कुन देशसँग सम्बन्धित छ ?", "options": ["चीन", "भारत", "भुटान", "बङ्गलादेश"], "answer": "भारत"},
      {"question": "नेपालमा कति वटा राष्ट्रिय निकुञ्ज छन् ?", "options": ["10", "11", "12", "13"], "answer": "12"},
      {"question": "नेपालको सबैभन्दा अग्लो स्थानमा रहेको ताल कुन हो ?", "options": ["रारा", "तिलिचो", "फोक्सुण्डो", "बेगनास"], "answer": "तिलिचो"},
      {"question": "नेपालको सबैभन्दा पुरानो विश्वविद्यालय कुन हो ?", "options": ["त्रिभुवन विश्वविद्यालय", "काठमाडौं विश्वविद्यालय", "पोखरा विश्वविद्यालय", "पूर्वाञ्चल विश्वविद्यालय"], "answer": "त्रिभुवन विश्वविद्यालय"},
      {"question": "सबैभन्दा धेरै जिल्ला भएको प्रदेश कुन हो ?", "options": ["बागमती", "लुम्बिनी", "कोशी", "मधेश"], "answer": "बागमती"},
      {"question": "नेपाल कहिले SAARC को सदस्य बन्यो ?", "options": ["1985", "1986", "1987", "1990"], "answer": "1985"},
      {"question": "नेपालको सबैभन्दा ठूलो राष्ट्रिय निकुञ्ज कुन हो ?", "options": ["चितवन", "बर्दिया", "शे-फोक्सुण्डो", "सगरमाथा"], "answer": "शे-फोक्सुण्डो"},
      {"question": "नेपाल–चीन सिमाना सन्धि कहिले भयो ?", "options": ["1960", "1961", "1962", "1963"], "answer": "1961"},
      {"question": "नेपालको सबैभन्दा अग्लो झरना कुन हो ?", "options": ["पाताले छाँगो", "ह्यात्रुङ झरना", "रुप्से", "देवी झरना"], "answer": "ह्यात्रुङ झरना"},
      {"question": "नेपालको पहिलो आमनिर्वाचन कहिले सम्पन्न भयो ?", "options": ["2015", "2017", "2019", "2020"], "answer": "2019"},
      {"question": "नेपालको राष्ट्रिय गान कसले लेखेका हुन् ?", "options": ["भानुभक्त आचार्य", "माधवप्रसाद घिमिरे", "व्याकुल माइला", "लक्ष्मीप्रसाद देवकोटा"], "answer": "व्याकुल माइला"},
      {"question": "नेपालको पहिलो महिला प्रधानन्यायाधीश को हुन् ?", "options": ["सुषिला कार्की", "विद्या भण्डारी", "ओनसरी घर्ती", "सपना प्रधान"], "answer": "सुषिला कार्की"},
      {"question": "नेपालमा सबैभन्दा बढी वर्षा हुने स्थान कुन हो ?", "options": ["धरान", "पोखरा", "धनगढी", "इलाम"], "answer": "पोखरा"},
      {"question": "नेपालको पहिलो छापाखाना कहिले स्थापना भयो ?", "options": ["1901", "1913", "1918", "1920"], "answer": "1913"},
      {"question": "नेपालको पहिलो महिला मन्त्री को थिइन् ?", "options": ["साधना प्रधान", "विद्या भण्डारी", "हिसिला यमी", "ओनसरी घर्ती"], "answer": "साधना प्रधान"},
      {"question": "नेपालको पहिलो विमानस्थल कुन हो ?", "options": ["त्रिभुवन अन्तर्राष्ट्रिय विमानस्थल", "सिमरा", "गौतमबुद्ध", "पोखरा"], "answer": "त्रिभुवन अन्तर्राष्ट्रिय विमानस्थल"},
      {"question": "नेपालको सबैभन्दा लामो झोलुङ्गे पुल कुन हो ?", "options": ["कालीगण्डकी", "कुश्मा–बलेवा", "मुस्ताङ पुल", "दोधारा–चाँदनी"], "answer": "कुश्मा–बलेवा"},
      {"question": "नेपालको पहिलो महिला राष्ट्रपति कहिले निर्वाचित भइन् ?", "options": ["2010", "2012", "2015", "2016"], "answer": "2015"},
      {"question": "नेपालको संविधान अनुसार सार्वभौमसत्ता कसमा निहित छ ?", "options": ["राष्ट्रपति", "प्रधानमन्त्री", "संसद", "नेपाली जनता"], "answer": "नेपाली जनता"}
    ];
  }

  const added = getAddedQuestions();
  const merged = [...fileQuestions, ...added];
  allQuestions = merged.map(normalizeQuestion);

  console.log(`Total questions available: ${allQuestions.length}`);

  currentLevel = getCurrentLevel();
  completedQuestions = getCompletedQuestions();

  questions = selectQuestionsForLevel(currentLevel);

  console.log(`Selected ${questions.length} questions for level ${currentLevel}`);

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

  const passed = percentage >= 70;

  if (passed) {
    // Level up
    currentLevel++;
    saveCurrentLevel(currentLevel);
    resultMessageEl.innerHTML = `🎉 Excellent! You scored ${percentage}%<br>Level ${currentLevel} unlocked! Click "Next Level" to continue.`;
    retakeBtn.textContent = "Next Level";
  } else {
    // Retry current level - remove completed questions for this level so they can try again
    const updatedCompleted = completed.filter(key => {
      return !questions.some(q => (q.question + JSON.stringify(q.options)) === key);
    });
    saveCompletedQuestions(updatedCompleted);
    
    resultMessageEl.innerHTML = `You scored ${percentage}%<br>You need 70% to advance. Try again!`;
    retakeBtn.textContent = "Retry Level";
  }

  quizCard.classList.add("hidden");
  resultsCard.classList.remove("hidden");
}

function resetQuiz() {
  // Reset current quiz state
  currentQuestion = 0;
  userAnswers = [];

  // Select new questions for the current level
  questions = selectQuestionsForLevel(currentLevel);

  if (levelDisplayEl) {
    levelDisplayEl.textContent = `Level ${currentLevel}`;
  }

  resultsCard.classList.add("hidden");
  quizCard.classList.remove("hidden");
  displayQuestion();
}

function nextQuestion() {
  if (userAnswers[currentQuestion] === undefined) {
    // Show warning
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
  // Allow going back to previous questions
  if (currentQuestion > 0) {
    currentQuestion -= 1;
    displayQuestion();
  }
}

function openAdmin() {
  // Open admin modal
  adminModal.classList.remove("hidden");
  adminCodeInput.value = "";
  adminBody.classList.add("hidden");
  adminStatus.textContent = "";
}

function closeAdmin() {
  // Close admin modal
  adminModal.classList.add("hidden");
}

function unlockAdmin() {
  // Check admin code
  if (adminCodeInput.value.trim() === ADMIN_CODE) {
    // Grant access
    adminBody.classList.remove("hidden");
    adminStatus.textContent = "Access granted. You can add questions.";
  } else {
    // Deny access
    adminStatus.textContent = "Invalid code. Try again.";
  }
}

function addQuestion(event) {
  event.preventDefault();
  if (allQuestions.length >= MAX_QUESTIONS) {
    // Limit reached
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
    // Validation failed
    adminStatus.textContent = "Please fill in the question and all options.";
    return;
  }

  // Create new question
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
  // Reset all data
  saveAddedQuestions([]);
  saveCurrentLevel(1);
  saveCompletedQuestions([]);
  currentLevel = 1;
  await loadQuestions();
  adminStatus.textContent = "Reset complete. All progress cleared.";
  resetQuiz();
}

function downloadQuestions() {
  // Download current questions
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