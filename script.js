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

// ===== ローディング =====
function setLoading(flag){
  nextBtn.disabled = flag;
  nextBtn.style.opacity = flag ? "0.5" : "1";
}

// ===== 開始 =====
function startQuiz(){
  const name = document.getElementById("username").value.trim();
  if(!name) return alert("名前入れて");

  userName = name;

  document.getElementById("name-box").classList.add("hidden");
  document.getElementById("quiz-box").classList.remove("hidden");

  init();
}

// ===== 初期化 =====
async function init(){
  setLoading(true);
  qEl.textContent = "読み込み中...";

  const res = await fetch(GAS_URL + "?type=questions");
  quiz = await res.json();

  setLoading(false);
  load();
}

// ===== 表示 =====
function load(){
  answered = false;
  selectedIndex = null;

  nextBtn.textContent = "回答";
  textBox.classList.add("hidden");

  const q = quiz[current];

  qEl.innerHTML = q.q.replace(/\n/g,"<br>");
  cEl.innerHTML = "";
  document.getElementById("text-input").value = "";

  q.choices.forEach((c,i)=>{
    const btn = document.createElement("button");
    btn.textContent = c;

    btn.onclick = ()=>{
      if(answered) return;

      selectedIndex = i;

      [...cEl.children].forEach(b=>b.classList.remove("selected"));
      btn.classList.add("selected");
    };

    cEl.appendChild(btn);
  });

  updateProgress();
}

// ===== 回答 / 次へ =====
function next(){
  const q = quiz[current];

  // 回答フェーズ
  if(!answered){
    if(selectedIndex === null){
      alert("選択して");
      return;
    }

    answered = true;

    const isCorrect = selectedIndex === q.correct;
    if(isCorrect) score++;

    // ログ
    answersLog.push({
      id: q.id,
      type: "choice",
      question: q.q,
      input: q.choices[selectedIndex],
      correct: isCorrect
    });

    // 視覚フィードバック（画面全体）
    document.body.classList.add(isCorrect ? "correct" : "wrong");

    // ボタン色
    [...cEl.children].forEach((btn,i)=>{
      if(i === q.correct){
        btn.classList.add("correct");
      }
      if(i === selectedIndex && !isCorrect){
        btn.classList.add("wrong");
      }
    });

    // 条件付き記述
    if(q.trigger !== "" && selectedIndex == q.trigger){
      textBox.classList.remove("hidden");
    }

    nextBtn.textContent = "次へ";
    return;
  }

  // 次へ
  document.body.classList.remove("correct","wrong");

  current++;

  if(current >= quiz.length){
    finish();
  } else {
    load();
  }
}

// ===== 記述 =====
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
}

// ===== プログレス =====
function updateProgress(){
  const percent = ((current) / quiz.length) * 100;
  progress.style.width = percent + "%";
}

// ===== 終了 =====
function finish(){
  document.getElementById("quiz-box").classList.add("hidden");
  result.classList.remove("hidden");

  const rate = Math.round((score / quiz.length) * 100);

  result.innerHTML = `
    <h2>結果</h2>
    正答率: ${rate}%<br>
    (${score}/${quiz.length})
  `;

  fetch(GAS_URL,{
    method:"POST",
    body:JSON.stringify({
      userId: userName,
      correct: score,
      total: quiz.length,
      log: answersLog
    })
  });
}

// expose
window.startQuiz = startQuiz;
window.next = next;
window.submitText = submitText;
