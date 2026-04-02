document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('start-survey');

  if (startButton) {
    startButton.addEventListener('click', () => {
      alert('Survey started!');
    });
  }
});