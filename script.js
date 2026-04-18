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

  // =====================
  // 👇ここが改善ポイント
  // =====================

  // 入力ロック
  document.getElementById("text-input").disabled = true;

  // 視覚フィードバック（テキストボックス内で完結）
  textBox.style.border = ok
    ? "2px solid #3ddc97"
    : "2px solid #ff6b6b";

  // ボタンを「次へ」に変える
  nextBtn.disabled = false;
  nextBtn.textContent = "次へ";
}
