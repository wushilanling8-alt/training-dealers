const GAS_URL = "https://script.google.com/macros/s/AKfycbxq_1gJ9E8nfzNm6_twY_8rw7G907xUDhu9fwIdmgHr9DLua8K9t_95AKtWIHx2QmgP-w/exec";

let quiz = [];
let current = 0;

let selectedIndex = null;
let state = "select";

let scoreChoice = 0;
let userId = "";

let textAnswer = "";

/* DOM */
const qEl = document.getElementById("question");
const cEl = document.getElementById("choices");
const nextBtn = document.getElementById("next");
const textBox = document.getElementById("text-box");
const textQEl = document.getElementById("text-question");
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
  textAnswer = "";

  textBox.classList.add("hidden");
  textQEl.textContent = "";
  inputEl.value = "";

  nextBtn.classList.add("hidden");
  nextBtn.textContent = "回答";
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

      /* 記述表示 */
      if(trigger !== "" && trigger === String(i)){
        textBox.classList.remove("hidden");
        textQEl.textContent = q.textQ || "";
      } else {
        textBox.classList.add("hidden");
        textQEl.textContent = "";
        inputEl.value = "";
        textAnswer = "";
      }

      nextBtn.classList.remove("hidden");
    };

    cEl.appendChild(btn);
  });

  updateProgress();
}

/* =====================
   入力保持
===================== */
inputEl.oninput = () => {
  textAnswer = inputEl.value;
};

/* =====================
   回答確定
===================== */
function submit(){

  if(state !== "select") return;

  const q = quiz[current];
  if(selectedIndex === null) return;

  const isCorrect = selectedIndex === q.correct;

  if(isCorrect) scoreChoice++;

  /* 色 */
  const buttons = [...cEl.children];

  buttons.forEach((b,i)=>{
    if(i === q.correct){
      b.classList.add("correct");
    }
    if(i === selectedIndex && !isCorrect){
      b.classList.add("wrong");
    }
  });

  /* 送信ログ */
  const sendLog = [];

  sendLog.push({
    id: q.id,
    type: "choice",
    question: q.q,
    input: q.choices[selectedIndex],
    correct: isCorrect
  });

  if(textAnswer.trim() !== ""){
    sendLog.push({
      id: q.id,
      type: "text",
      question: q.textQ || "",
      input: textAnswer.trim(),
      correct: null
    });
  }

  fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify({
      userId,
      log: sendLog
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
