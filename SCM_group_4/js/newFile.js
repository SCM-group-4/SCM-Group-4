/* ---------- Events & init ---------- */
document.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-action]');
  if (btn) perfoui.keypad.addrm(btn.dataset.action, btn.dataset.value ?? btn.dataset.fn);
});
