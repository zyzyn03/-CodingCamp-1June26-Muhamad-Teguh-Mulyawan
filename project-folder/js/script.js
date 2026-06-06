// =======================
// TIME & GREETING
// =======================

function updateTime() {
    const now = new Date();

    document.getElementById("time").textContent =
        now.toLocaleTimeString();

    document.getElementById("date").textContent =
        now.toDateString();

    const hour = now.getHours();
    let greetingText = "";

    if (hour < 12) greetingText = "Good Morning";
    else if (hour < 18) greetingText = "Good Afternoon";
    else greetingText = "Good Evening";

    const name = localStorage.getItem("username");
    if (name) greetingText += ", " + name;

    document.getElementById("greeting").textContent = greetingText;
}

setInterval(updateTime, 1000);
updateTime();

function saveName() {
    const name = document.getElementById("nameInput").value;
    localStorage.setItem("username", name);
    updateTime();
}

// =======================
// DARK MODE
// =======================

function toggleTheme() {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme",
        document.body.classList.contains("dark") ? "dark" : "light"
    );
}

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
}

// =======================
// TIMER
// =======================

let timer;
let timeLeft = 1500;

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById("timer").textContent =
        `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function startTimer() {
    if (timer) return;
    timer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timer);
    timer = null;
}

function resetTimer() {
    stopTimer();
    timeLeft = 1500;
    updateTimerDisplay();
}

updateTimerDisplay();

// =======================
// TODO LIST
// =======================

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    tasks.forEach((task, index) => {
        const li = document.createElement("li");

        const span = document.createElement("span");
        span.textContent = task.text;
        if (task.done) span.classList.add("done");
        span.onclick = () => toggleTask(index);

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.onclick = () => editTask(index);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => deleteTask(index);

        li.appendChild(span);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
}

function addTask() {
    const input = document.getElementById("taskInput");
    const text = input.value.trim();

    if (!text) return;

    if (tasks.some(task => task.text === text)) {
        alert("Task already exists!");
        return;
    }

    tasks.push({ text: text, done: false });
    saveTasks();
    renderTasks();
    input.value = "";
}

function toggleTask(index) {
    tasks[index].done = !tasks[index].done;
    saveTasks();
    renderTasks();
}

function editTask(index) {
    const newText = prompt("Edit task:", tasks[index].text);
    if (newText) {
        tasks[index].text = newText;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

renderTasks();

// =======================
// QUICK LINKS
// =======================

let links = JSON.parse(localStorage.getItem("links")) || [];

function saveLinks() {
    localStorage.setItem("links", JSON.stringify(links));
}

function renderLinks() {
    const container = document.getElementById("linksContainer");
    container.innerHTML = "";

    links.forEach((link, index) => {
        const btn = document.createElement("button");
        btn.textContent = link.name;
        btn.onclick = () => window.open(link.url, "_blank");

        container.appendChild(btn);
    });
}

function addLink() {
    const name = document.getElementById("linkName").value;
    const url = document.getElementById("linkURL").value;

    if (!name || !url) return;

    links.push({ name, url });
    saveLinks();
    renderLinks();

    document.getElementById("linkName").value = "";
    document.getElementById("linkURL").value = "";
}

renderLinks();