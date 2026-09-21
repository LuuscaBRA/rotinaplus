const today = new Date().toLocaleDateString('pt-BR');

let player = {
    level: 1, xp: 0, lifecash: 0, streak: 0,
    modoLeve: false, currentTab: 'morning',
    tasksCompleted: [],
    lastLoginDate: today,
    dailyMissions: null,
    customMissions: [], 
    customRewards: [],
    inventory: [], // NOVO: A Mochila
    history: []    // NOVO: Diário de Bordo
};

const savedData = localStorage.getItem('levelup_data_v2');
if (savedData) {
    player = { inventory: [], history: [], customMissions: [], customRewards: [], ...JSON.parse(savedData) }; 
    if (player.lastLoginDate !== today) {
        player.lastLoginDate = today;
        player.tasksCompleted = [];
        player.dailyMissions = null; 
        player.modoLeve = false; // Reseta o dia difícil
    }
}

// ==========================================
// EFEITOS SONOROS
// ==========================================
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

// ==========================================
// BANCOS PADRÕES
// ==========================================
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
        { id: "r_a3", title: "Estudar ou ler um artigo da área", category: "mente", xp: 30, coin: 15, hard: true },
        { id: "r_a4", title: "Treino / Exercício Físico", category: "corpo", xp: 35, coin: 15, hard: true }
    ],
    evening: [
        { id: "r_n1", title: "Desconectar do ecrã 1h antes de dormir", category: "mente", xp: 20, coin: 10, hard: true },
        { id: "r_n2", title: "Assistir a um filme ou série", category: "lazer", xp: 15, coin: 5, hard: false },
        { id: "r_n3", title: "Arrumar a roupa de amanhã", category: "organização", xp: 10, coin: 5, hard: false },
        { id: "r_n4", title: "Conversar com alguém", category: "social", xp: 20, coin: 10, hard: false }
    ]
};

const defaultStoreItems = [
    { id: "s1", name: "Escolher seu jantar favorito", desc: "Você decide o que comer hoje", cost: 50 },
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
// FUNÇÕES PRINCIPAIS E HISTÓRICO
// ==========================================
function getRandomMissions(array, count) {
    return [...array].sort(() => 0.5 - Math.random()).slice(0, count);
}

function generateDailyMissions() {
    if (!player.dailyMissions) {
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

// Retorna ou cria o log de hoje no Diário
function getTodayLog() {
    let log = player.history.find(h => h.date === today);
    if (!log) {
        log = { date: today, mood: '😐', tasksDone: 0 };
        player.history.push(log);
        // Mantém apenas os últimos 14 dias para não pesar o navegador
        if (player.history.length > 14) player.history.shift();
    }
    return log;
}

function selectMood(emoji) {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`mood-${emoji}`).classList.add('active');
    
    // Salva no diário de hoje
    const log = getTodayLog();
    log.mood = emoji;
    saveData();
}

function saveData() { localStorage.setItem('levelup_data_v2', JSON.stringify(player)); }
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
    document.getElementById('xp-fill').style.width = `${Math.min((player.xp / nextXP) * 100, 100)}%`;

    let totalM = 0;
    Object.values(player.dailyMissions).forEach(arr => totalM += arr.length);
    document.getElementById('missions-completed').innerText = player.tasksCompleted.length;
    document.getElementById('missions-total').innerText = totalM;

    // Recuperar humor salvo de hoje, se houver
    const log = getTodayLog();
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    const btnMood = document.getElementById(`mood-${log.mood}`);
    if (btnMood) btnMood.classList.add('active');

    renderMissions();
    renderAchievements();
    renderStore();
    renderMochila();
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
    
    // Atualiza contagem no diário
    const log = getTodayLog();
    log.tasksDone = player.tasksCompleted.length;
    
    updateUI();
}

function renderMissions() {
    const container = document.getElementById('missions-container');
    container.innerHTML = '';
    player.dailyMissions[player.currentTab].forEach(m => {
        const isDone = player.tasksCompleted.includes(m.id);
        const cardClass = `mission-card ${isDone ? 'completed' : ''} ${m.category !== "essencial" ? 'nao-essencial' : ''}`;
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
            </div>`;
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
            </div>`;
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
        btn.innerHTML = "🔴 Dia difícil";
        btn.style.borderColor = "transparent";
    }
}

// ==========================================
// LOJA, MOCHILA E DIÁRIO
// ==========================================
function abrirLoja() { document.getElementById('loja-modal').classList.add('active'); }
function fecharLoja() { document.getElementById('loja-modal').classList.remove('active'); }

function renderStore() {
    const container = document.getElementById('loja-lista');
    container.innerHTML = '';
    const allStoreItems = [...defaultStoreItems, ...player.customRewards];
    allStoreItems.forEach(item => {
        const btnClass = player.lifecash >= item.cost ? "btn-comprar pode-comprar" : "btn-comprar";
        // Passamos o nome e a descrição para guardar na mochila
        container.innerHTML += `
            <div class="loja-item">
                <div class="loja-info"><h3>${item.name}</h3><p>${item.desc || 'Recompensa'}</p></div>
                <button class="${btnClass}" onclick="comprarItem(${item.cost}, '${item.name}', '${item.desc || 'Recompensa'}')">${item.cost} 🪙</button>
            </div>`;
    });
}

function comprarItem(custo, nome, desc) {
    if (player.lifecash >= custo) {
        if (confirm(`Deseja comprar "${nome}" e guardar na sua Mochila por ${custo} moedas?`)) {
            player.lifecash -= custo;
            
            // Adiciona o item à mochila
            player.inventory.push({ id: Date.now(), name: nome, desc: desc });
            
            updateUI();
            alert(`🎒 "${nome}" foi guardado na sua Mochila! Vá até lá quando quiser usar.`);
        }
    } else { alert("Ainda não tem moedas suficientes para esta recompensa."); }
}

// Mochila (Inventário)
function abrirMochila() { document.getElementById('mochila-modal').classList.add('active'); }
function fecharMochila() { document.getElementById('mochila-modal').classList.remove('active'); }

function renderMochila() {
    const container = document.getElementById('mochila-lista');
    container.innerHTML = '';
    if (player.inventory.length === 0) {
        container.innerHTML = '<p style="color:#8e8e93; font-size:0.9rem; text-align:center;">Sua mochila está vazia. Compre algo na loja!</p>';
        return;
    }
    
    player.inventory.forEach((item, index) => {
        container.innerHTML += `
            <div class="loja-item">
                <div class="loja-info"><h3>${item.name}</h3><p>${item.desc}</p></div>
                <button class="btn-usar" onclick="usarItem(${index})">Usar Agora</button>
            </div>`;
    });
}

function usarItem(index) {
    const item = player.inventory[index];
    if (confirm(`Deseja usar/consumir "${item.name}" agora?`)) {
        player.inventory.splice(index, 1);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
        updateUI();
        alert(`✨ Você usou: ${item.name}! Aproveite o seu momento.`);
    }
}

// Diário de Bordo
function abrirDiario() { 
    document.getElementById('diario-modal').classList.add('active'); 
    renderDiario();
}
function fecharDiario() { document.getElementById('diario-modal').classList.remove('active'); }

function renderDiario() {
    const container = document.getElementById('diario-lista');
    container.innerHTML = '';
    // Pega o histórico e inverte para mostrar do mais recente para o mais antigo
    const historicoReverso = [...player.history].reverse();

    historicoReverso.forEach(log => {
        container.innerHTML += `
            <div class="historico-card">
                <div>
                    <div class="historico-data">${log.date}</div>
                    <div class="historico-resumo">${log.tasksDone} missões concluídas</div>
                </div>
                <div class="historico-emoji">${log.mood}</div>
            </div>
        `;
    });
}

// ==========================================
// CONFIGURAÇÕES (MISSÕES E RECOMPENSAS CUSTOM)
// ==========================================
function abrirConfig() { document.getElementById('config-modal').classList.add('active'); renderConfigList(); }
function fecharConfig() { document.getElementById('config-modal').classList.remove('active'); }

function renderConfigList() {
    const listaMissoes = document.getElementById('lista-missoes-custom');
    listaMissoes.innerHTML = '';
    if(!player.customMissions || player.customMissions.length === 0) { listaMissoes.innerHTML = '<p style="color:#8e8e93; font-size:0.8rem;">Nenhuma missão personalizada.</p>'; } else {
        player.customMissions.forEach(m => {
            const turnoStr = m.turn === 'morning' ? 'Manhã' : m.turn === 'afternoon' ? 'Tarde' : 'Noite';
            const tipoStr = m.type === 'essencial' ? '⭐ Ess' : '🎲 Alt';
            listaMissoes.innerHTML += `<div class="custom-item"><div class="custom-info"><h4>${m.title}</h4><span>${tipoStr} • ${turnoStr}</span></div><button class="btn-del" onclick="removerMissaoCustomizada('${m.id}')">X</button></div>`;
        });
    }

    const listaRecs = document.getElementById('lista-recompensas-custom');
    listaRecs.innerHTML = '';
    if(!player.customRewards || player.customRewards.length === 0) { listaRecs.innerHTML = '<p style="color:#8e8e93; font-size:0.8rem;">Nenhuma recompensa personalizada.</p>'; } else {
        player.customRewards.forEach(r => {
            listaRecs.innerHTML += `<div class="custom-item"><div class="custom-info"><h4>${r.name}</h4><span>Custo: ${r.cost} 🪙</span></div><button class="btn-del" onclick="removerRecompensaCustomizada('${r.id}')">X</button></div>`;
        });
    }
}

function adicionarMissaoCustomizada() {
    const nome = document.getElementById('nova-missao-nome').value.trim();
    if (!nome) return alert("Digite o nome da missão!");
    const tipo = document.getElementById('nova-missao-tipo').value;
    const turno = document.getElementById('nova-missao-turno').value;
    const novaMissao = { id: 'cm_' + Date.now(), title: nome, type: tipo, turn: turno };
    player.customMissions.push(novaMissao);
    if (tipo === 'essencial') player.dailyMissions[turno].push({...novaMissao, category: 'essencial', xp: 15, coin: 5, hard: false});
    document.getElementById('nova-missao-nome').value = '';
    updateUI(); renderConfigList();
}
function removerMissaoCustomizada(id) {
    if(confirm("Deseja apagar essa missão personalizada?")) {
        player.customMissions = player.customMissions.filter(m => m.id !== id);
        Object.keys(player.dailyMissions).forEach(t => player.dailyMissions[t] = player.dailyMissions[t].filter(m => m.id !== id));
        updateUI(); renderConfigList();
    }
}
function adicionarRecompensaCustomizada() {
    const nome = document.getElementById('nova-recompensa-nome').value.trim();
    const custo = parseInt(document.getElementById('nova-recompensa-custo').value);
    if (!nome || isNaN(custo) || custo <= 0) return alert("Preencha dados válidos!");
    player.customRewards.push({ id: 'cr_' + Date.now(), name: nome, desc: "Personalizada", cost: custo });
    document.getElementById('nova-recompensa-nome').value = ''; document.getElementById('nova-recompensa-custo').value = '';
    updateUI(); renderConfigList();
}
function removerRecompensaCustomizada(id) {
    if(confirm("Deseja apagar essa recompensa?")) {
        player.customRewards = player.customRewards.filter(r => r.id !== id);
        updateUI(); renderConfigList();
    }
}

document.getElementById('current-date').innerText = today;
generateDailyMissions();
updateUI();