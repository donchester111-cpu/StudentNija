import { openToolModal } from './modal.js';

let secretNumber = Math.floor(Math.random() * 100) + 1;
let guessAttempts = 0;

export function openGuessNumber() {
  secretNumber = Math.floor(Math.random() * 100) + 1;
  guessAttempts = 0;
  openToolModal('Guess the Number', `
    <div class="guess-game">
      <p>I'm thinking of a number between 1 and 100.</p>
      <input type="number" id="guessInput" class="guess-input" min="1" max="100">
      <button id="guessBtn" class="btn-primary">Guess</button>
      <div id="guessMessage" class="guess-message"></div>
    </div>
  `);
  const guessBtn = document.getElementById('guessBtn');
  if (guessBtn) {
    guessBtn.onclick = () => {
      const guess = parseInt(document.getElementById('guessInput').value);
      const msgDiv = document.getElementById('guessMessage');
      if (isNaN(guess)) { if (msgDiv) msgDiv.innerHTML = 'Enter a number!'; return; }
      guessAttempts++;
      if (guess === secretNumber) {
        if (msgDiv) msgDiv.innerHTML = `🎉 Correct! It took you ${guessAttempts} attempts. New number generated!`;
        secretNumber = Math.floor(Math.random() * 100) + 1;
        guessAttempts = 0;
      } else if (guess < secretNumber) { if (msgDiv) msgDiv.innerHTML = 'Too low! Try again.'; }
      else { if (msgDiv) msgDiv.innerHTML = 'Too high! Try again.'; }
      document.getElementById('guessInput').value = '';
    };
  }
}
