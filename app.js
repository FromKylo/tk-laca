let levels = [];
let currentLevel = 0;

const editor = document.getElementById('code-editor');
const preview = document.getElementById('preview');
const lineNumbers = document.getElementById('line-numbers');
const feedback = document.getElementById('feedback');
const nextBtn = document.getElementById('next-btn');
const checkBtn = document.getElementById('check-btn');
const levelIndicator = document.getElementById('level-indicator');
const unlockLevelBtn = document.getElementById('unlock-level-btn');
const levelSelect = document.getElementById('level-select');
const passwordInput = document.getElementById('password-input');

editor.setAttribute('autocomplete', 'off');
editor.setAttribute('autocapitalize', 'off');
editor.setAttribute('autocorrect', 'off');
editor.setAttribute('spellcheck', 'false');
editor.setAttribute('data-gramm', 'false');

function normalizeLevels(rawLevels) {
    if (!Array.isArray(rawLevels)) return [];

    return rawLevels.map((level) => ({
        ...level,
        validate: typeof level.validate === 'function'
            ? level.validate
            : new Function('code', level.validate)
    }));
}

async function loadLevels() {
    try {
        const response = await fetch('levels.json');
        if (response.ok) {
            const data = await response.json();
            levels = normalizeLevels(data);
            populateLevelSelector();
            return;
        }
    } catch (error) {
        console.warn('Unable to load levels.json, the lesson will continue with an empty set.', error);
    }

    levels = normalizeLevels([]);
    populateLevelSelector();
}

function updateLineNumbers() {
    const count = Math.max(1, editor.value.split('\n').length);
    lineNumbers.innerHTML = Array.from({ length: count }, (_, i) => i + 1).join('<br>');
}

function syncLineNumbersScroll() {
    lineNumbers.scrollTop = editor.scrollTop;
}

editor.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 2;
        preview.innerHTML = this.value;
        feedback.innerHTML = 'Keep typing...';
        feedback.className = '';
    }
});

function highlightHTML(text) {
    const html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return html
        .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="comment">$1</span>')
        .replace(/(&lt;\/\s*[a-zA-Z0-9-_:.]+\s*&gt;)/g, '<span class="tag">$1</span>')
        .replace(/(&lt;[a-zA-Z0-9-_:.]+)([\s\S]*?)(\/?&gt;)/g, (match, open, attrs, close) => {
            const highlightedAttrs = attrs
                .replace(/([a-zA-Z-:]+)(=)("[^"]*"|'[^']*')/g, '<span class="attr-name">$1</span>$2<span class="attr-value">$3</span>');
return `<span class="tag">${open}</span>${highlightedAttrs}<span class="tag">${close}</span>`;
        });
}

function syncHighlight() {
    const highlight = document.getElementById('code-highlight');
    const value = editor.value.replace(/\t/g, '  ');
    highlight.innerHTML = highlightHTML(value) + '\n';
    highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;
}

editor.addEventListener('input', () => {
    preview.innerHTML = editor.value;
    feedback.innerHTML = 'Keep typing...';
    feedback.className = '';
    updateLineNumbers();
    syncHighlight();
});

editor.addEventListener('scroll', () => {
    syncLineNumbersScroll();
    syncHighlight();
});

function populateLevelSelector() {
    if (!levelSelect) return;
    levelSelect.innerHTML = '<option value="">Choose a level</option>';
    levels.forEach((level, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `Level ${index + 1}: ${level.title}`;
        levelSelect.appendChild(option);
    });
}

function unlockLevelSelector() {
    const enteredPassword = passwordInput.value;
    const normalizedPassword = enteredPassword.trim().toLowerCase();

    if (normalizedPassword === 'laca2026') {
        levelSelect.style.display = 'inline-block';
        unlockLevelBtn.style.display = 'none';
        passwordInput.style.display = 'none';
        levelSelect.value = currentLevel;
        feedback.innerHTML = 'Level selector unlocked.';
        feedback.className = 'feedback-success';
    } else if (normalizedPassword.length === 0) {
        feedback.innerHTML = 'Please enter the password.';
        feedback.className = 'feedback-error';
    } else {
        feedback.innerHTML = 'Incorrect password.';
        feedback.className = 'feedback-error';
    }
}

function jumpToLevel(index) {
    const targetLevel = Number(index);
    if (!Number.isNaN(targetLevel) && targetLevel >= 0 && targetLevel < levels.length) {
        currentLevel = targetLevel;
        loadLevel(currentLevel);
    }
}

function loadLevel(index) {
    if (!levels.length) return;

    if (index >= levels.length) {
        document.getElementById('instructions-content').innerHTML = `
            <strong>🏆You beat the game!</strong><br><br>
            Now, personalize your own website, either here or on Notepad++<br>
            <strong>🚨 When you are completely finished, call Sir Gelo to check your work!</strong>
        `;
        checkBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        feedback.innerHTML = 'Customize your site and call Sir Gelo!';
        feedback.className = 'feedback-success';
        levelIndicator.innerText = '- Final Challenge';
        return;
    }

    const level = levels[index];
    levelIndicator.innerText = `- Level ${index + 1} of ${levels.length}: ${level.title}`;
    document.getElementById('instructions-content').innerHTML = level.instruction;

    editor.value = level.initialCode;
    preview.innerHTML = editor.value;
    updateLineNumbers();

    if (levelSelect) {
        levelSelect.value = index;
    }

    feedback.innerHTML = 'Read the instructions and edit the code.';
    feedback.className = '';
    nextBtn.style.display = 'none';
    checkBtn.style.display = 'inline-block';

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.style.display = 'inline-block';
        resetBtn.disabled = false;
    }

    if (window.gameMode === 'selector') {
        levelSelect.style.display = 'inline-block';
        unlockLevelBtn.style.display = 'none';
        passwordInput.style.display = 'none';
    } else {
        levelSelect.style.display = 'none';
        unlockLevelBtn.style.display = 'none';
        passwordInput.style.display = 'none';
    }

    editor.classList.remove('blink');
    if (index === 0) {
        editor.classList.add('blink');
        editor.focus();
        setTimeout(() => editor.classList.remove('blink'), 4000);
    }

    syncHighlight();
}

function checkAnswer() {
    const level = levels[currentLevel];
    const code = editor.value;

    if (level.validate(code)) {
        feedback.innerHTML = `✓ ${level.successMsg}`;
        feedback.className = 'feedback-success';
        checkBtn.style.display = 'none';
        nextBtn.style.display = 'inline-block';

        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.disabled = true;
        }
    } else {
        feedback.innerHTML = '✗ Not quite right. Check your tags and spelling.';
        feedback.className = 'feedback-error';
    }
}

function nextLevel() {
    currentLevel += 1;
    loadLevel(currentLevel);
}

window.gameMode = null;

function showExamForm() {
    document.getElementById('mode-options').style.display = 'none';
    document.getElementById('exam-form').style.display = 'block';
}

function showSelectorForm() {
    document.getElementById('mode-options').style.display = 'none';
    document.getElementById('selector-form').style.display = 'block';
}

async function startExamMode() {
    const last = document.getElementById('last-name').value.trim();
    const first = document.getElementById('first-name').value.trim();
    const mi = document.getElementById('middle-initial').value.trim();
    const formatted = `${last ? last + ',' : ''} ${first}${mi ? ' ' + mi.toUpperCase() + '.' : ''}`.trim();
    document.getElementById('student-name').innerText = formatted;
    window.gameMode = 'exam';
    document.getElementById('mode-overlay').style.display = 'none';
    await loadLevels();
    loadLevel(0);
}

async function startLevelSelectorFromOverlay() {
    const pw = document.getElementById('overlay-password').value.trim().toLowerCase();
    if (pw === 'laca2026') {
        window.gameMode = 'selector';
        levelSelect.style.display = 'inline-block';
        unlockLevelBtn.style.display = 'none';
        passwordInput.style.display = 'none';
        document.getElementById('mode-overlay').style.display = 'none';
        await loadLevels();
        loadLevel(0);
        feedback.innerHTML = 'Level selector mode active.';
        feedback.className = 'feedback-success';
    } else {
        alert('Incorrect password.');
    }
}

function resetLevel() {
    if (!levels.length) return;

    const lvl = levels[currentLevel];
    if (!lvl) return;
    editor.value = lvl.initialCode;
    preview.innerHTML = lvl.initialCode;
    updateLineNumbers();
    syncHighlight();
    feedback.innerHTML = 'Editor reset to initial code.';
    feedback.className = '';
    checkBtn.style.display = 'inline-block';
    nextBtn.style.display = 'none';

    if (currentLevel === 0) {
        editor.classList.add('blink');
        editor.focus();
        setTimeout(() => editor.classList.remove('blink'), 3000);
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) resetBtn.disabled = false;
}

function setupSplitters() {
    const splitter1 = document.getElementById('splitter-1');
    const splitter2 = document.getElementById('splitter-2');
    const panelA = splitter1.previousElementSibling;
    const panelB = splitter1.nextElementSibling;
    const panelC = splitter2.nextElementSibling;

    let activeSplitter = null;
    let startX = 0;
    let startWidthA = 0;
    let startWidthB = 0;
    let startWidthC = 0;

    function handleMouseMove(e) {
        if (!activeSplitter) return;
        const delta = e.clientX - startX;
        if (activeSplitter === splitter1) {
            const newA = Math.max(150, startWidthA + delta);
            const newB = Math.max(180, startWidthB - delta);
            panelA.style.flex = `0 0 ${newA}px`;
            panelB.style.flex = `0 0 ${newB}px`;
        } else if (activeSplitter === splitter2) {
            const newB = Math.max(180, startWidthB + delta);
            const newC = Math.max(180, startWidthC - delta);
            panelB.style.flex = `0 0 ${newB}px`;
            panelC.style.flex = `0 0 ${newC}px`;
        }
    }

    function handleMouseUp() {
        if (!activeSplitter) return;
        activeSplitter.classList.remove('active');
        activeSplitter = null;
        document.body.classList.remove('dragging');
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }

    function startDrag(splitter, e) {
        activeSplitter = splitter;
        startX = e.clientX;
        startWidthA = panelA.getBoundingClientRect().width;
        startWidthB = panelB.getBoundingClientRect().width;
        startWidthC = panelC.getBoundingClientRect().width;
        splitter.classList.add('active');
        document.body.classList.add('dragging');
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        e.preventDefault();
    }

    splitter1.addEventListener('mousedown', (e) => startDrag(splitter1, e));
    splitter2.addEventListener('mousedown', (e) => startDrag(splitter2, e));
}

window.addEventListener('load', () => {
    populateLevelSelector();
    setupSplitters();
});

loadLevels();
