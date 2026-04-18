const GAS_URL = "https://script.google.com/macros/s/AKfycbwrUjxTJlBgwBDZ_1vsX_d6s6yx5STNFnrald4mJu2pS1WaA0zObpagFgGUq-7vCPxltA/exec";

let quiz = [];
let current = 0;

let selectedIndex = null;

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

  nextBtn.classList.add("hidden");
  nextBtn.textContent = "回答";

  textBox.classList.add("hidden");
  textBox.classList.remove("correct","wrong");

  inputEl.value = "";
  inputEl.disabled = false;

  nextBtn.onclick = submitAll;
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

      if(trigger !== "" && trigger === String(i)){
        showText();
      } else {
        showAnswer();
      }
    };

    cEl.appendChild(btn);
  });

  updateProgress();
}

/* =====================
   記述表示
===================== */
function showText(){
  textBox.classList.remove("hidden");
  inputEl.focus();

  // 入力監視 → 入力されたらボタン出す
  inputEl.oninput = () => {
    if(inputEl.value.trim().length > 0){
      showAnswer();
    } else {
      nextBtn.classList.add("hidden");
    }
  };
}

/* =====================
   回答ボタン表示
===================== */
function showAnswer(){
  nextBtn.classList.remove("hidden");
  nextBtn.disabled = false;
}

/* =====================
   回答確定
===================== */
function submitAll(){
  const q = quiz[current];

  const choiceCorrect = selectedIndex === q.correct;

  if(choiceCorrect) scoreChoice++;

  answersLog.push({
    id: q.id,
    type: "choice",
    input: q.choices[selectedIndex],
    correct: choiceCorrect
  });

  /* =====================
     記述（ここが修正ポイント）
  ===================== */
  const trigger = (q.trigger ?? "").toString().trim();

  if(trigger !== ""){
    const val = inputEl.value.trim(); // ←毎回DOMから取得（重要）

    const answers = String(q.textA ?? "")
      .split(",")
      .map(a => a.replace(/\s/g,"").toLowerCase())
      .filter(Boolean);

    const ok = answers.includes(val.replace(/\s/g,"").toLowerCase());

    if(ok) scoreText++;

    totalText++;

    answersLog.push({
      id: q.id,
      type: "text",
      input: val,
      correct: ok
    });
  }

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
