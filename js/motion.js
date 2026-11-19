/* Movimento nativo: requestAnimationFrame, IntersectionObserver e canvas 2D. */
(() => {
  "use strict";

  const root = document.documentElement;
  const header = document.querySelector("#site-header");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const paused = () => root.dataset.motion === "paused" || reduced.matches;

  // A página só oculta entradas depois que o observador está disponível.
  let cardIndex = 0;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      entry.target.classList.toggle("is-offscreen", !entry.isIntersecting);
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    }
  }, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });

  function prepareElements(container = document) {
    container.querySelectorAll(".reveal:not([data-observed])").forEach(element => {
      element.dataset.observed = "true";
      const index = cardIndex++;
      element.style.setProperty("--reveal-delay", `${(index % 3) * 65}ms`);
      element.style.setProperty("--float-delay", `${-(index % 7) * .83}s`);
      element.style.setProperty("--float-duration", `${6.5 + (index % 5) * .7}s`);
      element.style.setProperty("--float-rotation", `${index % 2 ? -.22 : .22}deg`);
      observer.observe(element);
    });
  }
  prepareElements();
  root.classList.add("motion-ready");
  document.addEventListener("portfolio:render", event => {
    // Remove referências a cartões substituídos pelos filtros.
    const grid = event.detail.root;
    observedCards.forEach(card => {
      if (!card.isConnected) { observer.unobserve(card); observedCards.delete(card); }
    });
    prepareElements(grid);
    trackCards(grid);
  });

  const observedCards = new Set();
  function trackCards(container) { container.querySelectorAll(".card").forEach(card => observedCards.add(card)); }
  trackCards(document);
  let tiltFrame = 0;
  let activeSurface = null;
  let pointerPosition = null;
  document.addEventListener("pointermove", event => {
    if (!finePointer.matches || paused()) return;
    const card = event.target.closest(".card");
    const surface = card?.querySelector(".card-surface");
    if (surface !== activeSurface && activeSurface) resetTilt(activeSurface);
    activeSurface = surface;
    if (!surface) return;
    pointerPosition = { x: event.clientX, y: event.clientY };
    if (tiltFrame) return;
    tiltFrame = requestAnimationFrame(() => {
      tiltFrame = 0;
      if (!activeSurface || !pointerPosition) return;
      const rect = activeSurface.getBoundingClientRect();
      const x = (pointerPosition.x - rect.left) / rect.width;
      const y = (pointerPosition.y - rect.top) / rect.height;
      activeSurface.style.setProperty("--tilt-x", `${(0.5 - y) * 5}deg`);
      activeSurface.style.setProperty("--tilt-y", `${(x - 0.5) * 5}deg`);
      activeSurface.style.setProperty("--pointer-x", `${x * 100}%`);
      activeSurface.style.setProperty("--pointer-y", `${y * 100}%`);
    });
  }, { passive: true });
  function resetTilt(surface) {
    surface.style.setProperty("--tilt-x", "0deg");
    surface.style.setProperty("--tilt-y", "0deg");
  }
  document.addEventListener("pointerout", event => {
    if (activeSurface && !event.relatedTarget?.closest?.(".card")) { resetTilt(activeSurface); activeSurface = null; }
  });

  // Um só mecanismo de scroll. Novos cliques substituem a animação anterior.
  let scrollAnimation = 0;
  const easeInOut = value => value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
  function cancelScroll() { cancelAnimationFrame(scrollAnimation); scrollAnimation = 0; }
  function focusSection(target) {
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
      target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
    }
    target.focus({ preventScroll: true });
  }
  function scrollToSection(target, animate = true) {
    cancelScroll();
    const start = window.scrollY;
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const top = target.id === "inicio" ? 0 : target.getBoundingClientRect().top + start - header.getBoundingClientRect().height - 24;
    const end = Math.min(max, Math.max(0, top));
    if (paused() || !animate || Math.abs(end - start) < 2) {
      window.scrollTo({ top: end, behavior: "instant" });
      focusSection(target);
      return;
    }
    const duration = Math.min(1350, Math.max(650, Math.abs(end - start) * .25));
    const started = performance.now();
    function frame(time) {
      const progress = Math.min(1, (time - started) / duration);
      window.scrollTo({ top: start + (end - start) * easeInOut(progress), behavior: "instant" });
      if (progress < 1) scrollAnimation = requestAnimationFrame(frame);
      else { scrollAnimation = 0; focusSection(target); }
    }
    scrollAnimation = requestAnimationFrame(frame);
  }
  function hashTarget(hash) {
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); } catch { return null; }
  }
  document.addEventListener("click", event => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0 || anchor.target === "_blank") return;
    const hash = anchor.getAttribute("href");
    if (hash === "#") return;
    const target = hashTarget(hash);
    if (!target) return;
    event.preventDefault();
    if (location.hash !== hash) history.pushState(null, "", hash);
    scrollToSection(target);
  });
  window.addEventListener("wheel", cancelScroll, { passive: true });
  window.addEventListener("touchstart", cancelScroll, { passive: true });
  window.addEventListener("pointerdown", cancelScroll, { passive: true });
  window.addEventListener("keydown", event => { if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) cancelScroll(); });
  window.addEventListener("popstate", () => { const target = hashTarget(location.hash) || document.getElementById("inicio"); scrollToSection(target, false); });
  function alignInitialHash() {
    const target = hashTarget(location.hash);
    if (target) scrollToSection(target, false);
  }
  // As fontes locais podem mudar a altura da página; alinhe após elas carregarem.
  if (document.fonts?.ready) document.fonts.ready.then(alignInitialHash); else alignInitialHash();

  const sections = [...document.querySelectorAll("main > section[id]")];
  const navLinks = [...document.querySelectorAll(".desktop-nav a, .mobile-nav-links a")];
  const progressBar = document.querySelector("#reading-progress");
  const portrait = document.querySelector("#portrait-frame");
  const hero = document.querySelector(".hero");
  let scrollFrame = 0;
  let currentSection = "";
  function updateScroll() {
    scrollFrame = 0;
    const scrollY = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progressBar.style.transform = `scaleX(${Math.min(1, scrollY / max)})`;
    header.classList.toggle("is-scrolled", scrollY > 20);
    const marker = header.getBoundingClientRect().height + 100;
    let active = "";
    for (const section of sections) if (section.getBoundingClientRect().top <= marker) active = section.id;
    if (scrollY >= max - 4) active = sections.at(-1).id;
    if (active !== currentSection) {
      currentSection = active;
      navLinks.forEach(link => {
        if (link.hash === `#${active}`) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current");
      });
    }
    if (!paused() && finePointer.matches && scrollY < hero.offsetHeight) portrait.style.setProperty("--portrait-y", `${Math.min(scrollY * .045, 24)}px`);
  }
  function scheduleScroll() { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }
  window.addEventListener("scroll", scheduleScroll, { passive: true });
  window.addEventListener("resize", scheduleScroll, { passive: true });
  document.addEventListener("portfolio:render", scheduleScroll);
  document.addEventListener("portfolio:motion", () => { cancelScroll(); if (activeSurface) resetTilt(activeSurface); scheduleScroll(); });
  updateScroll();

  // A folha e o cachorro vêm da transparência da própria logo, sem redesenho.
  const canvas = document.querySelector("#brand-background");
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;
  const logo = new Image();
  const sprites = {};
  let width = 0;
  let height = 0;
  let backgroundFrame = 0;
  let heroVisible = true;
  let previousTime = 0;
  let elapsed = 0;
  let lastPaint = 0;
  const backgroundPointer = { x: 0, y: 0 };

  function makeSprite(sourceX, sourceWidth, color) {
    const sprite = document.createElement("canvas");
    sprite.width = sourceWidth;
    sprite.height = logo.naturalHeight;
    const ctx = sprite.getContext("2d");
    ctx.drawImage(logo, sourceX, 0, sourceWidth, logo.naturalHeight, 0, 0, sourceWidth, logo.naturalHeight);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, sprite.width, sprite.height);
    return sprite;
  }
  function updateSprites() {
    if (!logo.naturalWidth) return;
    const accent = getComputedStyle(root).getPropertyValue("--accent").trim();
    sprites.logo = makeSprite(0, logo.naturalWidth, accent);
    sprites.leaf = makeSprite(0, Math.floor(logo.naturalWidth / 2), accent);
    sprites.dog = makeSprite(Math.floor(logo.naturalWidth / 2), Math.ceil(logo.naturalWidth / 2), accent);
  }
  function resize() {
    const rect = hero.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const scale = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    paint(elapsed);
  }
  function motif(sprite, x, y, size, angle, opacity) {
    if (!sprite) return;
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.globalAlpha = opacity;
    const h = size * sprite.height / sprite.width;
    context.drawImage(sprite, -size / 2, -h / 2, size, h);
    context.restore();
  }
  function paint(seconds) {
    context.clearRect(0, 0, width, height);
    const t = paused() ? 0 : seconds;
    const driftX = backgroundPointer.x * 15;
    const driftY = backgroundPointer.y * 12;
    const size = Math.min(width * .72, 1050);
    motif(sprites.logo, width * .75 + Math.sin(t * .15) * 22 + driftX, height * .43 + Math.cos(t * .2) * 14 + driftY, size, -.12 + Math.sin(t * .12) * .035, .065);
    motif(sprites.leaf, width * .055 + Math.sin(t * .19) * 19, height * .64 + Math.cos(t * .16) * 24, Math.min(width * .17, 190), -.4 + Math.sin(t * .17) * .12, .065);
    motif(sprites.dog, width * .54 + Math.sin(t * .17) * 13, height * .86 + Math.cos(t * .22) * 15, Math.min(width * .1, 115), .17 + Math.sin(t * .13) * .07, .085);
    // Pequenas folhas soltas percorrem caminhos diferentes, sem cobrir o texto.
    for (let i = 0; i < 5; i += 1) {
      const x = width * (.12 + i * .195) + Math.sin(t * .2 + i * 1.4) * 14;
      const y = height * (.15 + (i % 3) * .28) + Math.cos(t * .25 + i) * 18;
      motif(sprites.leaf, x, y, 18 + i * 3, Math.sin(t * .2 + i) * .35 + i, .09);
    }
  }
  function loop(time) {
    backgroundFrame = 0;
    if (paused() || !heroVisible || document.hidden) { previousTime = 0; return; }
    if (previousTime) elapsed += Math.min((time - previousTime) / 1000, .1);
    previousTime = time;
    if (time - lastPaint >= 1000 / 30) { paint(elapsed); lastPaint = time; }
    backgroundFrame = requestAnimationFrame(loop);
  }
  function syncBackground() {
    cancelAnimationFrame(backgroundFrame);
    backgroundFrame = 0;
    previousTime = 0;
    paint(elapsed);
    if (!paused() && heroVisible && !document.hidden && logo.complete) backgroundFrame = requestAnimationFrame(loop);
  }
  logo.onload = () => { updateSprites(); resize(); syncBackground(); };
  logo.src = "../assets/images/logo.png";
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; syncBackground(); }, { threshold: 0 }).observe(hero);
  hero.addEventListener("pointermove", event => {
    if (!finePointer.matches || paused()) return;
    const rect = hero.getBoundingClientRect();
    backgroundPointer.x = (event.clientX - rect.left) / rect.width - .5;
    backgroundPointer.y = (event.clientY - rect.top) / rect.height - .5;
  }, { passive: true });
  document.addEventListener("visibilitychange", syncBackground);
  document.addEventListener("portfolio:motion", syncBackground);
  document.addEventListener("portfolio:theme", () => { updateSprites(); paint(elapsed); });
})();
