const GAS_URL = "https://script.google.com/macros/s/AKfycbwvMREPiX2WvxVxKQD6eh131J1NiyZEX8Sn_KgLV_e4y1eEamNacJFIFKbGiUHVmWNrYg/exec";

let quiz = [];
let current = 0;
let score = 0;

let selectedIndex = null;
let answered = false;

let answersLog = [];
let userName = "";

const qEl = document.getElementById("question");
const cEl = document.getElementById("choices");
const nextBtn = document.getElementById("next");
const textBox = document.getElementById("text-box");
const result = document.getElementById("result");
const progress = document.getElementById("progress");

/* =====================
   初期状態で完全非表示
===================== */
nextBtn.classList.add("hidden");   // ★追加

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

  nextBtn.classList.add("hidden"); // ★読み込み中は完全に消す

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

  nextBtn.classList.add("hidden"); // ★毎回一旦隠す
  nextBtn.disabled = true;
  nextBtn.textContent = "回答";

  textBox.classList.add("hidden");

  const q = quiz[current];

  qEl.innerHTML = q.q.replace(/\n/g,"<br>");
  cEl.innerHTML = "";

  document.getElementById("text-input").value = "";

  q.choices.forEach((c,i)=>{
    const btn = document.createElement("button");
    btn.textContent = c;

    btn.onclick = () => {
      if(answered) return;

      selectedIndex = i;

      [...cEl.children].forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");

      nextBtn.disabled = false;
      nextBtn.classList.remove("hidden"); // ★選択したら出す
    };

    cEl.appendChild(btn);
  });

  updateProgress();
}

/* =====================
   回答
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

      if(i === selectedIndex && isCorrect){
        btn.classList.add("correct");
      }
    });

    nextBtn.textContent = "次へ";
    nextBtn.disabled = false;
    nextBtn.classList.remove("hidden"); // ★確実に表示

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
