const GAS_URL = "https://script.google.com/macros/s/AKfycbwvMREPiX2WvxVxKQD6eh131J1NiyZEX8Sn_KgLV_e4y1eEamNacJFIFKbGiUHVmWNrYg/exec";

let quiz = [];
let current = 0;
let score = 0;

let selectedIndex = null;
let answered = false;

let answersLog = [];
let userName = "";

/* DOM */
const qEl = document.getElementById("question");
const cEl = document.getElementById("choices");
const nextBtn = document.getElementById("next");
const textBox = document.getElementById("text-box");
const result = document.getElementById("result");
const progress = document.getElementById("progress");

/* =====================
   初期（読み込み中）
===================== */
nextBtn.classList.add("hidden");

/* =====================
   開始
===================== */
function startQuiz(){
  const name = document.getElementById("username").value.trim();
  if(!name) return alert("名前入れて");

  userName = name;

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
   問題表示
===================== */
function load(){
  answered = false;
  selectedIndex = null;

  nextBtn.classList.add("hidden");
  nextBtn.disabled = true;
  nextBtn.textContent = "回答";

  // ★記述UIリセット（重要）
  textBox.classList.add("hidden");
  textBox.style.border = "none";

  const input = document.getElementById("text-input");
  input.value = "";
  input.disabled = false;

  const q = quiz[current];

  qEl.innerHTML = q.q.replace(/\n/g,"<br>");
  cEl.innerHTML = "";

  q.choices.forEach((c,i)=>{
    const btn = document.createElement("button");
    btn.textContent = c;

    btn.onclick = () => {
      if(answered) return;

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
   回答処理
===================== */
function next(){
  const q = quiz[current];

  if(!answered){

    if(selectedIndex === null) return;

    answered = true;

    const isCorrect = selectedIndex === q.correct;
    if(isCorrect) score++;

    answersLog.push({
      id: q.id,
      type: "choice",
      question: q.q,
      input: q.choices[selectedIndex],
      correct: isCorrect
    });

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
       trigger処理（安全版）
    ===================== */
    const raw = String(q.trigger ?? "").trim();
    const triggerIndex = /^[0-9]+$/.test(raw) ? Number(raw) : null;

    const needText =
      triggerIndex !== null &&
      selectedIndex === triggerIndex;

    if(needText){
      textBox.classList.remove("hidden");
      document.getElementById("text-input").focus();

      nextBtn.textContent = "回答待ち";

      // ★白UI
      nextBtn.style.background = "#ffffff";
      nextBtn.style.color = "#333";
      nextBtn.style.border = "1px solid #ddd";

      nextBtn.disabled = true;

      return;
    }

    // 通常
    nextBtn.textContent = "次へ";
    nextBtn.disabled = false;

    nextBtn.style.background = "#6c7cff";
    nextBtn.style.color = "white";
    nextBtn.style.border = "none";

    return;
  }

  current++;

  if(current >= quiz.length){
    finish();
  } else {
    load();
  }
}

/* =====================
   記述回答
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
    question: q.textQ,
    input: val,
    correct: ok
  });

  if(ok) score++;

  document.getElementById("text-input").disabled = true;

  textBox.style.border = ok
    ? "2px solid #3ddc97"
    : "2px solid #ff6b6b";

  nextBtn.disabled = false;
  nextBtn.textContent = "次へ";

  nextBtn.style.background = "#6c7cff";
  nextBtn.style.color = "white";
  nextBtn.style.border = "none";
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

  const rate = Math.round((score / quiz.length) * 100);

  result.innerHTML = `
    <h2>結果</h2>
    正答率: ${rate}%<br>
    (${score}/${quiz.length})
  `;
}

/* expose */
window.startQuiz = startQuiz;
window.next = next;
window.submitText = submitText;
