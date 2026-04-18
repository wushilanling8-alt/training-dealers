const GAS_URL = "https://script.google.com/macros/s/AKfycbwrUjxTJlBgwBDZ_1vsX_d6s6yx5STNFnrald4mJu2pS1WaA0zObpagFgGUq-7vCPxltA/exec";

let quiz = [];
let current = 0;

let selectedIndex = null;
let textValue = "";

let answersLog = [];

let scoreChoice = 0;
let scoreText = 0;
let totalText = 0;

/* DOM */
const qEl = document.getElementById("question");
const cEl = document.getElementById("choices");
const nextBtn = document.getElementById("next");
const textBox = document.getElementById("text-box");
const inputEl = document.getElementById("text-input");
const result = document.getElementById("result");
const progress = document.getElementById("progress");

/* =====================
   開始
===================== */
function startQuiz(){
  document.getElementById("name-box").classList.add("hidden");
  document.getElementById("quiz-box").classList.remove("hidden");
  init();
}

/* =====================
   読み込み
===================== */
async function init(){
  qEl.textContent = "読み込み中...";

  const res = await fetch(GAS_URL + "?type=questions");
  quiz = await res.json();

  load();
}

/* =====================
   初期化
===================== */
function resetUI(){
  selectedIndex = null;
  textValue = "";

  nextBtn.classList.add("hidden");
  nextBtn.textContent = "回答";
  nextBtn.onclick = submitAll;

  textBox.classList.add("hidden");
  inputEl.value = "";
  inputEl.disabled = false;
}

/* =====================
   表示
===================== */
function load(){
  resetUI();

  const q = quiz[current];

  qEl.innerHTML = (q.q || "").replace(/\n/g,"<br>");
  cEl.innerHTML = "";

  q.choices.forEach((c,i)=>{
    const btn = document.createElement("button");
    btn.textContent = c;

    btn.onclick = () => {
      selectedIndex = i;

      [...cEl.children].forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");

      const trigger = (q.trigger ?? "").toString().trim();

      /* 記述ありなら表示 */
      if(trigger !== "" && trigger === String(i)){
        showTextBox();
      } else {
        showAnswerButton();
      }
    };

    cEl.appendChild(btn);
  });

  updateProgress();
}

/* =====================
   記述表示
===================== */
function showTextBox(){
  textBox.classList.remove("hidden");

  inputEl.focus();

  inputEl.oninput = () => {
    textValue = inputEl.value.trim();

    if(textValue.length > 0){
      showAnswerButton();
    } else {
      nextBtn.classList.add("hidden");
    }
  };
}

/* =====================
   回答ボタン表示
===================== */
function showAnswerButton(){
  nextBtn.classList.remove("hidden");
  nextBtn.disabled = false;
}

/* =====================
   回答確定
===================== */
function submitAll(){
  const q = quiz[current];

  if(selectedIndex === null) return;

  /* 選択判定 */
  const isChoiceCorrect = selectedIndex === q.correct;
  if(isChoiceCorrect) scoreChoice++;

  answersLog.push({
    id: q.id,
    type: "choice",
    input: q.choices[selectedIndex],
    correct: isChoiceCorrect
  });

  /* 記述判定 */
  const trigger = (q.trigger ?? "").toString().trim();

  if(trigger !== ""){
    const answers = String(q.textA ?? "")
      .split(",")
      .map(a => a.replace(/\s/g,"").toLowerCase())
      .filter(Boolean);

    const ok = answers.includes(textValue.replace(/\s/g,"").toLowerCase());

    if(ok) scoreText++;

    totalText++;

    answersLog.push({
      id: q.id,
      type: "text",
      input: textValue,
      correct: ok
    });
  }

  /* 次へ */
  nextBtn.textContent = "次へ";
  nextBtn.onclick = goNext;
}

/* =====================
   次へ
===================== */
function goNext(){
  current++;

  if(current >= quiz.length){
    finish();
  } else {
    load();
  }
}

/* =====================
   プログレス
===================== */
function updateProgress(){
  progress.style.width = (current / quiz.length) * 100 + "%";
}

/* =====================
   終了
===================== */
function finish(){
  document.getElementById("quiz-box").classList.add("hidden");
  result.classList.remove("hidden");

  const total = quiz.length;
  const rate = Math.round(((scoreChoice + scoreText) / total) * 100);

  result.innerHTML = `
    <h2>結果</h2>
    正答率: ${rate}%<br>
    選択: ${scoreChoice}/${total}<br>
    記述: ${scoreText}/${totalText}
  `;
}

/* expose */
window.startQuiz = startQuiz;
