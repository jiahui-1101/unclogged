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
  isPaused: false, // 新增：用于跟踪游戏是否暂停
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
    // 显示Play Again按钮
    playAgainBtn.style.display = "block";
    return;
  }

  if (gameState.clickCount > gameState.targetClicks) {
    showResult(imagePaths.disaster, "💥 Too much... oh no.");
    playFailSound();
    showScreen("end");
    // 显示Play Again按钮
    playAgainBtn.style.display = "block";
    return;
  }

  // 正好200次点击的情况
  showResult(imagePaths.success, "✅ Success! You did it!");
  playSuccessSound();
  showScreen("end");
  // 初始隐藏Play Again按钮
  playAgainBtn.style.display = "none";

  setTimeout(() => {
    // 移除图片，显示大号屎emoji
    resultImageEl.innerHTML = "";
    const poopEmoji = document.createElement("div");
    poopEmoji.classList.add("poop-emoji");
    poopEmoji.textContent = "💩";
    resultImageEl.appendChild(poopEmoji);

    // 更新文字
    endMessageEl.textContent =
      "🚽 But! You are a SHIT man now. No tissue. No water.";
    playFailSound();

    // 在SHIT man结局显示Play Again按钮
    playAgainBtn.style.display = "block";
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

// 🧹 清洁工事件 - 美化版本
function triggerCleanerEvent() {
  gameState.cleanerTriggered = true;

  // 暂停计时器
  pauseTimer();

  // 显示清洁工弹窗
  showCleanerPopup();
}

// 显示清洁工弹窗
function showCleanerPopup() {
  const cleanerPopup = document.getElementById("cleaner-popup");
  const cleanerContent = cleanerPopup.querySelector(".cleaner-content");

  // 设置初始内容
  cleanerContent.innerHTML = `
    <div class="cleaner-header">
      <div class="cleaner-avatar">🧹</div>
      <h3>TOILET CLEANER</h3>
    </div>
    <div class="cleaner-message">
      <p>"Boss, you never lock door ah? Pay RM1 or I take photo!"</p>
    </div>
    <div class="cleaner-options">
      <button class="pay-btn cleaner-btn">
        <span class="btn-icon">💵</span>
        Pay RM1
      </button>
      <button class="decline-btn cleaner-btn">
        <span class="btn-icon">📸</span>
        Take Photo Lah!
      </button>
    </div>
  `;

  cleanerPopup.classList.remove("hidden");

  // 重新绑定事件
  const payBtn = cleanerPopup.querySelector(".pay-btn");
  const declineBtn = cleanerPopup.querySelector(".decline-btn");

  payBtn.addEventListener("click", handlePayment);
  declineBtn.addEventListener("click", handleDecline);
}

// 处理支付
function handlePayment() {
  const cleanerPopup = document.getElementById("cleaner-popup");
  const cleanerContent = cleanerPopup.querySelector(".cleaner-content");

  // 显示支付界面
  cleanerContent.innerHTML = `
    <div class="cleaner-header">
      <div class="cleaner-avatar">💳</div>
      <h3>PAYNET PAYMENT</h3>
    </div>
    <div class="payment-interface">
      <div class="payment-processing">
        <div class="spinner"></div>
        <p>Connecting to PayNet...</p>
      </div>
      <div class="payment-details">
        <div class="payment-item">
          <span>Amount:</span>
          <span>RM 1.00</span>
        </div>
        <div class="payment-item">
          <span>Service:</span>
          <span>Door Locking</span>
        </div>
        <div class="payment-item">
          <span>Location:</span>
          <span>Toilet 🚽</span>
        </div>
      </div>
    </div>
  `;

  // 模拟支付过程
  setTimeout(() => {
    paymentSuccess();
  }, 3000);
}

// 支付成功
function paymentSuccess() {
  const cleanerPopup = document.getElementById("cleaner-popup");
  const cleanerContent = cleanerPopup.querySelector(".cleaner-content");

  // 播放支付成功音效
  playSuccessSound();

  cleanerContent.innerHTML = `
    <div class="cleaner-header">
      <div class="cleaner-avatar">✅</div>
      <h3>PAYMENT SUCCESSFUL!</h3>
    </div>
    <div class="payment-success">
      <div class="success-animation">💰</div>
      <div class="cleaner-message">
        <p>"Thank you boss! Very rich ah you!"</p>
        <p class="funny-message">"I help you lock door, you enjoy your business! 😉"</p>
      </div>
      <button class="continue-btn cleaner-btn">Continue Business</button>
    </div>
  `;

  const continueBtn = cleanerPopup.querySelector(".continue-btn");
  continueBtn.addEventListener("click", () => {
    cleanerPopup.classList.add("hidden");
    resumeTimer();
    playBGM();
  });
}

// 处理拒绝支付
function handleDecline() {
  const cleanerPopup = document.getElementById("cleaner-popup");
  const cleanerContent = cleanerPopup.querySelector(".cleaner-content");

  // 播放清洁工音效
  playCleanerSound();

  // 显示拒绝后果
  cleanerContent.innerHTML = `
    <div class="cleaner-header">
      <div class="cleaner-avatar">📸</div>
      <h3>WUHOOO!! CAMERA READY!</h3>
    </div>
    <div class="camera-effect">
      <div class="flash"></div>
      <div class="camera-shutter">📸</div>
      <div class="photo-preview">
        <img src="${imagePaths.cleanerPhoto}" alt="Embarrassing Photo" class="embarrassing-photo">
        <div class="photo-stamp">FACEBOOK TRENDING</div>
      </div>
    </div>
    <div class="cleaner-message">
      <p>"CHEH! So stingy! I post your photo on Facebook!"</p>
      <p class="funny-message">"Now everyone know you never lock toilet door! 😂"</p>
    </div>
    <button class="continue-btn cleaner-btn shame-btn">Continue in Shame</button>
  `;

  const continueBtn = cleanerPopup.querySelector(".continue-btn");
  continueBtn.addEventListener("click", () => {
    cleanerPopup.classList.add("hidden");
    resumeTimer();
    playBGM();
  });
}

function showResult(path, alt) {
  resultImageEl.innerHTML = "";
  const img = document.createElement("img");
  img.src = path;
  img.alt = alt;
  resultImageEl.appendChild(img);

  // 更新结束消息
  endMessageEl.textContent = alt;
}

// 修改pushBtn点击事件处理
pushBtn.addEventListener("click", () => {
  gameState.clickCount++;
  clickCountEl.textContent = gameState.clickCount;
  updatePoopProgress();
  playClickSound();
});

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

  // 确保按钮在重新开始游戏时是显示的
  playAgainBtn.style.display = "block";

  showScreen("click");
  startClickGame();
});

// 🚀 初始化
function initGame() {
  showScreen("start");
  playBGM();
}

window.addEventListener("DOMContentLoaded", initGame);

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
  
  /* 在已有的CSS样式中添加 */
.play-again-btn {
  /* 保持现有样式 */
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
  
  /* 清洁工弹窗美化 */
  .cleaner-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    padding: 30px;
    border-radius: 20px;
    text-align: center;
    z-index: 1000;
    border: 3px solid #e94560;
    box-shadow: 0 0 50px rgba(233, 69, 96, 0.6);
    min-width: 400px;
    max-width: 500px;
    font-family: 'Arial Rounded MT Bold', sans-serif;
  }

  .cleaner-header {
    margin-bottom: 20px;
  }

  .cleaner-avatar {
    font-size: 4rem;
    margin-bottom: 10px;
    animation: bounce 2s infinite;
  }

  .cleaner-header h3 {
    color: #e94560;
    margin: 0;
    font-size: 1.8rem;
    text-shadow: 0 0 10px rgba(233, 69, 96, 0.5);
  }

  .cleaner-message {
    margin: 25px 0;
    padding: 15px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    border-left: 4px solid #4cc9f0;
  }

  .cleaner-message p {
    margin: 10px 0;
    font-size: 1.3rem;
    line-height: 1.4;
    color: #fff;
  }

  .funny-message {
    font-size: 1.1rem !important;
    color: #4cc9f0 !important;
    font-style: italic;
  }

  .cleaner-options {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 25px;
  }

  .cleaner-btn {
    padding: 12px 25px;
    font-size: 1.2rem;
    border: none;
    border-radius: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: bold;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }

  .pay-btn {
    background: linear-gradient(135deg, #4cc9f0, #3a0ca3);
    color: white;
  }

  .pay-btn:hover {
    background: linear-gradient(135deg, #3ab0d5, #2d0a82);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(76, 201, 240, 0.4);
  }

  .decline-btn {
    background: linear-gradient(135deg, #e94560, #b91d47);
    color: white;
  }

  .decline-btn:hover {
    background: linear-gradient(135deg, #ff6b81, #a8153a);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(233, 69, 96, 0.4);
  }

  .btn-icon {
    font-size: 1.4rem;
  }

  /* 支付界面样式 */
  .payment-interface {
    margin: 20px 0;
  }

  .payment-processing {
    margin: 20px 0;
  }

  .spinner {
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid #4cc9f0;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .payment-details {
    background: rgba(255, 255, 255, 0.1);
    padding: 15px;
    border-radius: 10px;
    margin: 20px 0;
  }

  .payment-item {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
    padding: 5px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* 支付成功样式 */
  .payment-success {
    margin: 20px 0;
  }

  .success-animation {
    font-size: 4rem;
    margin: 20px 0;
    animation: moneyFall 1s ease-out;
  }

  @keyframes moneyFall {
    0% { transform: translateY(-50px) scale(0.5); opacity: 0; }
    50% { transform: translateY(0) scale(1.2); opacity: 1; }
    100% { transform: scale(1); }
  }

  /* 相机效果样式 */
  .camera-effect {
    position: relative;
    margin: 25px 0;
  }

  .flash {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: white;
    opacity: 0;
    animation: flash 0.3s ease-out;
  }

  @keyframes flash {
    0% { opacity: 0; }
    50% { opacity: 0.8; }
    100% { opacity: 0; }
  }

  .camera-shutter {
    font-size: 5rem;
    margin: 15px 0;
    animation: shutterClick 0.5s ease-out;
  }

  @keyframes shutterClick {
    0% { transform: scale(1); }
    50% { transform: scale(0.8); }
    100% { transform: scale(1); }
  }

  .photo-preview {
    margin: 20px auto;
    position: relative;
    max-width: 250px;
  }

  .embarrassing-photo {
    width: 100%;
    border-radius: 10px;
    border: 3px solid #e94560;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  }

  .photo-stamp {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: #e94560;
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 0.8rem;
    font-weight: bold;
    transform: rotate(-5deg);
  }

  .shame-btn {
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    margin: 0 auto;
  }

  .shame-btn:hover {
    background: linear-gradient(135deg, #ff5252, #d63031);
  }

  /* 弹窗动画 */
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
    40% {transform: translateY(-10px);}
    60% {transform: translateY(-5px);}
  }

  .continue-btn {
    background: linear-gradient(135deg, #4361ee, #3a0ca3);
    color: white;
    margin: 20px auto 0;
  }

  .continue-btn:hover {
    background: linear-gradient(135deg, #3a56d4, #2d0a82);
  }
`;
document.head.appendChild(style);
