//script.js
const gameState = {
  currentScreen: "start",
  playerName: "",
  clickCount: 0,
  timeLeft: 60,
  timer: null,
  cleanerTriggered: false,
  gameStarted: false,
  targetClicks: 200,
  isPaused: false // 新增：用于跟踪游戏是否暂停
};

const screens = {
  start: document.getElementById("start-screen"),
  name: document.getElementById("name-screen"),
  running: document.getElementById("running-screen"),
  toilet: document.getElementById("toilet-screen"),
  click: document.getElementById("click-screen"),
  end: document.getElementById("end-screen"),
};

const startBtn = document.querySelector(".start-btn");
const nameInput = document.querySelector(".name-input");
const enterBtn = document.querySelector(".enter-btn");
const nextToiletBtn = document.querySelector(".next-toilet-btn");
const pushBtn = document.querySelector(".push-btn");
const timeLeftEl = document.getElementById("time-left");
const clickCountEl = document.getElementById("click-count");
const cleanerPopup = document.getElementById("cleaner-popup");
const payBtn = document.querySelector(".pay-btn");
const declineBtn = document.querySelector(".decline-btn");
const playAgainBtn = document.querySelector(".play-again-btn");
const randomNameEl = document.getElementById("random-name");
const resultImageEl = document.getElementById("result-image");
const endMessageEl = document.querySelector(".end-message");

// 🎵 音效
const bgMusic = document.getElementById("bg-music");
const clickSound = document.getElementById("click-sound");
const cleanerSound = document.getElementById("cleaner-sound");
const successSound = document.getElementById("success-sound");
const failSound = document.getElementById("fail-sound");
const runningSound = document.getElementById("running-sound");
const vomitSound = document.getElementById("vomit-sound");
const flushSound = document.getElementById("flush-sound");

// 随机名字与图片
const randomNames = [
  "Xiao Ming",
  "Xiao Hong",
  "Xiao Gang",
  "Xiao Li",
  "Ah Qiang",
  "Ah Zhen",
  "Da Xiong",
  "Jing Xiang",
];
const imagePaths = {
  constipated: "images/constipated.png",
  disaster: "images/disaster.png",
  success: "images/success.png",
  cleanerPhoto: "images/cleaner-photo.png",
};

// 添加按钮移动相关的变量
let buttonMoveTimer = null;
const buttonMoveInterval = 2000; // 每2秒移动一次按钮

// 音效控制
function stopAllAudio() {
  [
    bgMusic,
    clickSound,
    cleanerSound,
    successSound,
    failSound,
    runningSound,
    vomitSound,
    flushSound,
  ].forEach((a) => {
    try {
      a.pause();
      a.currentTime = 0;
    } catch (e) {}
  });
}

function playBGM() {
  stopAllAudio();
  bgMusic.volume = 0.3;
  bgMusic.loop = true;
  bgMusic.play().catch(() => {});
}

function playRunningSound() {
  stopAllAudio();
  runningSound.volume = 1;
  runningSound.play();
}

function playCleanerSound() {
  stopAllAudio();
  cleanerSound.volume = 1;
  cleanerSound.play();
}

function playClickSound() {
  try {
    clickSound.pause();
    clickSound.currentTime = 0;
    clickSound.volume = 1;
    clickSound.play();
  } catch (e) {}
}

function playSuccessSound() {
  stopAllAudio();
  successSound.volume = 1;
  successSound.play();
}

function playFailSound() {
  stopAllAudio();
  failSound.volume = 1;
  failSound.play();
}

// 💩 粪便动画
function createPoopRain() {
  const container = document.getElementById("poop-rain");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < 300; i++) {
    const poop = document.createElement("div");
    poop.classList.add("poop");
    poop.textContent = "💩";
    poop.style.left = Math.random() * 100 + "vw";
    poop.style.animationDuration = 3 + Math.random() * 4 + "s";
    poop.style.animationDelay = Math.random() * 2 + "s";
    poop.style.fontSize = 1.5 + Math.random() * 2 + "rem";
    container.appendChild(poop);
    setTimeout(() => poop.remove(), 7000);
  }
}

window.addEventListener("load", createPoopRain);

// 🧱 画面切换
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
  gameState.currentScreen = name;
  if (name === "start" && !gameState.gameStarted) {
    playBGM();
    gameState.gameStarted = true;
  }
}

function showRunningScene() {
  showScreen("running");
  playRunningSound();
  setTimeout(() => {
    showToiletScene();
  }, 3000);
}

// 🚽 Gift 阶段：播放 flush + vomit
function showToiletScene() {
  const randomName =
    randomNames[Math.floor(Math.random() * randomNames.length)];
  randomNameEl.textContent = randomName;
  stopAllAudio();
  flushSound.volume = 0.6;
  vomitSound.volume = 0.5;
  try {
    flushSound.play();
  } catch (e) {}
  setTimeout(() => {
    try {
      vomitSound.play();
    } catch (e) {}
  }, 800);
  setTimeout(() => {
    playBGM();
    createPoopRain();
  }, 2500);
  showScreen("toilet");
}

// 💩 粪便进度条元素
const poopProgressBar = document.getElementById("poop-progress");

// 暂停计时器
function pauseTimer() {
  clearInterval(gameState.timer);
  clearInterval(buttonMoveTimer);
  gameState.isPaused = true;
}

// 恢复计时器
function resumeTimer() {
  if (gameState.isPaused) {
    gameState.timer = setInterval(() => {
      gameState.timeLeft--;
      timeLeftEl.textContent = gameState.timeLeft;

      // 只在时间结束时判断结局
      if (gameState.timeLeft <= 0) {
        endClickGame();
      }
    }, 1000);

    startButtonMoving();
    gameState.isPaused = false;
  }
}

// 💥 点击阶段 - 修改为60秒和200次点击目标
function startClickGame() {
  showScreen("click");
  playBGM();
  gameState.clickCount = 0;
  gameState.timeLeft = 60;
  gameState.cleanerTriggered = false;
  gameState.isPaused = false;
  clickCountEl.textContent = gameState.clickCount;
  timeLeftEl.textContent = gameState.timeLeft;

  updatePoopProgress();
  resetButtonPosition();

  gameState.timer = setInterval(() => {
    gameState.timeLeft--;
    timeLeftEl.textContent = gameState.timeLeft;

    // 清洁工事件触发条件 - 随时可能触发，概率50%
    if (!gameState.cleanerTriggered && Math.random() < 0.5) {
      triggerCleanerEvent();
    }
    
    // 只在时间结束时判断结局
    if (gameState.timeLeft <= 0) {
      endClickGame();
    }
  }, 1000);

  startButtonMoving();
}

function startButtonMoving() {
  buttonMoveTimer = setInterval(() => {
    moveButtonRandomly();
  }, buttonMoveInterval);
}

// 随机移动按钮
function moveButtonRandomly() {
  const button = document.querySelector(".push-btn");
  if (!button) return;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const buttonRect = button.getBoundingClientRect();
  const buttonWidth = buttonRect.width;
  const buttonHeight = buttonRect.height;
  const minX = buttonWidth / 2;
  const maxX = screenWidth - buttonWidth / 2;
  const minY = screenHeight * 0.4;
  const maxY = screenHeight * 0.8 - buttonHeight;
  const randomX = Math.random() * (maxX - minX) + minX;
  const randomY = Math.random() * (maxY - minY) + minY;
  button.classList.add("moving");
  button.style.left = randomX + "px";
  button.style.transform = "translateX(-50%)";
  setTimeout(() => {
    button.classList.remove("moving");
  }, 500);
}

// 重置按钮位置到中间
function resetButtonPosition() {
  const button = document.querySelector(".push-btn");
  if (button) {
    button.style.left = "50%";
    button.style.transform = "translateX(-50%)";
  }
}

// ✅ 结局判断 - 只在时间结束时判断
function endClickGame() {
  clearInterval(gameState.timer);
  clearInterval(buttonMoveTimer);

  if (gameState.clickCount < gameState.targetClicks) {
    showResult(imagePaths.constipated, "💩 Constipated - You failed!");
    playFailSound();
    showScreen("end");
    return;
  }
  
  if (gameState.clickCount > gameState.targetClicks) {
    showResult(imagePaths.disaster, "💥 Too much... oh no.");
    playFailSound();
    showScreen("end");
    return;
  }
  
  // 正好200次点击的情况
  showResult(imagePaths.success, "✅ Success! You did it!");
  playSuccessSound();
  showScreen("end");

  setTimeout(() => {
    // 移除图片，显示大号屎emoji
    resultImageEl.innerHTML = "";
    const poopEmoji = document.createElement("div");
    poopEmoji.classList.add("poop-emoji");
    poopEmoji.textContent = "💩";
    resultImageEl.appendChild(poopEmoji);
    
    // 更新文字
    endMessageEl.textContent = "🚽 But! You are a SHIT man now. No tissue. No water.";
    playFailSound();
  }, 1000);
}

function updatePoopProgress() {
  const poopProgressBar = document.getElementById("poop-progress");
  if (poopProgressBar) {
    const progress = (gameState.clickCount / gameState.targetClicks) * 100;
    poopProgressBar.style.width = Math.min(progress, 100) + "%";
    if (progress < 33) {
      poopProgressBar.style.background =
        "linear-gradient(90deg, #8B4513, #A0522D)";
    } else if (progress < 66) {
      poopProgressBar.style.background =
        "linear-gradient(90deg, #A0522D, #CD853F)";
    } else {
      poopProgressBar.style.background =
        "linear-gradient(90deg, #CD853F, #D2691E)";
      poopProgressBar.style.animation = "poopPulse 0.5s infinite alternate";
    }
  }
}

// 添加CSS样式
const style = document.createElement("style");
style.textContent = `
  @keyframes poopPulse {
    0% { opacity: 0.8; filter: brightness(1); }
    100% { opacity: 1; filter: brightness(1.3); }
  }
  
  /* 结束屏幕样式修复 */
  #end-screen {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background-color: #1a1a2e;
    padding: 20px;
    z-index: 100;
    overflow: auto;
  }
  
  .end-message {
    font-size: 2rem;
    font-weight: bold;
    color: #fff;
    margin-bottom: 30px;
    text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    max-width: 80%;
    line-height: 1.4;
  }
  
  .result-image {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 30px;
    max-height: 40vh;
    flex-shrink: 0;
  }
  
  .result-image img {
    max-width: 80%;
    max-height: 40vh;
    object-fit: contain;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  }
  
  /* 针对便秘结局的特殊样式 */
  .result-image img[src="images/constipated.png"] {
    max-width: 60%;
    max-height: 30vh;
  }
  
  /* 大号屎emoji样式 */
  .poop-emoji {
    font-size: 20rem;
    animation: poopBounce 1s infinite alternate;
    filter: drop-shadow(0 0 10px rgba(139, 69, 19, 0.7));
  }
  
  @keyframes poopBounce {
    0% { transform: scale(1) translateY(0); }
    100% { transform: scale(1.1) translateY(-10px); }
  }
  
  .play-again-btn {
    padding: 15px 40px;
    font-size: 1.5rem;
    background-color: #4cc9f0;
    border: none;
    border-radius: 50px;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(76, 201, 240, 0.4);
    z-index: 101;
    position: relative;
    margin-top: 20px;
    flex-shrink: 0;
  }
  
  .play-again-btn:hover {
    background-color: #3ab0d5;
    transform: scale(1.05);
  }
  
  /* 清洁工弹窗样式修复 */
  .cleaner-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    padding: 30px;
    border-radius: 15px;
    text-align: center;
    z-index: 1000;
    border: 3px solid #e94560;
    box-shadow: 0 0 30px rgba(233, 69, 96, 0.5);
    min-width: 300px;
  }
  
  .cleaner-popup h3 {
    color: #e94560;
    margin-bottom: 15px;
    font-size: 1.8rem;
  }
  
  .cleaner-popup p {
    margin-bottom: 20px;
    font-size: 1.2rem;
    line-height: 1.4;
  }
  
  .cleaner-options {
    display: flex;
    justify-content: center;
    gap: 20px;
  }
  
  .cleaner-btn {
    padding: 10px 20px;
    font-size: 1.1rem;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .pay-btn {
    background-color: #4cc9f0;
    color: white;
  }
  
  .pay-btn:hover {
    background-color: #3ab0d5;
  }
  
  .decline-btn {
    background-color: #e94560;
    color: white;
  }
  
  .decline-btn:hover {
    background-color: #ff6b81;
  }
`;
document.head.appendChild(style);

// 修改pushBtn点击事件处理
pushBtn.addEventListener("click", () => {
  gameState.clickCount++;
  clickCountEl.textContent = gameState.clickCount;
  updatePoopProgress();
  playClickSound();
});

// 🧹 清洁工事件 - 修改后的逻辑
function triggerCleanerEvent() {
  gameState.cleanerTriggered = true;
  
  // 暂停计时器
  pauseTimer();
  
  // 显示清洁工弹窗
  cleanerPopup.classList.remove("hidden");
}

// 支付按钮事件
payBtn.addEventListener("click", () => {
  cleanerPopup.classList.add("hidden");
  // 恢复计时器
  resumeTimer();
  playBGM();
});

// 拒绝支付按钮事件
declineBtn.addEventListener("click", () => {
  // 播放清洁工音效
  playCleanerSound();
  
  // 更新弹窗内容
  const cleanerTitle = cleanerPopup.querySelector('h3');
  const cleanerText = cleanerPopup.querySelector('p');
  const cleanerOptions = cleanerPopup.querySelector('.cleaner-options');
  
  cleanerTitle.textContent = "WUHOOO!!";
  cleanerText.textContent = "Cleaner takes a photo!";
  cleanerOptions.style.display = 'none';
  
  // 延迟2秒后关闭弹窗并恢复游戏
  setTimeout(() => {
    cleanerPopup.classList.add("hidden");
    // 恢复弹窗原始内容
    cleanerTitle.textContent = "Cleaner Event";
    cleanerText.textContent = "You forgot to lock the door. Pay RM1 to make him leave?";
    cleanerOptions.style.display = 'flex';
    
    // 恢复计时器
    resumeTimer();
  }, 2000);
});

function showResult(path, alt) {
  resultImageEl.innerHTML = "";
  const img = document.createElement("img");
  img.src = path;
  img.alt = alt;
  resultImageEl.appendChild(img);
  
  // 更新结束消息
  endMessageEl.textContent = alt;
}

// 🎮 按钮事件
startBtn.addEventListener("click", () => {
  showScreen("name");
});

enterBtn.addEventListener("click", () => {
  if (nameInput.value.trim()) {
    gameState.playerName = nameInput.value.trim();
    showRunningScene();
  } else {
    alert("Please enter your name!");
  }
});

nameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    enterBtn.click();
  }
});

nextToiletBtn.addEventListener("click", () => {
  startClickGame();
});

// Play Again 按钮逻辑
playAgainBtn.addEventListener("click", () => {
  stopAllAudio();
  gameState.clickCount = 0;
  gameState.timeLeft = 60;
  gameState.cleanerTriggered = false;
  gameState.isPaused = false;
  clearInterval(gameState.timer);
  clearInterval(buttonMoveTimer);
  
  showScreen("click");
  startClickGame();
});

// 🚀 初始化
function initGame() {
  showScreen("start");
  playBGM();
}

window.addEventListener("DOMContentLoaded", initGame);