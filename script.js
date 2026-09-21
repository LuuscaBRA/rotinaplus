const today = new Date().toLocaleDateString('pt-BR');

let player = {
    level: 1, xp: 0, lifecash: 0, streak: 0,
    modoLeve: false, currentTab: 'morning',
    tasksCompleted: [],
    lastLoginDate: today,
    dailyMissions: null,
    customMissions: [] // NOVO: Guarda as missões criadas pelo usuário
};

const savedData = localStorage.getItem('levelup_data_v2');
if (savedData) {
    player = { ...player, ...JSON.parse(savedData) }; // Garante que customMissions exista
    if (player.lastLoginDate !== today) {
        player.lastLoginDate = today;
        player.tasksCompleted = [];
        player.dailyMissions = null; 
    }
}

// EFEITOS SONOROS
let audioCtx;
function playDing() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
}

// BANCO DE MISSÕES PADRÕES
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

// Adicionados Estudos e Exercícios no Sorteio Padrão!
const randomPool = {
    morning: [
        { id: "r_m1", title: "Arrumar a cama", category: "ambiente", xp: 10, coin: 5, hard: false },
        { id: "r_m2", title: "Alongamento de 5 min", category: "corpo", xp: 15, coin: 5, hard: true },
        { id: "r_m3", title: "Ler 10 páginas", category: "mente", xp: 20, coin: 10, hard: true },
        { id: "r_m4", title: "Fazer um café/chá com calma", category: "lazer", xp: 10, coin: 5, hard: false }
    ],
    afternoon: [
        { id: "r_a1", title: "Focar na missão principal", category: "trabalho/estudo", xp: 50, coin: 20, hard: true },
        { id: "r_a2", title: "Limpar a mesa de trabalho", category: "ambiente", xp: 15, coin: 5, hard: false },
        { id: "r_a3", title: "Estudar ou ler um artigo da área", category: "mente", xp: 30, coin: 15, hard: true }, // ESTUDO
        { id: "r_a4", title: "Treino / Exercício Físico", category: "corpo", xp: 35, coin: 15, hard: true } // EXERCÍCIO
    ],
    evening: [
        { id: "r_n1", title: "Desconectar do ecrã 1h antes de dormir", category: "mente", xp: 20, coin: 10, hard: true },
        { id: "r_n2", title: "Assistir a um filme ou série", category: "lazer", xp: 15, coin: 5, hard: false },
        { id: "r_n3", title: "Arrumar a roupa de amanhã", category: "organização", xp: 10, coin: 5, hard: false },
        { id: "r_n4", title: "Conversar com alguém", category: "social", xp: 20, coin: 10, hard: false }
    ]
};

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

function getRandomMissions(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Mescla as missões Padrão com as Personalizadas do usuário
function generateDailyMissions() {
    if (!player.dailyMissions) {
        
        // Filtra as personalizadas do usuário por turno e tipo
        const getCustomEss = (turn) => player.customMissions.filter(m => m.type === 'essencial' && m.turn === turn).map(m => ({...m, category: 'essencial', xp: 15, coin: 5, hard: false}));
        const getCustomRand = (turn) => player.customMissions.filter(m => m.type === 'aleatoria' && m.turn === turn).map(m => ({...m, category: 'alternativa', xp: 25, coin: 10, hard: true}));

        player.dailyMissions = {
            morning: [...essentialMissions.morning, ...getCustomEss('morning'), ...getRandomMissions([...randomPool.morning, ...getCustomRand('morning')], 2)],
            afternoon: [...essentialMissions.afternoon, ...getCustomEss('afternoon'), ...getRandomMissions([...randomPool.afternoon, ...getCustomRand('afternoon')], 3)],
            evening: [...essentialMissions.evening, ...getCustomEss('evening'), ...getRandomMissions([...randomPool.evening, ...getCustomRand('evening')], 3)]
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
    document.getElementById('modal-saldo').innerText = player.lifecash;

    const percentage = Math.min((player.xp / nextXP) * 100, 100);
    document.getElementById('xp-fill').style.width = `${percentage}%`;

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
        
        playDing();

        const nextXP = player.level * 100;
        if (player.xp >= nextXP) {
            player.xp -= nextXP;
            player.level++;
            
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            setTimeout(() => { alert(`🎉 Magnífico! Subiu para o Nível ${player.level}!`); }, 600);
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

// LOJA
function abrirLoja() { document.getElementById('loja-modal').classList.add('active'); }
function fecharLoja() { document.getElementById('loja-modal').classList.remove('active'); }
function renderStore() {
    const container = document.getElementById('loja-lista');
    container.innerHTML = '';
    storeItems.forEach(item => {
        const btnClass = player.lifecash >= item.cost ? "btn-comprar pode-comprar" : "btn-comprar";
        container.innerHTML += `
            <div class="loja-item">
                <div class="loja-info"><h3>${item.name}</h3><p>${item.desc}</p></div>
                <button class="${btnClass}" onclick="comprarItem(${item.cost}, '${item.name}')">${item.cost} 🪙</button>
            </div>
        `;
    });
}
function comprarItem(custo, nome) {
    if (player.lifecash >= custo) {
        if (confirm(`Deseja resgatar "${nome}" por ${custo} moedas?`)) {
            player.lifecash -= custo;
            confetti({ particleCount: 50, spread: 40, origin: { y: 0.8 } });
            updateUI();
            alert(`🎉 Recompensa Resgatada: ${nome}! Aproveite, bem merecido.`);
        }
    } else { alert("Ainda não tem moedas suficientes para esta recompensa."); }
}

// SISTEMA DE MISSÕES CUSTOMIZADAS
function abrirConfig() { 
    document.getElementById('config-modal').classList.add('active'); 
    renderConfigList();
}

function fecharConfig() { 
    document.getElementById('config-modal').classList.remove('active'); 
}

function renderConfigList() {
    const container = document.getElementById('lista-missoes-custom');
    container.innerHTML = '';
    
    if(!player.customMissions || player.customMissions.length === 0) {
        container.innerHTML = '<p style="color:#8e8e93; font-size:0.8rem;">Nenhuma missão personalizada ainda.</p>';
        return;
    }

    player.customMissions.forEach(m => {
        const turnoStr = m.turn === 'morning' ? 'Manhã' : m.turn === 'afternoon' ? 'Tarde' : 'Noite';
        const tipoStr = m.type === 'essencial' ? '⭐ Essencial' : '🎲 Alternativa';
        container.innerHTML += `
            <div class="custom-mission-item">
                <div class="custom-mission-info">
                    <h4>${m.title}</h4>
                    <span>${tipoStr} • ${turnoStr}</span>
                </div>
                <button class="btn-del" onclick="removerMissaoCustomizada('${m.id}')" title="Excluir">X</button>
            </div>
        `;
    });
}

function adicionarMissaoCustomizada() {
    const inputNome = document.getElementById('nova-missao-nome');
    const nome = inputNome.value.trim();
    const tipo = document.getElementById('nova-missao-tipo').value;
    const turno = document.getElementById('nova-missao-turno').value;

    if (!nome) return alert("Digite o nome da missão!");

    const novaMissao = {
        id: 'c_' + Date.now(),
        title: nome,
        type: tipo,
        turn: turno
    };

    player.customMissions.push(novaMissao);
    
    // Se for essencial, já insere na lista de hoje imediatamente para o utilizador ver
    if (tipo === 'essencial') {
        player.dailyMissions[turno].push({
            ...novaMissao, category: 'essencial', xp: 15, coin: 5, hard: false
        });
    }

    inputNome.value = '';
    updateUI();
    renderConfigList();
    alert("Missão adicionada com sucesso!");
}

function removerMissaoCustomizada(id) {
    if(confirm("Tem certeza que deseja apagar essa missão personalizada?")) {
        player.customMissions = player.customMissions.filter(m => m.id !== id);
        
        // Remove do dia atual caso ela não tenha sido concluída ainda
        Object.keys(player.dailyMissions).forEach(turno => {
            player.dailyMissions[turno] = player.dailyMissions[turno].filter(m => m.id !== id);
        });
        
        updateUI();
        renderConfigList();
    }
}

document.getElementById('current-date').innerText = today;
generateDailyMissions();
updateUI();