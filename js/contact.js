/* Rascunho por aba e POST nativo; a confirmação pertence ao Google Forms. */
(() => {
  "use strict";

  const form = document.getElementById("contact-form");
  if (!form) return;

  const storageKey = "conicas.contact.draft.v1";
  const draftLifetime = 24 * 60 * 60 * 1000;
  const name = document.getElementById("contact-name");
  const email = document.getElementById("contact-email");
  const message = document.getElementById("contact-message");
  const consent = document.getElementById("contact-consent");
  const submit = document.getElementById("contact-submit");
  const draftStatus = document.getElementById("contact-draft-status");
  const submitStatus = document.getElementById("contact-submit-status");
  let pending = false;
  let cooldown;

  function fields() {
    return { name: name.value, email: email.value, message: message.value, consent: consent.checked };
  }

  function isEmpty(draft) {
    return !draft.name && !draft.email && !draft.message && !draft.consent;
  }

  function saveDraft(announce = true) {
    const draft = fields();
    try {
      if (isEmpty(draft)) {
        sessionStorage.removeItem(storageKey);
        if (announce) draftStatus.textContent = "";
      } else {
        sessionStorage.setItem(storageKey, JSON.stringify({ version: 1, updatedAt: Date.now(), fields: draft }));
        if (announce) draftStatus.textContent = "Rascunho salvo nesta aba.";
      }
      return true;
    } catch {
      if (announce) draftStatus.textContent = "Não foi possível salvar o rascunho nesta aba. Você ainda pode enviar sua mensagem.";
      return false;
    }
  }

  function restoreDraft() {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (!saved) return;
      const draft = JSON.parse(saved);
      const values = draft?.fields;
      const age = Date.now() - draft?.updatedAt;
      const valid = draft?.version === 1 && Number.isFinite(age) && age >= 0 && age < draftLifetime &&
        values && typeof values.name === "string" && typeof values.email === "string" &&
        typeof values.message === "string" && typeof values.consent === "boolean";
      if (!valid) {
        sessionStorage.removeItem(storageKey);
        return;
      }
      name.value = values.name;
      email.value = values.email;
      message.value = values.message;
      consent.checked = values.consent;
      if (!isEmpty(values)) draftStatus.textContent = "Seu preenchimento anterior foi recuperado.";
    } catch {
      // Um rascunho inválido ou armazenamento indisponível não bloqueia o envio.
      try { sessionStorage.removeItem(storageKey); } catch { /* Sem armazenamento. */ }
    }
  }

  function releaseSubmit() {
    clearTimeout(cooldown);
    pending = false;
    submit.disabled = false;
    form.removeAttribute("aria-busy");
  }

  restoreDraft();
  form.addEventListener("input", () => saveDraft());
  form.addEventListener("change", () => saveDraft());

  form.addEventListener("submit", event => {
    if (pending) {
      event.preventDefault();
      return;
    }

    // Inclua a normalização também na validação, sem aceitar apenas espaços.
    name.value = name.value.trim();
    email.value = email.value.trim();
    message.value = message.value.trim();
    saveDraft();
    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }
    if (navigator.onLine === false) {
      event.preventDefault();
      submitStatus.textContent = "Você está sem conexão. Quando a conexão voltar, clique em Enviar mensagem novamente.";
      return;
    }

    // O navegador envia o formulário diretamente. Sem fetch opaco, iframe
    // oculto, reenvio automático ou mensagem de sucesso não confirmada.
    pending = true;
    submit.disabled = true;
    form.setAttribute("aria-busy", "true");
    submitStatus.textContent = "Confira a confirmação do Google Forms na nova aba. Seu preenchimento permanece aqui até você limpar o rascunho.";
    cooldown = setTimeout(releaseSubmit, 2000);
  });

  form.addEventListener("reset", () => {
    releaseSubmit();
    try { sessionStorage.removeItem(storageKey); } catch { /* Limpa os campos mesmo sem armazenamento. */ }
    // Reset nativo aplica os valores depois do evento; não salve antes disso.
    draftStatus.textContent = "Rascunho limpo.";
    submitStatus.textContent = "";
  });

  window.addEventListener("pagehide", () => saveDraft(false));
  window.addEventListener("pageshow", () => releaseSubmit());
})();
