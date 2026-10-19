// Загрузка глобального стейта
let appState = JSON.parse(localStorage.getItem('cal_dark_tracker_state')) || {
    markedDays: {},
    currentRate: 100,
    resetTimestamp: 0
};

let currentDate = new Date();

const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// DOM элементы основного экрана
const monthYearTitle = document.getElementById('month-year-title');
const calendarDaysContainer = document.getElementById('calendar-days');
const totalSumDisplay = document.getElementById('total-sum');
const resettableSumDisplay = document.getElementById('resettable-sum');
const monthSumDisplay = document.getElementById('month-sum');
const currentRateInput = document.getElementById('current-rate-input');
const saveRateBtn = document.getElementById('save-rate-btn');
const resettableBox = document.getElementById('resettable-box');

// Элементы Модальных окон
const listModal = document.getElementById('list-modal');
const openListBtn = document.getElementById('open-list-btn');
const closeListBtn = document.getElementById('close-list-btn');
const markedDaysList = document.getElementById('marked-days-list');
const backupModal = document.getElementById('backup-modal');
const openBackupBtn = document.getElementById('open-backup-btn');
const closeBackupBtn = document.getElementById('close-backup-btn');

currentRateInput.value = appState.currentRate;

function saveToStorage() {
    localStorage.setItem('cal_dark_tracker_state', JSON.stringify(appState));
    calculateTotals();
}

function calculateTotals() {
    let total = 0;
    let resettableTotal = 0;
    let monthTotal = 0;

    const currentYear = currentDate.getFullYear();
    const currentMonthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
    const monthPrefix = `${currentYear}-${currentMonthStr}`;

    for (const key in appState.markedDays) {
        const item = appState.markedDays[key];
        if (item.marked) {
            total += Number(item.value || 0);
            if (item.timestamp && item.timestamp > appState.resetTimestamp) {
                resettableTotal += Number(item.value || 0);
            }
            if (key.startsWith(monthPrefix)) {
                monthTotal += Number(item.value || 0);
            }
        }
    }
    totalSumDisplay.textContent = total;
    resettableSumDisplay.textContent = resettableTotal;
    monthSumDisplay.textContent = monthTotal;
}

function renderCalendar() {
    calendarDaysContainer.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthYearTitle.textContent = `${monthNames[month]} ${year}`;

    weekDays.forEach(day => {
        const weekdayEl = document.createElement('div');
        weekdayEl.className = 'weekday';
        weekdayEl.textContent = day;
        calendarDaysContainer.appendChild(weekdayEl);
    });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const shift = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();

    const realToday = new Date();
    const isCurrentMonthAndYear = (realToday.getFullYear() === year && realToday.getMonth() === month);

    for (let i = 0; i < shift; i++) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'day empty';
        calendarDaysContainer.appendChild(emptyEl);
    }

    for (let d = 1; d <= totalDays; d++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'day';
        dayEl.textContent = d;

        const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayData = appState.markedDays[dayString];

        if (isCurrentMonthAndYear && realToday.getDate() === d) {
            dayEl.classList.add('today');
        }

        if (dayData && dayData.marked) {
            dayEl.classList.add('marked');
            const valEl = document.createElement('span');
            valEl.className = 'day-value';
            valEl.textContent = `+${dayData.value}`;
            dayEl.appendChild(valEl);
        }

        let pressTimer;
        const startPress = () => { pressTimer = setTimeout(() => toggleDay(dayString), 600); };
        const cancelPress = () => clearTimeout(pressTimer);

        dayEl.addEventListener('mousedown', startPress);
        dayEl.addEventListener('mouseup', cancelPress);
        dayEl.addEventListener('mouseleave', cancelPress);
        dayEl.addEventListener('touchstart', startPress, { passive: true });
        dayEl.addEventListener('touchend', cancelPress);
        dayEl.addEventListener('touchmove', cancelPress);
        dayEl.addEventListener('contextmenu', e => e.preventDefault());

        calendarDaysContainer.appendChild(dayEl);
    }
    calculateTotals();
}

function toggleDay(dateStr) {
    if (appState.markedDays[dateStr] && appState.markedDays[dateStr].marked) {
        delete appState.markedDays[dateStr];
    } else {
        appState.markedDays[dateStr] = {
            marked: true,
            value: Number(appState.currentRate),
            timestamp: Date.now()
        };
    }
    saveToStorage();
    renderCalendar();
}
// Зажатие на сбрасываемом блоке для обнуления
let resetTimer;
resettableBox.addEventListener('mousedown', () => { resetTimer = setTimeout(resetResettableCounter, 800); });
resettableBox.addEventListener('mouseup', () => clearTimeout(resetTimer));
resettableBox.addEventListener('touchstart', () => { resetTimer = setTimeout(resetResettableCounter, 800); }, {passive: true});
resettableBox.addEventListener('touchend', () => clearTimeout(resetTimer));

function resetResettableCounter() {
    if (confirm("Обнулить накапливаемую сумму?")) {
        appState.resetTimestamp = Date.now();
        saveToStorage();
        alert("Счетчик обнулен!");
    }
}

// АВТОМАТИЧЕСКОЕ СОХРАНЕНИЕ ТАРИФА ПРИ ВВОДЕ И ВЫДЕЛЕНИЕ ПРИ ТАПЕ
currentRateInput.addEventListener('input', () => {
    const value = Number(currentRateInput.value);
    if (!isNaN(value) && currentRateInput.value !== '') {
        appState.currentRate = value;
        localStorage.setItem('cal_dark_tracker_state', JSON.stringify(appState));
    }
});

// Выделение всего текста внутри инпута при тапе/фокусе
currentRateInput.addEventListener('focus', () => {
    setTimeout(() => {
        currentRateInput.select();
    }, 50); // Небольшой таймаут гарантирует выделение в мобильном Chrome/Safari
});

// Логика Аккордеона в списке дней
openListBtn.addEventListener('click', () => {
    markedDaysList.innerHTML = '';
    const sortedKeys = Object.keys(appState.markedDays).sort().reverse();
    
    if (sortedKeys.length === 0) {
        markedDaysList.innerHTML = '<div class="hint" style="padding: 20px;">Нет помеченных дней</div>';
        listModal.classList.add('active');
        return;
    }

    const groups = {};
    
    sortedKeys.forEach(key => {
        const data = appState.markedDays[key];
        const [y, m, d] = key.split('-');
        const groupKey = `${y}-${m}`;
        
        if (!groups[groupKey]) {
            groups[groupKey] = {
                title: `${monthNames[parseInt(m) - 1]} ${y}`,
                sum: 0,
                items: []
            };
        }
        groups[groupKey].sum += Number(data.value);
        groups[groupKey].items.push({ dateStr: `${d}.${m}.${y}`, val: data.value });
    });

    for (const groupKey in groups) {
        const group = groups[groupKey];
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item';
        
        const header = document.createElement('div');
        header.className = 'accordion-header';
        header.innerHTML = `<span>${group.title}</span><span style="color:var(--accent-color); font-weight:800; margin-right:8px;">+${group.sum}</span>`;
        
        const content = document.createElement('div');
        content.className = 'accordion-content';
        
        group.items.forEach(item => {
            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            listItem.innerHTML = `<span>📅 ${item.dateStr}</span><span class="item-value">+${item.val}</span>`;
            content.appendChild(listItem);
        });
        
        accordionItem.appendChild(header);
        accordionItem.appendChild(content);
        
        const handleToggle = (e) => {
            e.preventDefault();
            e.stopPropagation();
            accordionItem.classList.toggle('active');
        };

        header.addEventListener('click', handleToggle);
        header.addEventListener('touchend', handleToggle);

        markedDaysList.appendChild(accordionItem);
    }
    
    if (markedDaysList.firstChild) {
        markedDaysList.firstChild.classList.add('active');
    }

    listModal.classList.add('active');
});

closeListBtn.addEventListener('click', () => listModal.classList.remove('active'));
openBackupBtn.addEventListener('click', () => backupModal.classList.add('active'));
closeBackupBtn.addEventListener('click', () => backupModal.classList.remove('active'));

window.addEventListener('click', (e) => {
    if (e.target === backupModal) backupModal.classList.remove('active');
});

// Навигация по месяцам
document.getElementById('prev-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
document.getElementById('next-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });

// БЭКАПЫ: Экспорт JSON
document.getElementById('export-json').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "calendar_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

// БЭКАПЫ: Экспорт CSV
document.getElementById('export-csv').addEventListener('click', () => {
    let csvContent = "data:text/csv;charset=utf-8,Дата,Стоимость,ВременнаяМетка\n";
    for (const date in appState.markedDays) {
        const item = appState.markedDays[date];
        csvContent += `${date},${item.value},${item.timestamp || ''}\n`;
    }
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", "calendar_backup.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

// БЭКАПЫ: Импорт (JSON / CSV)
document.getElementById('import-file').addEventListener('change', function(e) {
    const file = e.target.files;
    if (!file || file.length === 0) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        const content = evt.target.result.trim();
        try {
            if (file.name.endsWith('.json')) {
                const parsed = JSON.parse(content);
                if (parsed.markedDays && typeof parsed.currentRate === 'number') {
                    appState = parsed;
                    saveToStorage();
                    renderCalendar();
                    alert("Бэкап JSON успешно импортирован!");
                } else { throw new Error(); }
            } else if (file.name.endsWith('.csv')) {
                const lines = content.split('\n');
                const newMarkedDays = {};
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i]) continue;
                    const [date, value, timestamp] = lines[i].split(',');
                    if (date && value) {
                        newMarkedDays[date] = {
                            marked: true,
                            value: Number(value),
                            timestamp: timestamp ? Number(timestamp) : Date.now()
                        };
                    }
                }
                appState.markedDays = newMarkedDays;
                saveToStorage();
                renderCalendar();
                alert("Бэкап CSV успешно импортирован!");
            }
            backupModal.classList.remove('active');
        } catch (err) {
            alert("Ошибка чтения файла. Проверьте формат бэкапа.");
        }
    };
    reader.readAsText(file);
});

// Первичный запуск приложения
calculateTotals();
renderCalendar();
