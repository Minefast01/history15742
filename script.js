// DOM Elements
const startGameBtn = document.getElementById('start-game-btn');
const videoSection = document.querySelector('.video-section');
const gameSection = document.getElementById('game-section');
const resultSection = document.getElementById('result-section');
const mazeElement = document.getElementById('maze');
const scoreElement = document.getElementById('score');
const questionsLeftElement = document.getElementById('questions-left');
const finalScoreElement = document.getElementById('final-score');
const questionModal = document.getElementById('question-modal');
const questionTextElement = document.getElementById('question-text');
const optionsElement = document.getElementById('options');
const submitAnswerBtn = document.getElementById('submit-answer');
const videoOverlay = document.getElementById('video-overlay');
const youtubePlayerEl = document.getElementById('youtube-player');
const answerFeedback = document.getElementById('answer-feedback');

// Game variables
let player;
let score = 0;
let questionsAnswered = 0;
let stones = [];
let usedQuestions = [];
let currentQuestion = null;
let selectedAnswer = null;
let videoEnded = false;
let youtubePlayer;

// Maze layout (1 = wall, 0 = path, 2 = start, 3 = end)
const mazeLayout = [
    [1, 1, 1, 1, 1, 1, 1],
    [2, 0, 0, 1, 0, 0, 0],
    [1, 1, 0, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 1, 0],
    [1, 1, 1, 1, 0, 0, 3]
];

// Questions database
const questions = [
    {
        question: "พระมหากษัตริย์พระองค์ใดทรงสถาปนากรุงรัตนโกสินทร์เป็นราชธานี?",
        options: [
            "A. พระเจ้าตากสินมหาราช",
            "B. พระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช",
            "C. พระบาทสมเด็จพระจอมเกล้าเจ้าอยู่หัว",
            "D. พระบาทสมเด็จพระปกเกล้าเจ้าอยู่หัว"
        ],
        correct: 1
    },
    {
        question: "เหตุผลหลักที่ย้ายราชธานีจากฝั่งธนบุรีมาฝั่งพระนครคืออะไร?",
        options: [
            "A. พื้นที่ฝั่งพระนครมีภูเขาและป่าไม้",
            "B. ฝั่งธนบุรีไม่มีแม่น้ำ",
            "C. ฝั่งธนบุรีคับแคบและไม่ปลอดภัย",
            "D. ฝั่งพระนครมีประชากรมากกว่า"
        ],
        correct: 2
    },
    {
        question: "วันที่มีการสถาปนากรุงรัตนโกสินทร์คือวันที่ใด?",
        options: [
            "A. 13 เมษายน พ.ศ. 2325",
            "B. 6 เมษายน พ.ศ. 2325",
            "C. 5 ธันวาคม พ.ศ. 2475",
            "D. 1 มกราคม พ.ศ. 2325"
        ],
        correct: 1
    },
    {
        question: "ข้อใด ไม่ใช่ ปัจจัยที่ทำให้กรุงรัตนโกสินทร์เหมาะกับการเป็นราชธานี?",
        options: [
            "A. มีแม่น้ำเจ้าพระยาไหลผ่าน",
            "B. เป็นพื้นที่ลุ่มที่มีน้ำท่วมบ่อย",
            "C. เหมาะแก่การวางผังเมือง",
            "D. สามารถป้องกันข้าศึกได้ดี"
        ],
        correct: 1
    },
    {
        question: "วัดใดเป็นที่ประดิษฐาน \"พระแก้วมรกต\"?",
        options: [
            "A. วัดอรุณราชวราราม",
            "B. วัดเบญจมบพิตร",
            "C. วัดพระเชตุพนวิมลมังคลาราม",
            "D. วัดพระศรีรัตนศาสดาราม"
        ],
        correct: 3
    }
];

// --- YouTube Player ---
function onYouTubeIframeAPIReady() {
    youtubePlayer = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: '-NeF2jrOWio',
        playerVars: {
            'playsinline': 1,
            'rel': 0,
            'modestbranding': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    videoOverlay.style.display = 'none';
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        videoEnded = true;
        startGameBtn.disabled = false;
        startGameBtn.style.display = 'block';
        startGameBtn.textContent = '🎮 เริ่มเกม';
    }
}

// --- Game Logic ---
function initGame() {
    if (!videoEnded) {
        alert('กรุณาดูวิดีโอให้จบก่อนเริ่มเกม');
        return;
    }

    videoSection.style.display = 'none';
    gameSection.style.display = 'block';
    
    // Reset game state
    score = 0;
    questionsAnswered = 0;
    usedQuestions = [];
    stones = [];
    
    // Find start position
    for (let row = 0; row < mazeLayout.length; row++) {
        for (let col = 0; col < mazeLayout[row].length; col++) {
            if (mazeLayout[row][col] === 2) {
                player = { row, col };
                break;
            }
        }
    }
    
    generateStones();
    renderMaze();
    updateUI();
}

function generateStones() {
    const pathCells = [];
    for (let row = 0; row < mazeLayout.length; row++) {
        for (let col = 0; col < mazeLayout[row].length; col++) {
            if (mazeLayout[row][col] === 0) {
                pathCells.push({ row, col });
            }
        }
    }
    
    for (let i = 0; i < 5 && pathCells.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * pathCells.length);
        stones.push(pathCells[randomIndex]);
        pathCells.splice(randomIndex, 1);
    }
}

function renderMaze() {
    mazeElement.innerHTML = '';
    
    for (let row = 0; row < mazeLayout.length; row++) {
        for (let col = 0; col < mazeLayout[row].length; col++) {
            const cell = document.createElement('div');
            cell.className = 'maze-cell';
            
            if (player.row === row && player.col === col) {
                cell.classList.add('player');
                cell.textContent = '🚶';
            } else if (stones.some(stone => stone.row === row && stone.col === col)) {
                cell.classList.add('stone');
                cell.textContent = '🪨';
            } else if (mazeLayout[row][col] === 1) {
                cell.classList.add('wall');
                cell.textContent = '🧱';
            } else if (mazeLayout[row][col] === 2) {
                cell.classList.add('start');
                cell.textContent = '🏁';
            } else if (mazeLayout[row][col] === 3) {
                cell.classList.add('end');
                cell.textContent = '🏆';
            } else {
                cell.classList.add('path');
            }
            
            mazeElement.appendChild(cell);
        }
    }
}

function movePlayer(direction) {
    let newRow = player.row;
    let newCol = player.col;
    
    switch (direction) {
        case 'up': newRow--; break;
        case 'down': newRow++; break;
        case 'left': newCol--; break;
        case 'right': newCol++; break;
    }
    
    if (newRow < 0 || newRow >= mazeLayout.length || newCol < 0 || newCol >= mazeLayout[0].length) {
        return;
    }
    
    if (mazeLayout[newRow][newCol] === 1) {
        return;
    }
    
    player.row = newRow;
    player.col = newCol;
    
    const stoneIndex = stones.findIndex(stone => stone.row === newRow && stone.col === newCol);
    if (stoneIndex !== -1) {
        stones.splice(stoneIndex, 1);
        showQuestion();
    }
    
    if (mazeLayout[newRow][newCol] === 3 && stones.length === 0) {
        endGame();
    }
    
    renderMaze();
    updateUI();
}

function showQuestion() {
    if (usedQuestions.length >= questions.length) return;
    
    let questionIndex;
    do {
        questionIndex = Math.floor(Math.random() * questions.length);
    } while (usedQuestions.includes(questionIndex));
    
    usedQuestions.push(questionIndex);
    currentQuestion = questions[questionIndex];
    
    questionTextElement.textContent = currentQuestion.question;
    optionsElement.innerHTML = '';
    
    currentQuestion.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.textContent = option;
        optionElement.onclick = () => selectOption(optionElement, index);
        optionsElement.appendChild(optionElement);
    });
    
    selectedAnswer = null;
    submitAnswerBtn.disabled = true;
    answerFeedback.style.display = 'none';
    questionModal.style.display = 'flex';
}

function selectOption(el, index) {
    selectedAnswer = index;
    document.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    el.classList.add('selected');
    submitAnswerBtn.disabled = false;
}

function submitAnswer() {
    if (selectedAnswer === null) return;

    const options = optionsElement.children;
    submitAnswerBtn.disabled = true;
    
    // Disable further clicks on options
    for (let option of options) {
        option.style.pointerEvents = 'none';
    }

    const isCorrect = selectedAnswer === currentQuestion.correct;

    if (isCorrect) {
        score += 10;
        options[selectedAnswer].classList.add('correct');
        answerFeedback.textContent = 'ถูกต้อง! +10 คะแนน';
        answerFeedback.className = 'correct';
    } else {
        options[selectedAnswer].classList.add('incorrect');
        options[currentQuestion.correct].classList.add('correct');
        answerFeedback.textContent = 'ผิด! คำตอบที่ถูกคือ ' + currentQuestion.options[currentQuestion.correct];
        answerFeedback.className = 'incorrect';
    }
    
    answerFeedback.style.display = 'block';
    questionsAnswered++;
    
    setTimeout(() => {
        questionModal.style.display = 'none';
        // Re-enable pointer events for next question
        for (let option of options) {
            option.style.pointerEvents = 'auto';
        }
        updateUI();
    }, 2000); // Wait 2 seconds before closing modal
}

function updateUI() {
    scoreElement.textContent = score;
    questionsLeftElement.textContent = stones.length;
}

function endGame() {
    gameSection.style.display = 'none';
    resultSection.style.display = 'block';
    finalScoreElement.textContent = score + '/50';
}

function resetGame() {
    resultSection.style.display = 'none';
    videoSection.style.display = 'block';
    
    if (youtubePlayer) {
        youtubePlayer.seekTo(0);
        youtubePlayer.pauseVideo();
    }
    
    videoEnded = false;
    startGameBtn.disabled = true;
    startGameBtn.style.display = 'none';
}

// --- Event Listeners ---
startGameBtn.addEventListener('click', initGame);
submitAnswerBtn.addEventListener('click', submitAnswer);
document.querySelector('.play-again-btn').addEventListener('click', resetGame);

document.addEventListener('keydown', (event) => {
    if (gameSection.style.display === 'block') {
        event.preventDefault();
        switch (event.key) {
            case 'ArrowUp': case 'w': case 'W': movePlayer('up'); break;
            case 'ArrowDown': case 's': case 'S': movePlayer('down'); break;
            case 'ArrowLeft': case 'a': case 'A': movePlayer('left'); break;
            case 'ArrowRight': case 'd': case 'D': movePlayer('right'); break;
        }
    }
});

document.querySelectorAll('.control-btn').forEach(button => {
    button.addEventListener('click', () => {
        const direction = button.getAttribute('data-direction');
        movePlayer(direction);
    });
});

// --- Mini Gemini Chat ---
const miniBtn = document.getElementById('mini-gemini-btn');
const miniPopup = document.getElementById('mini-gemini-popup');
const miniClose = document.getElementById('mini-gemini-close');
const miniMessages = document.getElementById('mini-gemini-messages');
const miniInput = document.getElementById('mini-gemini-input');
const miniSend = document.getElementById('mini-gemini-send');

// This is a placeholder key. Replace with your actual API key.
const MINI_API_KEY = 'AIzaSyDle9djjRBh-23IgjsaKQluC2ghPj60Y6A'; 
const MINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${MINI_API_KEY}`;

if (miniBtn) {
    miniBtn.innerHTML = '💬'; // Use an emoji for the button
    miniBtn.onclick = () => {
        miniPopup.style.display = 'flex';
        setTimeout(() => miniInput.focus(), 100);
    };
    miniClose.onclick = () => {
        miniPopup.style.display = 'none';
    };

    const addMiniMsg = (text, isUser) => {
        const div = document.createElement('div');
        div.className = 'mini-gemini-msg' + (isUser ? ' user' : '');
        div.textContent = text;
        miniMessages.appendChild(div);
        miniMessages.scrollTop = miniMessages.scrollHeight;
        return div;
    };

    const sendMiniMsg = async () => {
        const msg = miniInput.value.trim();
        if (!msg) return;
        addMiniMsg(msg, true);
        miniInput.value = '';
        const thinkingMsg = addMiniMsg('Gemini กำลังพิมพ์...', false);
        
        try {
            const res = await fetch(MINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: msg }] }]
                })
            });
            if (!res.ok) {
                throw new Error(`API error: ${res.statusText}`);
            }
            const data = await res.json();
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'เกิดข้อผิดพลาดหรือไม่ได้รับคำตอบ';
            thinkingMsg.textContent = responseText;
        } catch (e) {
            thinkingMsg.textContent = 'เกิดข้อผิดพลาด: ' + e.message;
        }
    };

    miniSend.onclick = sendMiniMsg;
    miniInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') sendMiniMsg();
    });
}