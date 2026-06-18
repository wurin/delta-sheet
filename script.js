const lockToggle = document.getElementById('lock-toggle');
const fields = document.querySelectorAll('input, textarea');

let locked = false;

lockToggle.addEventListener('click', () => {
  locked = !locked;
  fields.forEach((field) => {
    field.disabled = locked;
  });
  lockToggle.textContent = locked ? 'Unlock Sheet' : 'Lock Sheet';
});
