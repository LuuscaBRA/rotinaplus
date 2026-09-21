let player = { level: 1, xp: 0, lifecash: 0, streak: 4, tasksCompleted: 0 };

const savedData = localStorage.getItem('levelup_data');
if (savedData) player = JSON.parse(savedData);

// Missões divididas por turno e com dificuldade (hard: true = some no modo sobrevivência)
const missions = {
    morning: [
        { id: "m1", name: "🛏️ Levantar da cama", xp: 10, cash: 2, hard: false },
        { id: "m2", name: "💧 Beber água", xp: 5, cash: 1, hard: false },
        { id: "m3", name: "🧹 Arrumar o quarto", xp: 15, cash: 5, hard: true }
    ],
    afternoon: [
        { id: "a1", name: "🍽️ Almoçar bem", xp: 10, cash: 5, hard: false },
        { id: "a2", name: "🎯 Tarefa Principal", xp: 50, cash: 20, hard: true },
        { id: "a3", name: "🏃 Exercício", xp: 30, cash: 15, hard: true }
    ],
    evening: [
        { id: "e1", name: "🚿 Tomar banho", xp: 10, cash: 5, hard: false },
        { id: "e2", name: "🍽️ Jantar", xp: 10, cash: 5, hard: false },
        { id: "e3", name: "❤️ Momento pessoal", xp: 20, cash: 10, hard: true }
    ]
};

const achievements = [
    { id: "ach1", icon: "🥇", title: "PRIMEIRO PASSO", req: 1 },
    { id: "ach2", icon: "🧹", title: "SENHOR DA CASA", req: 10 },
    { id: "ach3", icon: "🔥", title: "7 DIAS SEGUIDOS", req: 50 } // Fictício para MVP
];

function getNextLevelXP() { return player.level * 500; }

function updateUI() {
    document.getElementById('level').innerText = player.level;
    document.getElementById('xp').innerText = player.xp;
    document.getElementById('xp-next').innerText = getNextLevelXP();
    document.getElementById('lifecash').innerText = player.lifecash;
    document.getElementById('streak').innerText = player.streak;

    const percentage = (player.xp / getNextLevelXP()) * 100;
    document.getElementById('xp-fill').style.width = `${Math.min(percentage, 100)}%`;

    localStorage.setItem('levelup_data', JSON.stringify(player));
    renderAchievements(); // Atualiza as conquistas
}

function completeTask(checkbox, xpReward, cashReward) {
    if (checkbox.checked) {
        player.xp += xpReward;
        player.lifecash += cashReward;
        player.tasksCompleted = (player.tasksCompleted || 0) + 1;

        if (player.xp >= getNextLevelXP()) {
            player.xp -= getNextLevelXP();
            player.level += 1;
            alert(`🎉 NÍVEL UP! Você alcançou o Nível ${player.level}!`);
        }
    } else {
        player.xp -= xpReward;
        player.lifecash -= cashReward;
        player.tasksCompleted -= 1;
        if(player.xp < 0) player.xp = 0; 
    }
    updateUI();
}

function renderMissionList(missionArray, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    missionArray.forEach(mission => {
        const cssClass = mission.hard ? "mission-item hard-mission" : "mission-item";
        container.innerHTML += `
            <label class="${cssClass}">
                <input type="checkbox" onchange="completeTask(this, ${mission.xp}, ${mission.cash})">
                <span class="task-name">${mission.name}</span>
                <span class="reward">+${mission.xp} XP</span>
            </label>
        `;
    });
}

function renderAchievements() {
    const container = document.getElementById('achievements-grid');
    container.innerHTML = '';
    achievements.forEach(ach => {
        // Lógica simples: se concluiu o número de tarefas necessário, desbloqueia
        const isUnlocked = (player.tasksCompleted || 0) >= ach.req; 
        const cssClass = isUnlocked ? "achievement-card unlocked" : "achievement-card";
        container.innerHTML += `
            <div class="${cssClass}">
                <div class="ach-icon">${ach.icon}</div>
                <div class="ach-title">${ach.title}</div>
            </div>
        `;
    });
}

function toggleSurvivalMode() {
    const toggle = document.getElementById('survival-toggle');
    const app = document.getElementById('app');
    const quote = document.getElementById('daily-quote');

    if (toggle.checked) {
        app.classList.add('survival-active');
        quote.innerText = "Modo Sobrevivência: Faça apenas o básico. Respire. Tudo bem descansar.";
    } else {
        app.classList.remove('survival-active');
        quote.innerText = "Um passo de cada vez. Você consegue.";
    }
}

// Inicializa tudo
renderMissionList(missions.morning, 'morning-missions');
renderMissionList(missions.afternoon, 'afternoon-missions');
renderMissionList(missions.evening, 'evening-missions');
updateUI();