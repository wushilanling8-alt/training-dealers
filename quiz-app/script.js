const GAS_URL = "https://script.google.com/macros/s/AKfycbwvMREPiX2WvxVxKQD6eh131J1NiyZEX8Sn_KgLV_e4y1eEamNacJFIFKbGiUHVmWNrYg/exec";

let quiz = [];
let current = 0;
let score = 0;
let maxScore = 0;

let selectedIndex = null;
let answered = false;

let answersLog = [];
let userName = "";

const qEl = document.getElementById("question");
const cEl = document.getElementById("choices");
const nextBtn = document.getElementById("next");
const textBox = document.getElementById("text-box");
const result = document.getElementById("result");

// 開始
function startQuiz(){
  const name = document.getElementById("username").value.trim();
  if(!name){
    alert("名前入れて");
    return;
  }

  userName = name;

  document.getElementById("name-box").classList.add("hidden");
  document.getElementById("quiz-box").classList.remove("hidden");

  init();
}

// 初期化
async function init(){
  qEl.textContent = "読み込み中...";
  const res = await fetch(GAS_URL + "?type=questions");
  quiz = await res.json();
  load();
}

// 表示
function load(){
  answered = false;
  selectedIndex = null;

  nextBtn.textContent = "回答";
  nextBtn.classList.remove("hidden");
  textBox.classList.add("hidden");

  const q = quiz[current];

  updateProgress();

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

  maxScore++;
}

// 回答 / 次へ
function next(){
  const q = quiz[current];

  // 回答フェーズ
  if(!answered){
    if(selectedIndex === null){
      alert("選択して");
      return;
    }

    answered = true;

    // ログ
    answersLog.push({
      id: q.id,
      type: "choice",
      question: q.q,
      input: q.choices[selectedIndex],
      correct: selectedIndex === q.correct
    });

    // 色付け
    [...cEl.children].forEach((btn,i)=>{
      if(i === q.correct){
        btn.classList.add("correct");
      } else if(i === selectedIndex){
        btn.classList.add("wrong");
      }
    });

    if(selectedIndex === q.correct) score++;

    // 記述
    if(q.trigger !== "" && selectedIndex == q.trigger){
      textBox.classList.remove("hidden");
      maxScore++;
    }

    nextBtn.textContent = "次へ";
    return;
  }

  // 次へ
  current++;
  if(current >= quiz.length){
    finish();
  } else {
    load();
  }
}

// 記述回答
function submitText(){
  const val = document.getElementById("text-input").value.trim();
  const q = quiz[current];

  const textA = String(q.textA || "");
  const answers = textA.split(",").map(a=>a.trim().toLowerCase());

  answersLog.push({
    id: q.id,
    type: "text",
    question: q.textQ,
    input: val,
    correct: answers.includes(val.toLowerCase())
  });

  if(answers.includes(val.toLowerCase())) score++;
}

// プログレス
function updateProgress(){
  const bar = document.getElementById("progress");
  const percent = ((current+1)/quiz.length)*100;
  bar.style.width = percent + "%";
}

// 終了
function finish(){
  document.getElementById("quiz-box").classList.add("hidden");
  result.classList.remove("hidden");

  const rate = Math.round(score/maxScore*100);

  result.innerHTML = `
    正答率: ${rate}%<br>
    (${score}/${maxScore})
  `;

  fetch(GAS_URL,{
    method:"POST",
    body:JSON.stringify({
      userId: userName,
      correct: score,
      total: maxScore,
      log: answersLog
    })
  });
}

// グローバル化
window.startQuiz = startQuiz;
window.next = next;
window.submitText = submitText;