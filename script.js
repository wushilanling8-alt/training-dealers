const GAS_URL = "https://script.google.com/macros/s/AKfycbwrUjxTJlBgwBDZ_1vsX_d6s6yx5STNFnrald4mJu2pS1WaA0zObpagFgGUq-7vCPxltA/exec";

let quiz = [];
let current = 0;

let selectedIndex = null;
let phase = "select";

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
  phase = "select";

  nextBtn.classList.add("hidden");

  textBox.classList.add("hidden");
  textBox.classList.remove("correct","wrong");

  document.getElementById("text-input").value = "";
  document.getElementById("text-input").disabled = false;
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
      if(phase !== "select") return;

      selectedIndex = i;

      [...cEl.children].forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");

      const trigger = (q.trigger ?? "").toString().trim();
      const selected = selectedIndex.toString();

      /* 記述あり */
      if(trigger !== "" && trigger === selected){
        phase = "text";

        textBox.classList.remove("hidden");
        document.getElementById("text-input").focus();

        return;
      }

      showAnswerButton();
    };

    cEl.appendChild(btn);
  });

  updateProgress();
}

/* =====================
   回答ボタン表示
===================== */
function showAnswerButton(){
  phase = "answer";

  nextBtn.classList.remove("hidden");
  nextBtn.textContent = "回答確定";
  nextBtn.disabled = false;
}

/* =====================
   回答確定
===================== */
function next(){
  submitAll();
}

/* =====================
   最終処理（ここが修正ポイント）
===================== */
function submitAll(){
  const q = quiz[current];

  const isChoiceCorrect = selectedIndex === q.correct;
  if(isChoiceCorrect) scoreChoice++;

  answersLog.push({
    id: q.id,
    type: "choice",
    input: q.choices[selectedIndex],
    correct: isChoiceCorrect
  });

  const trigger = (q.trigger ?? "").toString().trim();

  if(trigger !== ""){
    const val = document.getElementById("text-input").value.trim();

    const answers = String(q.textA || "")
      .split(",")
      .map(a => a.trim().toLowerCase());

    const ok = answers.includes(val.toLowerCase());

    if(ok) scoreText++;

    totalText++;

    answersLog.push({
      id: q.id,
      type: "text",
      input: val,
      correct: ok
    });
  }

  /* =====================
     ★ここ重要：次へボタンを必ず出す
  ===================== */
  phase = "done";

  nextBtn.classList.remove("hidden");
  nextBtn.textContent = "次へ";
  nextBtn.disabled = false;

  nextBtn.onclick = goNext;
}

/* =====================
   次へ進行
===================== */
function goNext(){
  current++;

  if(current >= quiz.length){
    finish();
  } else {
    load();
  }

  nextBtn.onclick = next;
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
