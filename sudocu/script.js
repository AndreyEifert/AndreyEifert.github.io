// 1. ССЫЛКИ НА ЭЛЕМЕНТЫ ИНТЕРФЕЙСА (DOM)
const boardEl = document.getElementById('sudoku-board');
const timerEl = document.getElementById('timer');
const btnNew = document.getElementById('btn-new');
const btnClear = document.getElementById('btn-clear');
const themeToggleBtn = document.getElementById('theme-toggle');
const difficultySelect = document.getElementById('difficulty-select');
const winModal = document.getElementById('win-modal');
const finalTimeEl = document.getElementById('final-time');
const btnModalNew = document.getElementById('btn-modal-new');

// Элементы рейтинга и очков
const rankBadge = document.getElementById('rank-badge');
const totalXpEl = document.getElementById('total-xp');
const nextRankInfo = document.getElementById('next-rank-info');
const progressBarFill = document.getElementById('progress-bar-fill');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('final-score');

// Базовая строка-шаблон для генерации игрового поля
const baseString = "534678912672195348198342567859761423426853791713924856961537284287419635345286179";

// Глобальное состояние игры
let currentBoard = [];
let initialMask = [];
let selectedCell = null;
let gameActive = true;
let timerInterval = null;
let currentScore = 0;

// Общий накопительный опыт игрока за все игры
let totalXP = parseInt(localStorage.getItem('sudoku_total_xp')) || 0;

// Сетка рангов
const RANKS = [
    { name: "🌱 Новичок", minXp: 0 },
    { name: "🔍 Любитель", minXp: 1000 },
    { name: "🧠 Эрудит", minXp: 3000 },
    { name: "⚡ Мастер", minXp: 7000 },
    { name: "👑 Гроссмейстер", minXp: 15000 }
];

// 2. ФУНКЦИЯ СОХРАНЕНИЯ СЕССИИ В ЛОКАЛЬНУЮ ПАМЯТЬ
function saveCurrentSession(seconds = 0) {
    if (!gameActive) {
        localStorage.removeItem('sudoku_current_board');
        localStorage.removeItem('sudoku_initial_mask');
        localStorage.removeItem('sudoku_timer_seconds');
        localStorage.removeItem('sudoku_game_active');
        localStorage.removeItem('sudoku_score');
        return;
    }
    localStorage.setItem('sudoku_current_board', JSON.stringify(currentBoard));
    localStorage.setItem('sudoku_initial_mask', JSON.stringify(initialMask));
    localStorage.setItem('sudoku_game_active', 'true');
    localStorage.setItem('sudoku_score', currentScore);
    if (seconds > 0) {
        localStorage.setItem('sudoku_timer_seconds', seconds);
    }
}

// 3. ФУНКЦИЯ ГЕНЕРАЦИИ СЛУЧАЙНОГО НАБОРА ЦИФР
function generateRandomBoard() {
    let board = [];
    for (let r = 0; r < 9; r++) {
        board.push([]);
        for (let c = 0; c < 9; c++) {
            board[r].push(parseInt(baseString[r * 9 + c]));
        }
    }

    // Перемешивание цифр от 1 до 9
    let digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    digits.sort(() => Math.random() - 0.5);
    
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            board[r][c] = digits[board[r][c] - 1];
        }
    }

    // Перемешивание строк внутри малых блоков 3х3
    for (let i = 0; i < 3; i++) {
        let blockStart = i * 3;
        if (Math.random() > 0.5) {
            let temp = board[blockStart];
            board[blockStart] = board[blockStart + 1];
            board[blockStart + 1] = temp;
        }
        if (Math.random() > 0.5) {
            let temp = board[blockStart + 1];
            board[blockStart + 1] = board[blockStart + 2];
            board[blockStart + 2] = temp;
        }
    }
    return board;
}

// 4. ТАЙМЕР ИГРЫ
function startTimer(startFromSeconds = 0) {
    clearInterval(timerInterval);
    let seconds = startFromSeconds;
    
    let min = Math.floor(seconds / 60).toString().padStart(2, '0');
    let sec = (seconds % 60).toString().padStart(2, '0');
    timerEl.textContent = `${min}:${sec}`;

    timerInterval = setInterval(() => {
        seconds++;
        let min = Math.floor(seconds / 60).toString().padStart(2, '0');
        let sec = (seconds % 60).toString().padStart(2, '0');
        timerEl.textContent = `${min}:${sec}`;
        
        if (gameActive && seconds % 30 === 0 && currentScore > 10) {
            currentScore -= 10;
            scoreEl.textContent = currentScore;
        }

        if (gameActive) {
            localStorage.setItem('sudoku_timer_seconds', seconds);
        }
    }, 1000);
}
// 5. ОБНОВЛЕНИЕ ОТОБРАЖЕНИЯ РАНГА И ПРОГРЕССА
function updatePlayerRatingDisplay() {
    let currentRank = RANKS;
    let nextRank = RANKS;
    
    for (let i = 0; i < RANKS.length; i++) {
        if (totalXP >= RANKS[i].minXp) {
            currentRank = RANKS[i];
            nextRank = RANKS[i + 1] || null;
        }
    }
    
    rankBadge.textContent = currentRank.name;
    totalXpEl.textContent = totalXP;
    
    if (nextRank) {
        const xpInCurrentLevel = totalXP - currentRank.minXp;
        const totalXpRequiredForLevel = nextRank.minXp - currentRank.minXp;
        const progressPercentage = (xpInCurrentLevel / totalXpRequiredForLevel) * 100;
        
        nextRankInfo.textContent = `До след. ранга: ${nextRank.minXp - totalXP} XP`;
        progressBarFill.style.width = `${Math.min(100, progressPercentage)}%`;
    } else {
        nextRankInfo.textContent = "🏆 Максимальный ранг!";
        progressBarFill.style.width = "100%";
    }
}

// 6. ОТРИСОВКА ИГРОВОГО ПОЛЯ
function renderBoard() {
    boardEl.innerHTML = '';
    if (!currentBoard || currentBoard.length !== 9 || !initialMask || initialMask.length !== 9) {
        setTimeout(initGame, 0);
        return;
    }

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;

            const val = currentBoard[r][c];
            cell.textContent = val !== 0 ? val : '';

            if (initialMask[r][c]) {
                cell.classList.add('initial');
            }
            
            cell.addEventListener('click', () => selectCell(cell));
            boardEl.appendChild(cell);
        }
    }
}

// 7. ИНИЦИАЛИЗАЦИЯ ИГРЫ
function initGame() {
    localStorage.removeItem('sudoku_current_board');
    localStorage.removeItem('sudoku_initial_mask');
    localStorage.removeItem('sudoku_timer_seconds');
    localStorage.removeItem('sudoku_game_active');
    localStorage.removeItem('sudoku_score');

    boardEl.innerHTML = '';
    currentBoard = [];
    initialMask = [];
    gameActive = true;
    selectedCell = null;
    currentScore = 0;
    scoreEl.textContent = currentScore;
    if (winModal) winModal.classList.remove('show');
    
    const solvedBoard = generateRandomBoard();
    
    let fillChance = 0.50; 
    const difficulty = difficultySelect.value;
    if (difficulty === 'easy') fillChance = 0.65;
    if (difficulty === 'hard') fillChance = 0.32;
    
    for (let r = 0; r < 9; r++) {
        currentBoard.push([]);
        initialMask.push([]);
        for (let c = 0; c < 9; c++) {
            if (Math.random() < fillChance) { 
                currentBoard[r].push(solvedBoard[r][c]);
                initialMask[r].push(true);
            } else {
                currentBoard[r].push(0);
                initialMask[r].push(false);
            }
        }
    }

    renderBoard();
    startTimer(0);
    saveCurrentSession(0);
}

// 8. ВЫБОР ЯЧЕЙКИ И ПОДСВЕТКА КОПИЙ
function selectCell(cellEl) {
    if (!gameActive) return;
    
    document.querySelectorAll('.cell').forEach(c => {
        c.classList.remove('selected');
        c.style.backgroundColor = ''; 
    });

    selectedCell = cellEl;
    if (cellEl.classList.contains('initial')) {
        selectedCell = null; 
    } else {
        cellEl.classList.add('selected');
    }

    const clickedNum = cellEl.textContent;
    if (clickedNum !== '') {
        document.querySelectorAll('.cell').forEach(c => {
            if (c.textContent === clickedNum) {
                const isDark = document.body.classList.contains('dark-theme');
                c.style.backgroundColor = isDark ? '#3a3a3c' : '#e5e5ea';
            }
        });
    }
}

// 9. ПРОВЕРКА ВАЛИДНОСТИ ХОДА
function isValidMove(row, col, num) {
    if (num === 0) return true;
    for (let c = 0; c < 9; c++) {
        if (c !== col && currentBoard[row][c] === num) return false;
    }
    for (let r = 0; r < 9; r++) {
        if (r !== row && currentBoard[r][col] === num) return false;
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = startRow; r < startRow + 3; r++) {
        for (let c = startCol; c < startCol + 3; c++) {
            if ((r !== row || c !== col) && currentBoard[r][c] === num) return false;
        }
    }
    return true;
}

// 10. ПРОВЕРКА ПОБЕДЫ
function checkWinCondition() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (currentBoard[r][c] === 0) return;
        }
    }
    if (document.querySelector('.cell.error')) return; 

    gameActive = false;
    clearInterval(timerInterval);
    if (selectedCell) selectedCell.classList.remove('selected');
    
    totalXP += currentScore;
    localStorage.setItem('sudoku_total_xp', totalXP);
    
    setTimeout(() => {
        finalTimeEl.textContent = timerEl.textContent;
        finalScoreEl.textContent = currentScore;
        winModal.classList.add('show');
        updatePlayerRatingDisplay();
    }, 300);
}

// 11. КЛИКИ ПО ЦИФРАМ КЛАВИАТУРЫ
document.querySelectorAll('.pad-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!selectedCell || !gameActive) return;

        const row = parseInt(selectedCell.dataset.row);
        const col = parseInt(selectedCell.dataset.col);
        const action = btn.dataset.num;
        const wasEmptyOrError = selectedCell.textContent === '' || selectedCell.classList.contains('error');

        if (action === 'erase') {
            currentBoard[row][col] = 0;
            selectedCell.textContent = '';
            selectedCell.classList.remove('error');
            selectCell(selectedCell);
        } else {
            const num = parseInt(action);
            currentBoard[row][col] = num;
            selectedCell.textContent = num;

            if (isValidMove(row, col, num)) {
                selectedCell.classList.remove('error');
                if (wasEmptyOrError) currentScore += 100;
                checkWinCondition();
            } else {
                selectedCell.classList.add('error');
                currentScore = Math.max(0, currentScore - 200);
            }
            scoreEl.textContent = currentScore;
            selectCell(selectedCell);
        }
        saveCurrentSession();
    });
});

// 12. СЛУШАТЕЛИ КНОПОК УПРАВЛЕНИЯ И ТЕМЫ
btnNew.addEventListener('click', initGame);
btnModalNew.addEventListener('click', initGame);

btnClear.addEventListener('click', () => {
    if (selectedCell && gameActive) {
        const row = parseInt(selectedCell.dataset.row);
        const col = parseInt(selectedCell.dataset.col);
        currentBoard[row][col] = 0;
        selectedCell.textContent = '';
        selectedCell.classList.remove('error');
        selectCell(selectedCell);
        saveCurrentSession();
    }
});

difficultySelect.addEventListener('change', () => {
    localStorage.setItem('sudoku_difficulty', difficultySelect.value);
    initGame();
});

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
}

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    if (selectedCell) selectCell(selectedCell);
});

// 13. ВОССТАНОВЛЕНИЕ СЕССИИ И СТАРТ
function loadSavedSessionOrStart() {
    updatePlayerRatingDisplay();

    const savedDifficulty = localStorage.getItem('sudoku_difficulty');
    if (savedDifficulty) {
        difficultySelect.value = savedDifficulty;
    }

    try {
        const savedBoard = localStorage.getItem('sudoku_current_board');
        const savedMask = localStorage.getItem('sudoku_initial_mask');
        const savedTime = localStorage.getItem('sudoku_timer_seconds');
        const savedActive = localStorage.getItem('sudoku_game_active');
        const savedScore = localStorage.getItem('sudoku_score');

        if (savedBoard && savedMask && savedActive === 'true') {
            const parsedBoard = JSON.parse(savedBoard);
            const parsedMask = JSON.parse(savedMask);

            if (Array.isArray(parsedBoard) && parsedBoard.length === 9 && Array.isArray(parsedMask) && parsedMask.length === 9) {
                currentBoard = parsedBoard;
                initialMask = parsedMask;
                gameActive = true;
                selectedCell = null;
                
                currentScore = parseInt(savedScore) || 0;
                scoreEl.textContent = currentScore;
                
                if (winModal) winModal.classList.remove('show');

                renderBoard();
                startTimer(parseInt(savedTime) || 0);
                return; 
            }
        }
    } catch (e) {
        console.error(e);
    }

    initGame();
}

loadSavedSessionOrStart();

// Регистрация Service Worker для PWA офлайн-режима
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sudocu1/sw.js')
      .then(reg => console.log('Service Worker успешно запущен', reg))
      .catch(err => console.log('Ошибка запуска Service Worker', err));
  });
}
