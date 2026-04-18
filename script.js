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
  nextBtn.classList.add("hidden");

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
  nextBtn.disabled = true;

  textBox.classList.add("hidden");
  textBox.classList.remove("correct","wrong");

  const input = document.getElementById("text-input");
  input.value = "";
  input.disabled = false;
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

      nextBtn.classList.remove("hidden");
      nextBtn.disabled = false;
    };

    cEl.appendChild(btn);
  });

  updateProgress();
}

/* =====================
   回答（最終確定）
===================== */
function next(){
  const q = quiz[current];

  if(selectedIndex === null) return;

  const trigger = (q.trigger ?? "").toString().trim();
  const selected = selectedIndex.toString();

  /* =====================
     記述あり → 記述フェーズへ
  ===================== */
  if(trigger !== "" && trigger === selected){

    textBox.classList.remove("hidden");
    document.getElementById("text-input").focus();

    nextBtn.textContent = "回答確定";
    nextBtn.disabled = false;

    // ★ここで「確定処理に移る」
    nextBtn.onclick = submitAll;

    return;
  }

  /* =====================
     記述なし → 即確定
  ===================== */
  submitAll();
}

/* =====================
   最終確定処理
===================== */
function submitAll(){
  const q = quiz[current];

  const textVal = document.getElementById("text-input").value.trim();

  /* ---- 選択判定 ---- */
  const isChoiceCorrect = selectedIndex === q.correct;

  if(isChoiceCorrect) scoreChoice++;

  answersLog.push({
    id: q.id,
    type: "choice",
    input: q.choices[selectedIndex],
    correct: isChoiceCorrect
  });

  /* ---- 記述判定（ある場合だけ） ---- */
  const hasText = (q.trigger ?? "").toString().trim() !== "";

  if(hasText){
    const answers = String(q.textA || "")
      .split(",")
      .map(a => a.trim().toLowerCase());

    const ok = answers.includes(textVal.toLowerCase());

    if(ok) scoreText++;

    totalText++;

    answersLog.push({
      id: q.id,
      type: "text",
      input: textVal,
      correct: ok
    });
  }

  /* 次へ */
  current++;

  if(current >= quiz.length){
    finish();
  } else {
    load();

    // onclick戻す
    nextBtn.onclick = next;
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
window.next = next;
window.submitAll = submitAll;
