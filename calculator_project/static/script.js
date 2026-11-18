
"use strict";

// =====================================
// CALCULATOR PRO
// =====================================

const result = document.getElementById("result");
const previous = document.getElementById("previous");
const statusMessage = document.getElementById("status-message");

const normalButtons = document.querySelector(".buttons");

const historyPanel = document.getElementById("history-panel");
const scientificPanel = document.getElementById("scientific-panel");

const historyToggle = document.getElementById("history-toggle");
const scientificToggle = document.getElementById("scientific-toggle");

let expression = "";
let finished = false;
let lastResult = 0;

let memory = Number(localStorage.getItem("calcMemory")) || 0;

let angleMode = localStorage.getItem("calcAngle") || "DEG";

let soundEnabled =
    localStorage.getItem("calcSound") !== "false";

let history = [];

try {
    history = JSON.parse(
        localStorage.getItem("calcHistory") || "[]"
    );

    if (!Array.isArray(history)) history = [];
} catch {
    history = [];
}


// =====================================
// STORAGE
// =====================================

function saveStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        console.warn("Storage error:", error);
    }
}


// =====================================
// DISPLAY
// =====================================

function formatNumber(number) {
    if (!Number.isFinite(number)) {
        throw new Error("Math error");
    }

    if (Object.is(number, -0)) number = 0;

    return Number(number.toPrecision(12)).toString();
}


function updateDisplay() {
    result.value = expression || "0";

    document.getElementById("mode-label").textContent =
        angleMode;

    document.getElementById("memory-indicator").textContent =
        memory !== 0 ? "M" : "";

    document.getElementById("angle-toggle").textContent =
        angleMode;
}


function showMessage(message) {
    statusMessage.textContent = message;

    clearTimeout(showMessage.timer);

    showMessage.timer = setTimeout(() => {
        statusMessage.textContent = "";
    }, 1800);
}


// =====================================
// PANEL CONTROLS
// =====================================

function closePanels() {
    historyPanel.hidden = true;
    scientificPanel.hidden = true;

    // Restore the normal number keypad
    normalButtons.hidden = false;

    historyToggle.classList.remove("active");
    scientificToggle.classList.remove("active");
}


// HISTORY BUTTON

historyToggle.addEventListener("click", () => {
    const shouldOpen = historyPanel.hidden;

    closePanels();

    if (shouldOpen) {
        historyPanel.hidden = false;
        historyToggle.classList.add("active");

        renderHistory();
    }
});


// SCIENTIFIC BUTTON

scientificToggle.addEventListener("click", () => {
    const shouldOpen = scientificPanel.hidden;

    closePanels();

    if (shouldOpen) {
        scientificPanel.hidden = false;

        // Hide all normal number buttons in scientific mode
        normalButtons.hidden = true;

        scientificToggle.classList.add("active");
    }
});


// CLOSE BUTTONS

document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", closePanels);
});


// =====================================
// SOUND
// =====================================

function playSound() {
    if (!soundEnabled) return;

    try {
        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContext) return;

        const audio = new AudioContext();

        const oscillator = audio.createOscillator();
        const gain = audio.createGain();

        oscillator.connect(gain);
        gain.connect(audio.destination);

        oscillator.frequency.value = 650;

        gain.gain.setValueAtTime(0.04, audio.currentTime);

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audio.currentTime + 0.06
        );

        oscillator.start();
        oscillator.stop(audio.currentTime + 0.06);

        oscillator.onended = () => audio.close();

    } catch (error) {
        console.warn(error);
    }
}


function updateSoundButton() {
    document.getElementById("sound-toggle").textContent =
        soundEnabled ? "🔊" : "🔇";
}


document.getElementById("sound-toggle")
    .addEventListener("click", () => {

        soundEnabled = !soundEnabled;

        saveStorage("calcSound", soundEnabled);

        updateSoundButton();

        playSound();
    });


// =====================================
// THEME
// =====================================

function updateThemeButton() {
    const isLight = document.body.classList.contains("light");

    document.getElementById("theme-toggle").textContent =
        isLight ? "🌙" : "☀️";
}


if (localStorage.getItem("calcTheme") === "light") {
    document.body.classList.add("light");
}


document.getElementById("theme-toggle")
    .addEventListener("click", () => {

        document.body.classList.toggle("light");

        saveStorage(
            "calcTheme",
            document.body.classList.contains("light")
                ? "light"
                : "dark"
        );

        updateThemeButton();

        playSound();
    });


// =====================================
// TOKENIZER
// =====================================

function tokenize(input) {
    const tokens = [];

    let position = 0;

    while (position < input.length) {
        const remaining = input.slice(position);

        const whitespace = remaining.match(/^\s+/);

        if (whitespace) {
            position += whitespace[0].length;
            continue;
        }

        const number = remaining.match(
            /^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i
        );

        if (number) {
            tokens.push({
                type: "number",
                value: Number(number[0])
            });

            position += number[0].length;
            continue;
        }

        const identifier = remaining.match(/^[a-zA-Z]+/);

        if (identifier) {
            tokens.push({
                type: "identifier",
                value: identifier[0].toLowerCase()
            });

            position += identifier[0].length;
            continue;
        }

        const character = input[position];

        if ("+-*/^()%!".includes(character)) {
            tokens.push({
                type: "operator",
                value: character
            });

            position++;
            continue;
        }

        throw new Error("Invalid character");
    }

    return tokens;
}


// =====================================
// MATHEMATICAL FUNCTIONS
// =====================================

function factorial(number) {
    if (
        !Number.isInteger(number) ||
        number < 0 ||
        number > 170
    ) {
        throw new Error("Invalid factorial");
    }

    let answer = 1;

    for (let i = 2; i <= number; i++) {
        answer *= i;
    }

    return answer;
}


function toRadians(number) {
    return angleMode === "DEG"
        ? number * Math.PI / 180
        : number;
}


function fromRadians(number) {
    return angleMode === "DEG"
        ? number * 180 / Math.PI
        : number;
}


function scientificFunction(name, number) {
    switch (name) {
        case "sin":
            return Math.sin(toRadians(number));

        case "cos":
            return Math.cos(toRadians(number));

        case "tan":
            return Math.tan(toRadians(number));

        case "asin":
            return fromRadians(Math.asin(number));

        case "acos":
            return fromRadians(Math.acos(number));

        case "atan":
            return fromRadians(Math.atan(number));

        case "sqrt":
            return Math.sqrt(number);

        case "log":
            return Math.log10(number);

        case "ln":
            return Math.log(number);

        case "abs":
            return Math.abs(number);

        case "exp":
            return Math.exp(number);

        default:
            throw new Error("Unknown function");
    }
}


// =====================================
// EXPRESSION PARSER
// =====================================

function evaluateExpression(input) {
    const tokens = tokenize(input);

    let index = 0;

    function peek() {
        return tokens[index];
    }

    function consume(value) {
        const token = peek();

        if (!token || token.value !== value) {
            throw new Error("Invalid expression");
        }

        index++;

        return token;
    }

    function startsPrimary() {
        const token = peek();

        if (!token) return false;

        return (
            token.type === "number" ||
            token.type === "identifier" ||
            token.value === "("
        );
    }

    function parseExpression() {
        let value = parseTerm();

        while (
            peek() &&
            ["+", "-"].includes(peek().value)
        ) {
            const operator = peek().value;

            index++;

            const right = parseTerm();

            value = operator === "+"
                ? value + right
                : value - right;
        }

        return value;
    }

    function parseTerm() {
        let value = parseUnary();

        while (peek()) {
            const operator = peek().value;

            if (operator === "*" || operator === "/") {
                index++;

                const right = parseUnary();

                value = operator === "*"
                    ? value * right
                    : value / right;

            } else if (startsPrimary()) {
                value *= parseUnary();

            } else {
                break;
            }
        }

        return value;
    }

    function parseUnary() {
        if (peek() && peek().value === "+") {
            index++;
            return parseUnary();
        }

        if (peek() && peek().value === "-") {
            index++;
            return -parseUnary();
        }

        return parsePower();
    }

    function parsePower() {
        let value = parsePostfix();

        if (peek() && peek().value === "^") {
            index++;
            value = Math.pow(value, parseUnary());
        }

        return value;
    }

    function parsePostfix() {
        let value = parsePrimary();

        while (
            peek() &&
            ["%", "!"].includes(peek().value)
        ) {
            const operator = peek().value;

            index++;

            if (operator === "%") value /= 100;

            if (operator === "!") value = factorial(value);
        }

        return value;
    }

    function parsePrimary() {
        const token = peek();

        if (!token) {
            throw new Error("Incomplete expression");
        }

        if (token.type === "number") {
            index++;
            return token.value;
        }

        if (token.value === "(") {
            index++;

            const value = parseExpression();

            consume(")");

            return value;
        }

        if (token.type === "identifier") {
            index++;

            const name = token.value;

            if (name === "pi") return Math.PI;

            if (name === "e") return Math.E;

            if (peek() && peek().value === "(") {
                index++;

                const argument = parseExpression();

                consume(")");

                return scientificFunction(name, argument);
            }

            throw new Error("Unknown function");
        }

        throw new Error("Invalid expression");
    }

    if (!tokens.length) {
        throw new Error("Empty expression");
    }

    const answer = parseExpression();

    if (index !== tokens.length) {
        throw new Error("Invalid expression");
    }

    if (!Number.isFinite(answer)) {
        throw new Error("Math error");
    }

    return answer;
}


// =====================================
// INSERT VALUES
// =====================================

function insertValue(value) {
    if (finished) {
        if (
            ["+", "-", "*", "/", "^", "%", "!"].includes(value)
        ) {
            finished = false;
        } else {
            expression = "";
            previous.textContent = "";
            finished = false;
        }
    }

    if (result.value === "Error") {
        expression = "";
    }

    expression += value;

    updateDisplay();

    playSound();
}


// =====================================
// CLEAR AND DELETE
// =====================================

function clearCalculator() {
    expression = "";

    finished = false;

    previous.textContent = "";

    statusMessage.textContent = "";

    updateDisplay();
}


function deleteLast() {
    if (finished) {
        clearCalculator();
        return;
    }

    expression = expression.slice(0, -1);

    updateDisplay();
}


// =====================================
// CALCULATE
// =====================================

function calculate() {
    if (!expression) return;

    const originalExpression = expression;

    try {
        const answer = evaluateExpression(expression);

        lastResult = answer;

        const formattedAnswer = formatNumber(answer);

        previous.textContent = originalExpression + " =";

        expression = formattedAnswer;

        finished = true;

        addHistory(originalExpression, formattedAnswer);

        updateDisplay();

        playSound();

    } catch (error) {
        result.value = "Error";

        showMessage(error.message);

        expression = "";

        finished = false;
    }
}


// =====================================
// MEMORY FUNCTIONS
// =====================================

function getCurrentValue() {
    if (finished) return lastResult;

    if (!expression) return 0;

    return evaluateExpression(expression);
}


function updateMemory() {
    saveStorage("calcMemory", memory);

    updateDisplay();
}


function memoryClear() {
    memory = 0;

    updateMemory();

    showMessage("Memory cleared");
}


function memoryRecall() {
    if (finished) {
        expression = "";

        previous.textContent = "";

        finished = false;
    }

    expression += formatNumber(memory);

    updateDisplay();

    showMessage("Memory recalled");
}


function memoryAdd() {
    try {
        memory += getCurrentValue();

        updateMemory();

        showMessage("Added to memory");

    } catch {
        showMessage("Invalid memory operation");
    }
}


function memorySubtract() {
    try {
        memory -= getCurrentValue();

        updateMemory();

        showMessage("Subtracted from memory");

    } catch {
        showMessage("Invalid memory operation");
    }
}


// =====================================
// HISTORY
// =====================================

function addHistory(expressionValue, answer) {
    history.unshift({
        expression: expressionValue,
        answer: answer,
        time: new Date().toLocaleString()
    });

    history = history.slice(0, 100);

    saveStorage(
        "calcHistory",
        JSON.stringify(history)
    );

    renderHistory();
}


function renderHistory() {
    const list = document.getElementById("history-list");

    list.innerHTML = "";

    if (!history.length) {
        const empty = document.createElement("div");

        empty.className = "empty-history";

        const icon = document.createElement("span");
        icon.textContent = "🕘";

        const message = document.createElement("p");
        message.textContent = "No calculations yet";

        empty.append(icon, message);

        list.appendChild(empty);

        return;
    }

    history.forEach(item => {
        const button = document.createElement("button");

        button.className = "history-item";

        const expressionText = document.createElement("span");

        expressionText.className = "history-expression";

        expressionText.textContent = item.expression + " =";

        const answerText = document.createElement("span");

        answerText.className = "history-answer";

        answerText.textContent = item.answer;

        button.append(expressionText, answerText);

        button.addEventListener("click", () => {
            expression = item.expression;

            finished = false;

            updateDisplay();

            closePanels();

            showMessage("Calculation restored");
        });

        list.appendChild(button);
    });
}


document.getElementById("clear-history")
    .addEventListener("click", () => {

        history = [];

        saveStorage("calcHistory", JSON.stringify(history));

        renderHistory();

        showMessage("History cleared");
    });


// =====================================
// ANGLE MODE
// =====================================

document.getElementById("angle-toggle")
    .addEventListener("click", () => {

        angleMode = angleMode === "DEG" ? "RAD" : "DEG";

        saveStorage("calcAngle", angleMode);

        updateDisplay();

        showMessage("Angle mode: " + angleMode);

        playSound();
    });


// =====================================
// BUTTON EVENTS
// =====================================

document.querySelectorAll(
    ".buttons button, .scientific-buttons button, .memory-buttons button"
).forEach(button => {

    button.addEventListener("click", () => {
        const value = button.dataset.insert;

        const action = button.dataset.action;

        if (value !== undefined) {
            insertValue(value);
            return;
        }

        switch (action) {
            case "clear":
                clearCalculator();
                playSound();
                break;

            case "delete":
                deleteLast();
                playSound();
                break;

            case "calculate":
                calculate();
                break;

            case "memory-clear":
                memoryClear();
                playSound();
                break;

            case "memory-recall":
                memoryRecall();
                playSound();
                break;

            case "memory-add":
                memoryAdd();
                playSound();
                break;

            case "memory-subtract":
                memorySubtract();
                playSound();
                break;
        }
    });

});


// =====================================
// KEYBOARD SUPPORT
// =====================================

document.addEventListener("keydown", event => {
    const key = event.key;

    if (/^[0-9.]$/.test(key)) {
        insertValue(key);

    } else if (
        ["+", "-", "*", "/", "^", "%", "(", ")", "!"].includes(key)
    ) {
        insertValue(key);

    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();

    } else if (key === "Backspace") {
        deleteLast();

    } else if (key === "Escape") {
        if (!historyPanel.hidden || !scientificPanel.hidden) {
            closePanels();
        } else {
            clearCalculator();
        }
    }
});


// =====================================
// INITIALIZE
// =====================================

function initializeCalculator() {
    updateDisplay();

    updateThemeButton();

    updateSoundButton();

    renderHistory();

    closePanels();

    console.log("Calculator Pro ready!");
}

initializeCalculator();
