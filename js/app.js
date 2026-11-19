/* Conteúdo, filtros, navegação acessível e interações. Sem bibliotecas. */
(() => {
  "use strict";

  const data = window.PORTFOLIO_CONTENT;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const readPreference = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const savePreference = (key, value) => { try { localStorage.setItem(key, value); } catch { /* O site funciona sem armazenamento local. */ } };
  const externalLink = (url, text, className = "text-link") => `<a class="${className}" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(text)}</a>`;

  $("#ano").textContent = new Date().getFullYear();

  // A identidade é preta, branca e vermelha em ambos os temas.
  const themeButton = $("#toggle-theme");
  const storedTheme = readPreference("themeChoice");
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeButton.setAttribute("aria-pressed", String(theme === "dark"));
    savePreference("themeChoice", theme);
    document.dispatchEvent(new CustomEvent("portfolio:theme", { detail: theme }));
  }
  applyTheme(storedTheme === "light" ? "light" : "dark");
  themeButton.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
  $("#drawer-theme").addEventListener("click", () => themeButton.click());

  // Preferências de movimento também são respeitadas pelo CSS e pelo canvas.
  const motionButton = $("#toggle-motion");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let manuallyPaused = readPreference("motionPaused") === "true";
  function applyMotion() {
    const paused = manuallyPaused || reducedMotion.matches;
    document.documentElement.dataset.motion = paused ? "paused" : "running";
    motionButton.setAttribute("aria-pressed", String(paused));
    motionButton.disabled = reducedMotion.matches;
    const label = reducedMotion.matches ? "Animações reduzidas pela preferência do sistema" : paused ? "Retomar animações" : "Pausar animações";
    motionButton.setAttribute("aria-label", label);
    motionButton.title = label;
    document.dispatchEvent(new CustomEvent("portfolio:motion", { detail: { paused } }));
  }
  motionButton.addEventListener("click", () => {
    manuallyPaused = !manuallyPaused;
    savePreference("motionPaused", String(manuallyPaused));
    applyMotion();
  });
  reducedMotion.addEventListener("change", applyMotion);
  applyMotion();

  // Gaveta: overlay real, foco contido, Escape e retorno ao botão de abertura.
  const menuButton = $("#btn-menu");
  const drawer = $("#drawer-nav");
  const overlay = $("#overlay");
  const main = $("main");
  const footer = $("footer");
  function closeMenu(returnFocus = true) {
    if (!document.body.classList.contains("menu-open")) return;
    document.body.classList.remove("menu-open");
    drawer.inert = true;
    drawer.setAttribute("aria-hidden", "true");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menu");
    overlay.hidden = true;
    main.inert = false;
    footer.inert = false;
    if (returnFocus) menuButton.focus({ preventScroll: true });
  }
  function openMenu() {
    document.body.classList.add("menu-open");
    drawer.inert = false;
    drawer.setAttribute("aria-hidden", "false");
    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "Fechar menu");
    overlay.hidden = false;
    main.inert = true;
    footer.inert = true;
    requestAnimationFrame(() => {
      if (document.body.classList.contains("menu-open")) $("a", drawer).focus({ preventScroll: true });
    });
  }
  menuButton.addEventListener("click", () => document.body.classList.contains("menu-open") ? closeMenu() : openMenu());
  overlay.addEventListener("click", () => closeMenu());
  drawer.addEventListener("click", event => { if (event.target.closest("a[href^='#']")) closeMenu(false); });
  document.addEventListener("keydown", event => {
    if (!document.body.classList.contains("menu-open")) return;
    if (event.key === "Escape") { event.preventDefault(); closeMenu(); }
    if (event.key === "Tab") {
      const focusable = [menuButton, ...$$("a, button:not(:disabled)", drawer)];
      const current = focusable.indexOf(document.activeElement);
      const next = event.shiftKey ? (current - 1 + focusable.length) % focusable.length : (current + 1) % focusable.length;
      event.preventDefault();
      focusable[next].focus();
    }
  });
  matchMedia("(min-width: 1280px)").addEventListener("change", event => { if (event.matches) closeMenu(false); });

  // Cada camada tem um papel: entrada, flutuação e resposta ao mouse.
  function card(body, className = "", attributes = "") {
    return `<article class="card reveal ${className}" data-motion ${attributes}><div class="card-float"><div class="card-surface">${body}</div></div></article>`;
  }

  // Os objetos em content.js preservam todos os campos dos JSON originais.
  if (!data) return;
  const profile = data.profile;
  const socialIcons = {
    linkedin: '<svg class="social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M5.37 3a2.37 2.37 0 1 0 0 4.74 2.37 2.37 0 0 0 0-4.74ZM3.4 9h3.94v12H3.4V9Zm6.41 0h3.78v1.64h.05a4.14 4.14 0 0 1 3.72-1.95c3.98 0 4.72 2.62 4.72 6.03V21h-3.94v-5.56c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94V21h-3.94V9Z"/></svg>',
    instagram: '<svg class="social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    github: '<svg class="social-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 0 1 8 3.86c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>'
  };
  $("#hero-links").innerHTML = [["linkedin", "LinkedIn"], ["instagram", "Instagram"], ["github", "GitHub"]]
    .filter(([key]) => profile[key])
    .map(([key, title]) => `<li><a class="social-link" href="${escapeHTML(profile[key])}" target="_blank" rel="noopener noreferrer">${socialIcons[key]}<span>${escapeHTML(title)}</span></a></li>`).join("");
  $$("[data-social]").forEach(link => {
    const icon = socialIcons[link.dataset.social];
    if (icon && !$(".social-icon", link)) link.innerHTML = `${icon}<span>${escapeHTML(link.textContent)}</span>`;
  });
  if (profile.email) $("#btn-email").dataset.email = profile.email;

  const educationBlocks = [
    ["Mestrado em Engenharia Elétrica e Computação", "mestrado"],
    ["Especialização em Engenharia de Software", "esp_software"],
    ["Especialização em Docência em Ciência e TI", "esp_docencia"],
    ["Graduação em Ciência da Computação", "cc"],
    ["Licenciatura em Matemática", "lic"],
    ["Bacharelado em Matemática Aplicada e Computacional", "mac"],
    ["Formação complementar", "complementar"]
  ];
  $("#grid-formacao").innerHTML = educationBlocks.map(([title, key]) => card(`<h3>${escapeHTML(title)}</h3><ul class="education-list">${(data.formacao[key] || []).map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`, "education-card")).join("");

  const projectIcons = [
    '<path d="M4 18V9m5 9V5m5 13v-7m5 7V3"/>',
    '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
    '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16"/>',
    '<path d="m8 5-6 7 6 7m8-14 6 7-6 7M14 3l-4 18"/>'
  ];
  const projectGrid = $("#grid-projetos");
  const search = $("#q");
  let activeCategory = "todos";
  function renderProjects() {
    const query = search.value.trim().toLocaleLowerCase("pt-BR");
    // O índice é sempre o da lista original, mesmo após busca e filtros.
    const projects = data.projetos.map((project, index) => ({ ...project, index }))
      .filter(project => (activeCategory === "todos" || project.categoria.includes(activeCategory)) && project.titulo.toLocaleLowerCase("pt-BR").includes(query));
    projectGrid.innerHTML = projects.map(project => card(`
      <span class="project-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${projectIcons[project.index % projectIcons.length]}</svg></span>
      <h3>${escapeHTML(project.titulo)}</h3>
      <p>${escapeHTML(project.desc)}</p>
      <div class="project-card-footer"><div class="project-categories">${escapeHTML(project.categoria.join(" | "))}</div><button class="project-open" type="button" data-project="${project.index}" aria-label="Abrir ${escapeHTML(project.titulo)}">Abrir <span aria-hidden="true">+</span></button></div>
    `, "project-card")).join("");
    $("#project-empty").hidden = projects.length !== 0;
    $("#project-status").textContent = `${projects.length} ${projects.length === 1 ? "projeto encontrado" : "projetos encontrados"}.`;
    document.dispatchEvent(new CustomEvent("portfolio:render", { detail: { root: projectGrid } }));
  }
  $$(".chip").forEach(button => button.addEventListener("click", () => {
    activeCategory = button.dataset.cat;
    $$(".chip").forEach(chip => {
      const active = chip === button;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
    renderProjects();
  }));
  search.addEventListener("input", renderProjects);
  renderProjects();

  $("#lista-orientacoes").innerHTML = (data.extra.orientacoes || []).map(item => card(`<h3>${escapeHTML(item.titulo)}</h3><div class="card-meta"><span>${escapeHTML(item.nivel)} ${escapeHTML(item.ano)}</span>${item.status ? `<span aria-hidden="true">·</span><span class="meta-status">${escapeHTML(item.status)}</span>` : ""}</div><p>${escapeHTML(item.resumo || "")}</p>`)).join("");
  $("#lista-eventos").innerHTML = (data.extra.eventos || []).map(item => card(`<span class="card-year">${escapeHTML(item.ano)}</span><h3>${escapeHTML(item.titulo)}</h3><div class="card-meta">${escapeHTML(item.papel)} · ${escapeHTML(item.local || "")}</div>${item.tema ? `<p>${escapeHTML(item.tema)}</p>` : ""}${item.slides ? `<div class="event-slides">${externalLink(item.slides, "slides")}</div>` : ""}`, "event-card")).join("");
  $("#lista-bancas").innerHTML = (data.extra.bancas || []).map(item => card(`<h3>${escapeHTML(item.titulo)}</h3><div class="card-meta">${escapeHTML(item.autor)} · ${escapeHTML(item.curso)} · ${escapeHTML(item.ano)}</div>`)).join("");
  $("#lista-pubs").innerHTML = data.publicacoes.map(item => `<li class="publication reveal"><div><h3>${escapeHTML(item.titulo)}</h3><p><em>${escapeHTML(item.veiculo)}</em></p></div>${externalLink(item.link, "acessar", "publication-link")}</li>`).join("");

  // Janela nativa: foco e Escape são tratados pelo próprio navegador.
  const dialog = $("#dlg-projeto");
  let chartValues = [];
  function drawChart() {
    const canvas = $("#chart");
    const context = canvas.getContext("2d");
    if (!context) return;
    const style = getComputedStyle(dialog);
    const pad = 30;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = style.getPropertyValue("--line").trim();
    context.lineWidth = 1;
    for (let row = 0; row < 4; row += 1) {
      const y = pad + row * (canvas.height - pad * 2) / 3;
      context.beginPath(); context.moveTo(pad, y); context.lineTo(canvas.width - pad, y); context.stroke();
    }
    context.strokeStyle = style.getPropertyValue("--accent").trim();
    context.lineWidth = 3;
    context.beginPath();
    chartValues.forEach((value, index) => {
      const x = pad + index * (canvas.width - pad * 2) / (chartValues.length - 1);
      const y = canvas.height - pad - value / 100 * (canvas.height - pad * 2);
      if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
    });
    context.stroke();
  }
  projectGrid.addEventListener("click", event => {
    const button = event.target.closest("[data-project]");
    if (!button) return;
    const project = data.projetos[Number(button.dataset.project)];
    if (!project) return;
    $("#dialog-title").textContent = project.titulo;
    $("#dialog-description").textContent = project.desc;
    $(".dialog-links", dialog).innerHTML = project.links.map(link => `<li>${externalLink(link.url, link.nome)}</li>`).join("");
    chartValues = Array.from({ length: 12 }, (_, index) => 40 + Math.sin(index * .5) * 20 + Math.random() * 8);
    document.body.classList.add("dialog-open");
    dialog.showModal();
    drawChart();
  });
  $(".dialog-close", dialog).addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => document.body.classList.remove("dialog-open"));
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  document.addEventListener("portfolio:theme", () => { if (dialog.open) drawChart(); });

  const copyButton = $("#btn-email");
  let copyTimeout;
  copyButton.addEventListener("click", async () => {
    const email = copyButton.dataset.email;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard-unavailable");
      await navigator.clipboard.writeText(email);
      copyButton.textContent = "email copiado";
      $("#email-status").textContent = "Email copiado.";
      clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => { copyButton.textContent = "copiar email"; }, 1800);
    } catch {
      copyButton.textContent = email;
      $("#email-status").textContent = `Email para contato: ${email}`;
    }
  });
})();
