// Data de Hoje
const today = new Date().toLocaleDateString('pt-BR');

// Estado Padrão do Jogador
let player = {
    level: 1, xp: 0, lifecash: 0, streak: 0,
    modoLeve: false, currentTab: 'morning',
    tasksCompleted: [],
    lastLoginDate: today,
    dailyMissions: null // Vai guardar o sorteio do dia
};

// Carregar dados salvos
const savedData = localStorage.getItem('levelup_data_v2');
if (savedData) {
    player = JSON.parse(savedData);
    // Se mudou o dia, zera as tarefas e sorteia novas
    if (player.lastLoginDate !== today) {
        player.lastLoginDate = today;
        player.tasksCompleted = [];
        player.dailyMissions = null; // Força novo sorteio
        // Lógica de sequência (streak) pode ser refinada no futuro
    }
}

// ==========================================
// BANCO DE MISSÕES
// ==========================================

// 7 Missões Fixas (Essenciais) - 3 Manhã, 2 Tarde, 2 Noite
const essentialMissions = {
    morning: [
        { id: "e_m1", title: "Levantar da cama", category: "essencial", xp: 10, coin: 2, hard: false },
        { id: "e_m2", title: "Beber água", category: "essencial", xp: 5, coin: 1, hard: false },
        { id: "e_m3", title: "Tomar banho e se arrumar", category: "essencial", xp: 10, coin: 3, hard: false }
    ],
    afternoon: [
        { id: "e_a1", title: "Fazer uma refeição nutritiva", category: "essencial", xp: 10, coin: 5, hard: false },
        { id: "e_a2", title: "Definir a missão principal", category: "organização", xp: 15, coin: 5, hard: false }
    ],
    evening: [
        { id: "e_n1", title: "Jantar", category: "essencial", xp: 10, coin: 5, hard: false },
        { id: "e_n2", title: "Escovar os dentes", category: "essencial", xp: 5, coin: 2, hard: false }
    ]
};

// Missões Aleatórias - O sistema sorteia algumas destas para preencher o dia
const randomPool = {
    morning: [
        { id: "r_m1", title: "Arrumar a cama", category: "ambiente", xp: 10, coin: 5, hard: false },
        { id: "r_m2", title: "Alongamento de 5 min", category: "corpo", xp: 15, coin: 5, hard: true },
        { id: "r_m3", title: "Ler 10 páginas", category: "mente", xp: 20, coin: 10, hard: true },
        { id: "r_m4", title: "Fazer um café/chá com calma", category: "lazer", xp: 10, coin: 5, hard: false },
        { id: "r_m5", title: "Meditar por 5 min", category: "mente", xp: 15, coin: 10, hard: true }
    ],
    afternoon: [
        { id: "r_a1", title: "Focar na missão principal", category: "trabalho/estudo", xp: 50, coin: 20, hard: true },
        { id: "r_a2", title: "Beber água (tarde)", category: "corpo", xp: 5, coin: 2, hard: false },
        { id: "r_a3", title: "Limpar a mesa de trabalho", category: "ambiente", xp: 15, coin: 5, hard: false },
        { id: "r_a4", title: "Ouvir um podcast inspirador", category: "mente", xp: 10, coin: 5, hard: false },
        { id: "r_a5", title: "Resolver pendência chata", category: "organização", xp: 30, coin: 15, hard: true }
    ],
    evening: [
        { id: "r_n1", title: "Desconectar do celular 1h antes de dormir", category: "mente", xp: 20, coin: 10, hard: true },
        { id: "r_n2", title: "Assistir um filme ou série", category: "lazer", xp: 15, coin: 5, hard: false },
        { id: "r_n3", title: "Arrumar a roupa de amanhã", category: "organização", xp: 10, coin: 5, hard: false },
        { id: "r_n4", title: "Skincare / Cuidado pessoal", category: "corpo", xp: 15, coin: 5, hard: false },
        { id: "r_n5", title: "Conversar com alguém", category: "social", xp: 20, coin: 10, hard: false }
    ]
};

// Itens da Loja
const storeItems = [
    { id: "s1", name: "Escolher o jantar", desc: "Você decide o que comer hoje", cost: 50 },
    { id: "s2", name: "Pequeno mimo", desc: "Comprar um doce ou algo pequeno", cost: 100 },
    { id: "s3", name: "Pedir comida", desc: "Pedir um delivery especial", cost: 150 },
    { id: "s4", name: "Comprar algo desejado", desc: "Aquele item que estava no carrinho", cost: 250 },
    { id: "s5", name: "Recompensa Maior", desc: "Um presente de você para você", cost: 500 }
];

const achievements = [
    { id: "ac1", icon: "🌱", title: "Primeiro passo", req: 1 },
    { id: "ac2", icon: "🚿", title: "Cuidando de mim", req: 5 },
    { id: "ac3", icon: "🎯", title: "Foco no dia", req: 10 },
    { id: "ac4", icon: "❤️", title: "Conexão", req: 25 },
    { id: "ac5", icon: "🆙", title: "Subindo de nível", req: 50 }
];

// ==========================================
// FUNÇÕES DO SISTEMA
// ==========================================

// Sorteia N missões de um array
function getRandomMissions(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Gera as missões do dia (se ainda não existirem)
function generateDailyMissions() {
    if (!player.dailyMissions) {
        player.dailyMissions = {
            morning: [...essentialMissions.morning, ...getRandomMissions(randomPool.morning, 2)],
            afternoon: [...essentialMissions.afternoon, ...getRandomMissions(randomPool.afternoon, 3)],
            evening: [...essentialMissions.evening, ...getRandomMissions(randomPool.evening, 3)]
        };
        saveData();
    }
}

function saveData() {
    localStorage.setItem('levelup_data_v2', JSON.stringify(player));
}

function getAvatar(level) {
    if (level < 3) return "🥚";
    if (level < 5) return "🐣";
    if (level < 10) return "🐥";
    return "🦅";
}

function updateUI() {
    const nextXP = player.level * 100;
    
    document.getElementById('level').innerText = player.level;
    document.getElementById('avatar').innerText = getAvatar(player.level);
    document.getElementById('xp').innerText = player.xp;
    document.getElementById('xp-next').innerText = nextXP;
    document.getElementById('lifecash').innerText = player.lifecash;
    document.getElementById('streak').innerText = player.streak;
    document.getElementById('modal-saldo').innerText = player.lifecash; // Saldo da loja

    const percentage = Math.min((player.xp / nextXP) * 100, 100);
    document.getElementById('xp-fill').style.width = `${percentage}%`;

    // Atualiza Total de Missões da interface principal
    let totalM = 0;
    Object.values(player.dailyMissions).forEach(arr => totalM += arr.length);
    
    document.getElementById('missions-completed').innerText = player.tasksCompleted.length;
    document.getElementById('missions-total').innerText = totalM;

    renderMissions();
    renderAchievements();
    renderStore();
    saveData();
}

function toggleTask(id, xp, coin) {
    const index = player.tasksCompleted.indexOf(id);
    if (index === -1) {
        player.tasksCompleted.push(id);
        player.xp += xp;
        player.lifecash += coin;

        const nextXP = player.level * 100;
        if (player.xp >= nextXP) {
            player.xp -= nextXP;
            player.level++;
            alert(`🎉 Você subiu para o Nível ${player.level}!`);
        }
    } else {
        player.tasksCompleted.splice(index, 1);
        player.xp = Math.max(0, player.xp - xp);
        player.lifecash = Math.max(0, player.lifecash - coin);
    }
    updateUI();
}

function renderMissions() {
    const container = document.getElementById('missions-container');
    container.innerHTML = '';
    const currentMissions = player.dailyMissions[player.currentTab];

    currentMissions.forEach(m => {
        const isDone = player.tasksCompleted.includes(m.id);
        // Se a categoria NÃO for essencial, recebe classe "nao-essencial" para poder esconder no modo difícil
        const isEssential = m.category === "essencial";
        const cardClass = `mission-card ${isDone ? 'completed' : ''} ${!isEssential ? 'nao-essencial' : ''}`;
        
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
    // Conquistas baseadas no total de tarefas da vida toda
    const totalDoneEver = parseInt(localStorage.getItem('total_tasks_ever') || "0") + player.tasksCompleted.length;
    
    achievements.forEach(ach => {
        const isUnlocked = totalDoneEver >= ach.req;
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

// Dia Difícil - Esconde tudo que não for "Essencial"
function toggleModoLeve() {
    player.modoLeve = !player.modoLeve;
    const btn = document.getElementById('btn-modo-leve');
    
    if (player.modoLeve) {
        document.body.classList.add('modo-leve-ativo');
        btn.innerHTML = "🟢 Dia difícil ativado";
        btn.style.borderColor = "#a3e6b5";
    } else {
        document.body.classList.remove('modo-leve-ativo');
        btn.innerHTML = "🔴 Ativar dia difícil";
        btn.style.borderColor = "transparent";
    }
}

function selectMood(btn) {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// ==========================================
// LOJA DE RECOMPENSAS
// ==========================================

function abrirLoja() {
    document.getElementById('loja-modal').classList.add('active');
}

function fecharLoja() {
    document.getElementById('loja-modal').classList.remove('active');
}

function renderStore() {
    const container = document.getElementById('loja-lista');
    container.innerHTML = '';
    
    storeItems.forEach(item => {
        const podeComprar = player.lifecash >= item.cost;
        const btnClass = podeComprar ? "btn-comprar pode-comprar" : "btn-comprar";
        
        container.innerHTML += `
            <div class="loja-item">
                <div class="loja-info">
                    <h3>${item.name}</h3>
                    <p>${item.desc}</p>
                </div>
                <button class="${btnClass}" onclick="comprarItem(${item.cost}, '${item.name}')">
                    ${item.cost} 🪙
                </button>
            </div>
        `;
    });
}

function comprarItem(custo, nome) {
    if (player.lifecash >= custo) {
        if (confirm(`Deseja resgatar "${nome}" por ${custo} moedas?`)) {
            player.lifecash -= custo;
            updateUI();
            alert(`🎉 Recompensa Resgatada: ${nome}! Aproveite, você mereceu.`);
        }
    } else {
        alert("Ops! Você ainda não tem moedas suficientes para essa recompensa. Continue completando missões!");
    }
}

// Inicializar Tudo
document.getElementById('current-date').innerText = today;
generateDailyMissions();
updateUI();