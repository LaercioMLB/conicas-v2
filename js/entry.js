/* Mantém o endereço de entrada simples e preserva os links de seção. */
window.location.replace(new URL(`html/index.html${window.location.search}${window.location.hash}`, window.location.href).href);
