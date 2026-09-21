// Estado do Jogador
let player = {
    level: 1, xp: 5, lifecash: 3, streak: 0,
    modoLeve: false, currentTab: 'morning',
    tasksCompleted: [] // IDs das tarefas já feitas
};

// Missões idênticas às imagens
const missions = {
    morning: [
        { id: "m1", title: "Levantar da cama", category: "essencial", xp: 10, coin: 5, hard: false },
        { id: "m2", title: "Beber água", category: "essencial", xp: 5, coin: 3, hard: false },
        { id: "m3", title: "Tomar banho e se arrumar", category: "essencial", xp: 10, coin: 5, hard: false },
        { id: "m4", title: "Fazer uma refeição", category: "essencial", xp: 10, coin: 5, hard: false },
        { id: "m5", title: "Definir a missão principal do dia", category: "organização", xp: 15, coin: 5, hard: true }
    ],
    afternoon: [
        { id: "a1", title: "Focar na missão principal", category: "trabalho/estudo", xp: 50, coin: 20, hard: true },
        { id: "a2", title: "Beber água", category: "essencial", xp: 5, coin: 3, hard: false }
    ],
    evening: [
        { id: "e1", title: "Jantar", category: "essencial", xp: 10, coin: 5, hard: false },
        { id: "e2", title: "Desconectar do celular", category: "saúde mental", xp: 20, coin: 10, hard: true }
    ]
};

const achievements = [
    { id: "ac1", icon: "🌱", title: "Primeiro passo", req: 1 },
    { id: "ac2", icon: "🚿", title: "Cuidando de mim", req: 5 },
    { id: "ac3", icon: "🎯", title: "Foco no dia", req: 10 },
    { id: "ac4", icon: "❤️", title: "Conexão", req: 15 },
    { id: "ac5", icon: "🎨", title: "Vida fora das obrigações", req: 20 },
    { id: "ac6", icon: "🔥", title: "Uma semana", req: 30 },
    { id: "ac7", icon: "🆙", title: "Subindo de nível", req: 50 }
];

// Evolução do Ovinho
function getAvatar(level) {
    if (level < 3) return "🥚"; // Nível 1 a 2
    if (level < 5) return "🐣"; // Nível 3 a 4
    if (level < 10) return "🐥"; // Nível 5 a 9
    return "🦅"; // Nível 10+ (Fênix)
}

function updateUI() {
    const nextXP = player.level * 100;
    
    document.getElementById('level').innerText = player.level;
    document.getElementById('avatar').innerText = getAvatar(player.level);
    document.getElementById('xp').innerText = player.xp;
    document.getElementById('xp-next').innerText = nextXP;
    document.getElementById('lifecash').innerText = player.lifecash;
    document.getElementById('streak').innerText = player.streak;

    const percentage = Math.min((player.xp / nextXP) * 100, 100);
    document.getElementById('xp-fill').style.width = `${percentage}%`;

    // Atualiza contagem de missões
    const totalMissions = missions.morning.length + missions.afternoon.length + missions.evening.length;
    document.getElementById('missions-completed').innerText = player.tasksCompleted.length;
    document.getElementById('missions-total').innerText = totalMissions;

    renderMissions();
    renderAchievements();
}

function toggleTask(id, xp, coin) {
    const index = player.tasksCompleted.indexOf(id);
    if (index === -1) {
        // Concluir tarefa
        player.tasksCompleted.push(id);
        player.xp += xp;
        player.lifecash += coin;

        // Subir de nível
        const nextXP = player.level * 100;
        if (player.xp >= nextXP) {
            player.xp -= nextXP;
            player.level++;
            alert(`🎉 Você subiu para o Nível ${player.level}!`);
        }
    } else {
        // Desmarcar tarefa
        player.tasksCompleted.splice(index, 1);
        player.xp = Math.max(0, player.xp - xp);
        player.lifecash = Math.max(0, player.lifecash - coin);
    }
    updateUI();
}

function renderMissions() {
    const container = document.getElementById('missions-container');
    container.innerHTML = '';
    const currentMissions = missions[player.currentTab];

    currentMissions.forEach(m => {
        const isDone = player.tasksCompleted.includes(m.id);
        const cardClass = `mission-card ${isDone ? 'completed' : ''} ${m.hard ? 'hard' : ''}`;
        
        container.innerHTML += `
            <div class="${cardClass}" onclick="toggleTask('${m.id}', ${m.xp}, ${m.coin})">
                <div class="checkbox-wrapper"><div class="custom-checkbox"></div></div>
                <div class="mission-info">
                    <div class="mission-title">${m.title}</div>
                    <div class="mission-category">${m.category}</div>
                </div>
                <div class="mission-rewards">
                    <div class="reward-xp">+${m.xp} XP</div>
                    <div class="reward-coin">+${m.coin} 🪙</div>
                </div>
            </div>
        `;
    });
}

function renderAchievements() {
    const container = document.getElementById('achievements-container');
    container.innerHTML = '';
    
    achievements.forEach(ach => {
        const isUnlocked = player.tasksCompleted.length >= ach.req;
        container.innerHTML += `
            <div class="ach-card ${isUnlocked ? 'unlocked' : ''}">
                <div class="ach-icon">${ach.icon}</div>
                <div class="ach-info">
                    <div class="ach-title">${ach.title}</div>
                    <div class="ach-status">${isUnlocked ? 'Desbloqueada' : 'Ainda bloqueada'}</div>
                </div>
            </div>
        `;
    });
}

function switchTab(tabId) {
    player.currentTab = tabId;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    renderMissions();
}

function toggleModoLeve() {
    player.modoLeve = !player.modoLeve;
    const btn = document.getElementById('btn-modo-leve');
    
    if (player.modoLeve) {
        document.body.classList.add('modo-leve-ativo');
        btn.innerHTML = "🟢 Modo leve ativado";
        btn.style.borderColor = "#a3e6b5";
    } else {
        document.body.classList.remove('modo-leve-ativo');
        btn.innerHTML = "🔴 Ativar modo leve";
        btn.style.borderColor = "transparent";
    }
}

function selectMood(btn) {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// Configurar a Data atual
const dateOptions = { weekday: 'short', day: 'numeric', month: 'short' };
document.getElementById('current-date').innerText = new Date().toLocaleDateString('pt-BR', dateOptions).replace('.', '');

// Iniciar app
updateUI();