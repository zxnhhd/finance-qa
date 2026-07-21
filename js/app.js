(() => {
  const kb = window.FINANCE_KB || [];
  const categories = window.FINANCE_CATEGORIES || ["全部"];

  const faqList = document.getElementById("faqList");
  const categoryFilters = document.getElementById("categoryFilters");
  const searchInput = document.getElementById("searchInput");
  const questionInput = document.getElementById("questionInput");
  const askBtn = document.getElementById("askBtn");
  const answerBox = document.getElementById("answerBox");

  let activeCategory = "全部";

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/\s+/g, "");
  }

  function scoreMatch(item, query) {
    if (!query) return 0;
    const q = normalize(query);
    const haystack = normalize(
      [item.question, item.answer, item.category, ...(item.tags || [])].join(" ")
    );

    let score = 0;
    if (haystack.includes(q)) score += 10;

    const tokens = String(query)
      .toLowerCase()
      .split(/[\s,，、？?！!。；;：:]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);

    for (const token of tokens) {
      if (normalize(item.question).includes(token)) score += 4;
      if ((item.tags || []).some((tag) => normalize(tag).includes(token))) score += 3;
      if (normalize(item.answer).includes(token)) score += 1;
      if (normalize(item.category).includes(token)) score += 2;
    }

    return score;
  }

  function filteredItems() {
    const query = searchInput.value.trim();
    return kb
      .filter((item) => activeCategory === "全部" || item.category === activeCategory)
      .map((item) => ({ item, score: query ? scoreMatch(item, query) : 1 }))
      .filter(({ score }) => (query ? score > 0 : true))
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }

  function renderFilters() {
    categoryFilters.innerHTML = "";
    categories.forEach((category) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `filter-btn${category === activeCategory ? " is-active" : ""}`;
      btn.textContent = category;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", category === activeCategory ? "true" : "false");
      btn.addEventListener("click", () => {
        activeCategory = category;
        renderFilters();
        renderFaq();
      });
      categoryFilters.appendChild(btn);
    });
  }

  function renderFaq() {
    const items = filteredItems();
    faqList.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "没有找到匹配的问答，试试换个关键词。";
      faqList.appendChild(empty);
      return;
    }

    items.forEach((item, index) => {
      const details = document.createElement("details");
      details.className = "faq-item";
      details.style.animationDelay = `${Math.min(index, 8) * 0.04}s`;

      const summary = document.createElement("summary");
      summary.innerHTML = `
        <span class="faq-category">${item.category}</span>
        <span class="faq-question">${item.question}</span>
      `;

      const answer = document.createElement("p");
      answer.className = "faq-answer";
      answer.textContent = item.answer;

      details.append(summary, answer);
      faqList.appendChild(details);
    });
  }

  function findBestAnswer(query) {
    const ranked = kb
      .map((item) => ({ item, score: scoreMatch(item, query) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    return ranked[0] || null;
  }

  function showAnswer(html, visible = true) {
    answerBox.innerHTML = html;
    answerBox.classList.toggle("is-visible", visible);
  }

  function handleAsk() {
    const query = questionInput.value.trim();
    if (!query) {
      showAnswer(`<div class="meta">提示</div><div>请先输入一个财务问题。</div>`);
      questionInput.focus();
      return;
    }

    const best = findBestAnswer(query);
    if (!best) {
      showAnswer(
        `<div class="meta">暂未匹配</div>
         <div>知识库里还没有足够接近的答案。你可以浏览下方分类，或把这个问题补充进 <code>js/knowledge.js</code>。</div>`
      );
      return;
    }

    const { item, score } = best;
    showAnswer(
      `<div class="meta">匹配 · ${item.category} · 相关度 ${score}</div>
       <strong>${item.question}</strong>
       <div style="margin-top:0.55rem">${item.answer}</div>`
    );

    activeCategory = "全部";
    searchInput.value = query;
    renderFilters();
    renderFaq();
  }

  askBtn.addEventListener("click", handleAsk);
  questionInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleAsk();
    }
  });
  searchInput.addEventListener("input", renderFaq);

  renderFilters();
  renderFaq();
})();
