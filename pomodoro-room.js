// pomodoro-room.js
document.addEventListener('DOMContentLoaded', () => {
  let pomoInterval;
  let isRunning = false;
  let isFocus = true;
  let timeLeft = 25 * 60;
  
  const audioLofi = new Audio('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'); 
  audioLofi.loop = true;
  audioLofi.volume = 0.5;

  const btnStart = document.getElementById('btnPomoStart');
  const btnPause = document.getElementById('btnPomoPause');
  const btnReset = document.getElementById('btnPomoReset');
  const timeDisplay = document.getElementById('pomoTime');
  const statusDisplay = document.getElementById('pomoStatus');
  const lofiSwitch = document.getElementById('lofiSwitch');
  const inputFocusTime = document.getElementById('inputFocusTime');
  const inputBreakTime = document.getElementById('inputBreakTime');

  function updateDisplay() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    btnStart.style.display = 'none';
    btnPause.style.display = 'inline-block';
    
    if (lofiSwitch && lofiSwitch.checked) {
      audioLofi.play().catch(e => console.log('Audio play failed:', e));
    }

    pomoInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(pomoInterval);
        isRunning = false;
        isFocus = !isFocus;
        timeLeft = (isFocus ? parseInt(inputFocusTime.value) : parseInt(inputBreakTime.value)) * 60;
        statusDisplay.textContent = isFocus ? "TẬP TRUNG (FOCUS)" : "NGHỈ NGƠI (BREAK)";
        statusDisplay.style.color = isFocus ? "var(--accent-orange)" : "var(--primary)";
        btnStart.style.display = 'inline-block';
        btnPause.style.display = 'none';
        updateDisplay();
        
        // Play notification sound if main sound is on
        const soundSwitch = document.getElementById('soundSwitch');
        if (soundSwitch && soundSwitch.checked) {
          const beep = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3');
          beep.play().catch(e=>{});
        }

        alert(isFocus ? "Hết giờ nghỉ! Quay lại học thôi!" : "Hết giờ học! Tới giờ nghỉ ngơi nào!");
      } else {
        updateDisplay();
      }
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(pomoInterval);
    isRunning = false;
    btnStart.style.display = 'inline-block';
    btnPause.style.display = 'none';
    audioLofi.pause();
  }

  function resetTimer() {
    pauseTimer();
    isFocus = true;
    timeLeft = parseInt(inputFocusTime.value) * 60 || 25 * 60;
    statusDisplay.textContent = "TẬP TRUNG (FOCUS)";
    statusDisplay.style.color = "var(--accent-orange)";
    updateDisplay();
  }

  if(btnStart) btnStart.addEventListener('click', startTimer);
  if(btnPause) btnPause.addEventListener('click', pauseTimer);
  if(btnReset) btnReset.addEventListener('click', resetTimer);
  
  if(lofiSwitch) {
    lofiSwitch.addEventListener('change', (e) => {
      if (e.target.checked && isRunning) {
        audioLofi.play().catch(e=>{});
      } else {
        audioLofi.pause();
      }
    });
  }

  if(inputFocusTime) {
    inputFocusTime.addEventListener('change', () => {
      if (!isRunning && isFocus) resetTimer();
    });
  }
  
  // Initial update
  if(timeDisplay) updateDisplay();
});
