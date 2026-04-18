const GAS_URL = "https://script.google.com/macros/s/AKfycbwrUjxTJlBgwBDZ_1vsX_d6s6yx5STNFnrald4mJu2pS1WaA0zObpagFgGUq-7vCPxltA/exec";

let quiz = [];
let current = 0;

let selectedIndex = null;
let textVisible = false;

let scoreChoice = 0;

let answersLog = [];

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
  textVisible = false;

  nextBtn.classList.add("hidden");
  inputEl.value = "";

  textBox.classList.add("hidden");

  nextBtn.onclick = submitAll;
}

/* =====================
   表示
===================== */
function load(){
  resetUI();

  const q = quiz[current];

  qEl.innerHTML = q.q.replace(/\n/g,"<br>");
  cEl.innerHTML = "";

  q.choices.forEach((c,i)=>{
    const btn = document.createElement("button");
    btn.textContent = c;

    btn.onclick = () => {
      selectedIndex = i;

      [...cEl.children].forEach(b=>{
        b.classList.remove("selected","correct","wrong");
      });

      btn.classList.add("selected");

      const trigger = (q.trigger ?? "").toString().trim();

      if(trigger !== "" && trigger === String(i)){
        showText();
      } else {
        hideText();
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
  textVisible = true;
  textBox.classList.remove("hidden");

  inputEl.oninput = () => {
    if(inputEl.value.trim().length > 0){
      showAnswer();
    } else {
      nextBtn.classList.add("hidden");
    }
  };
}

/* =====================
   記述非表示
===================== */
function hideText(){
  textVisible = false;
  textBox.classList.add("hidden");
}

/* =====================
   回答ボタン
===================== */
function showAnswer(){
  nextBtn.classList.remove("hidden");
}

/* =====================
   回答確定（選択のみ採点）
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

  /* 記述はログのみ */
  const trigger = (q.trigger ?? "").toString().trim();

  if(trigger !== ""){
    answersLog.push({
      id: q.id,
      type: "text",
      input: inputEl.value.trim(),
      correct: null
    });
  }

  /* 正誤表示 */
  const buttons = [...cEl.children];

  buttons.forEach((btn,i)=>{
    btn.classList.remove("selected");

    if(i === q.correct){
      btn.classList.add("correct");
    }

    if(i === selectedIndex && selectedIndex !== q.correct){
      btn.classList.add("wrong");
    }
  });

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

  const rate = Math.round((scoreChoice / quiz.length) * 100);

  result.innerHTML = `
    <h2>結果</h2>
    正答率: ${rate}%<br>
    (${scoreChoice}/${quiz.length})
  `;
}

/* expose */
window.startQuiz = startQuiz;
