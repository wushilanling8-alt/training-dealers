
const GAS_URL = "https://script.google.com/macros/s/AKfycbwF92XKX_im2BqGx8pz8VbzjDjc8pzS7z1AGA79h_NjMgdfhjbUOH4gHbPnIwansRcH4A/exec";

let quiz = [];
let current = 0;

let selectedIndex = null;
let state = "select";

let scoreChoice = 0;
let userId = "";
let logBuffer = [];

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
  userId = document.getElementById("username").value.trim();
  if(!userId) return alert("名前入れて");

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
function reset(){
  selectedIndex = null;
  state = "select";

  textBox.classList.add("hidden");
  inputEl.value = "";

  nextBtn.classList.add("hidden");
  nextBtn.onclick = submit;

  [...cEl.children].forEach(b=>{
    b.classList.remove("selected","correct","wrong");
  });
}

/* =====================
   表示
===================== */
function load(){
  reset();

  const q = quiz[current];

  qEl.innerHTML = q.q.replace(/\n/g,"<br>");
  cEl.innerHTML = "";

  q.choices.forEach((c,i)=>{
    const btn = document.createElement("button");
    btn.textContent = c;

    btn.onclick = () => {

      selectedIndex = i;

      [...cEl.children].forEach(b=>{
        b.classList.remove("selected");
      });

      btn.classList.add("selected");

      const trigger = (q.trigger || "").toString().trim();

      if(trigger !== "" && trigger === String(i)){
        textBox.classList.remove("hidden");
      } else {
        textBox.classList.add("hidden");
      }

      nextBtn.classList.remove("hidden");
    };

    cEl.appendChild(btn);
  });

  updateProgress();
}

/* =====================
   回答確定
===================== */
function submit(){

  if(state !== "select") return;

  const q = quiz[current];
  if(selectedIndex === null) return;

  const isCorrect = selectedIndex === q.correct;

  if(isCorrect) scoreChoice++;

  /* UI反映 */
  const buttons = [...cEl.children];

  buttons.forEach((b,i)=>{
    if(i === q.correct){
      b.classList.add("correct");
    }
    if(i === selectedIndex && !isCorrect){
      b.classList.add("wrong");
    }
  });

  /* log */
  logBuffer.push({
    id: q.id,
    type: "choice",
    question: q.q,
    input: q.choices[selectedIndex],
    correct: isCorrect
  });

  if((q.trigger || "").toString().trim() !== ""){
    logBuffer.push({
      id: q.id,
      type: "text",
      input: inputEl.value || "",
      correct: null
    });
  }

  fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify({
      userId,
      log: logBuffer.slice(-2)
    })
  });

  state = "done";

  nextBtn.textContent = "次へ";
  nextBtn.onclick = next;
}

/* =====================
   次へ
===================== */
function next(){
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
window.submit = submit;
