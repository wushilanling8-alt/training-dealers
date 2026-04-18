const GAS_URL = "https://script.google.com/macros/s/AKfycbwrUjxTJlBgwBDZ_1vsX_d6s6yx5STNFnrald4mJu2pS1WaA0zObpagFgGUq-7vCPxltA/exec";

let quiz = [];
let current = 0;

let scoreChoice = 0;
let scoreText = 0;
let totalText = 0;

let selectedIndex = null;
let state = "choice";

let answersLog = [];

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
   リセット
===================== */
function resetUI(){
  selectedIndex = null;
  state = "choice";

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
      if(state !== "choice") return;

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
   メイン
===================== */
function next(){
  const q = quiz[current];

  if(state === "choice"){

    if(selectedIndex === null) return;

    const isCorrect = selectedIndex === q.correct;

    answersLog.push({
      id: q.id,
      type: "choice",
      input: q.choices[selectedIndex],
      correct: isCorrect
    });

    if(isCorrect) scoreChoice++;

    const buttons = [...cEl.children];

    buttons.forEach((btn,i)=>{
      btn.classList.remove("selected");

      if(i === q.correct){
        btn.classList.add("correct");
      }

      if(i === selectedIndex && !isCorrect){
        btn.classList.add("wrong");
      }
    });

    /* =====================
       ★ここが修正ポイント
       F列そのまま比較
    ===================== */
    const trigger = (q.trigger ?? "").toString().trim();
    const selected = selectedIndex.toString();

    const needText = (trigger !== "" && selected === trigger);

    if(needText){
      state = "text";

      textBox.classList.remove("hidden");
      document.getElementById("text-input").focus();

      nextBtn.classList.add("hidden");
      return;
    }

    state = "done";
    nextBtn.textContent = "次へ";
    nextBtn.disabled = false;

    return;
  }

  if(state === "done"){
    current++;
    if(current >= quiz.length){
      finish();
    } else {
      load();
    }
  }
}

/* =====================
   記述
===================== */
function submitText(){
  const val = document.getElementById("text-input").value.trim();
  const q = quiz[current];

  const answers = String(q.textA || "")
    .split(",")
    .map(a => a.trim().toLowerCase());

  const ok = answers.includes(val.toLowerCase());

  answersLog.push({
    id: q.id,
    type: "text",
    input: val,
    correct: ok
  });

  totalText++;
  if(ok) scoreText++;

  const input = document.getElementById("text-input");
  input.disabled = true;

  textBox.classList.remove("hidden");
  textBox.classList.remove("correct","wrong");
  textBox.classList.add(ok ? "correct" : "wrong");

  state = "done";

  nextBtn.classList.remove("hidden");
  nextBtn.textContent = "次へ";
  nextBtn.disabled = false;
}

/* =====================
   プログレス
===================== */
function updateProgress(){
  const percent = (current / quiz.length) * 100;
  progress.style.width = percent + "%";
}

/* =====================
   終了
===================== */
function finish(){
  document.getElementById("quiz-box").classList.add("hidden");
  result.classList.remove("hidden");

  const total = quiz.length;
  const totalCorrect = scoreChoice + scoreText;

  const rate = Math.round((totalCorrect / (total + totalText)) * 100);

  result.innerHTML = `
    <h2>結果</h2>
    正答率: ${rate}%<br>
    選択: ${scoreChoice}/${total}<br>
    記述: ${scoreText}/${totalText}
  `;
}

window.startQuiz = startQuiz;
window.next = next;
window.submitText = submitText;
