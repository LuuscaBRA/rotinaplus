import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIZTWMmWBu4ipz6AaQ23a08EOcC-tO5z0",
  authDomain: "rotina-plus-c3bd4.firebaseapp.com",
  projectId: "rotina-plus-c3bd4",
  storageBucket: "rotina-plus-c3bd4.firebasestorage.app",
  messagingSenderId: "161674568624",
  appId: "1:161674568624:web:b6e1d61fcaa8c68ca8ec75"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const today = new Date().toLocaleDateString('pt-BR');

let player = {
    nickname: "Jogador",
    level: 1, xp: 0, lifecash: 0, streak: 0,
    modoLeve: false, currentTab: 'morning',
    tasksCompleted: [], lastLoginDate: today,
    dailyMissions: null, customMissions: [], customRewards: [],
    inventory: [], history: []
};

const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const loginMsg = document.getElementById('login-msg');

let modoAtualAuth = 'login'; // 'login' ou 'register'

function setModoAuth(modo) {
    modoAtualAuth = modo;
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('tab-register').classList.remove('active');
    loginMsg.innerText = '';

    if (modo === 'login') {
        document.getElementById('tab-login').classList.add('active');
        document.getElementById('grupo-nick').style.display = 'none';
        document.getElementById('btn-auth').innerText = 'Entrar';
    } else {
        document.getElementById('tab-register').classList.add('active');
        document.getElementById('grupo-nick').style.display = 'block';
        document.getElementById('btn-auth').innerText = 'Criar Nova Conta';
    }
}

async function processarAuth() {
    if (modoAtualAuth === 'login') {
        await realizarLogin();
    } else {
        await realizarCadastro();
    }
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            player = { ...player, ...docSnap.data() };
            if (player.lastLoginDate !== today) {
                player.lastLoginDate = today;
                player.tasksCompleted = [];
                player.dailyMissions = null; 
                player.modoLeve = false;
            }
        } else {
            await salvarNaNuvem();
        }
        
        loginScreen.style.display = 'none';
        mainApp.style.display = 'block';
        document.getElementById('current-date').innerText = today;
        generateDailyMissions();
        updateUI();
    } else {
        loginScreen.style.display = 'flex';
        mainApp.style.display = 'none';
    }
});

async function realizarLogin() {
    const email = document.getElementById('email-input').value.trim();
    const senha = document.getElementById('senha-input').value;
    if (!email || !senha) return loginMsg.innerText = "Preencha todos os campos.";
    
    loginMsg.innerText = "A carregar...";
    try {
        await signInWithEmailAndPassword(auth, email, senha);
    } catch (error) {
        loginMsg.innerText = "Erro: E-mail ou palavra-passe incorretos.";
    }
}

async function realizarCadastro() {
    const apelido = document.getElementById('nick-input').value.trim();
    const email = document.getElementById('email-input').value.trim();
    const senha = document.getElementById('senha-input').value;
    
    if(!apelido || !email || !senha) {
        return loginMsg.innerText = "Por favor, preencha todos os campos.";
    }

    loginMsg.innerText = "A criar conta...";
    try {
        player.nickname = apelido;
        await createUserWithEmailAndPassword(auth, email, senha);
    } catch (error) {
        loginMsg.innerText = "Erro: A palavra-passe precisa de 6 letras ou o e-mail já está em uso.";
    }
}

async function fazerLogout() {
    await signOut(auth);
    fecharConfig();
}

async function salvarNaNuvem() {
    if (auth.currentUser) {
        try {
            await setDoc(doc(db, "users", auth.currentUser.uid), player);
        } catch (e) {
            console.error("Erro ao salvar:", e);
        }
    }
}

let audioCtx;
function playDing() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
}

const essentialMissions = {
    morning: [{ id: "e_m1", title: "Levantar da cama", category: "essencial", xp: 10, coin: 2, hard: false }, { id: "e_m2", title: "Beber água", category: "essencial", xp: 5, coin: 1, hard: false }, { id: "e_m3", title: "Tomar banho", category: "essencial", xp: 10, coin: 3, hard: false }],
    afternoon: [{ id: "e_a1", title: "Fazer uma refeição nutritiva", category: "essencial", xp: 10, coin: 5, hard: false }, { id: "e_a2", title: "Definir missão principal", category: "organização", xp: 15, coin: 5, hard: false }],
    evening: [{ id: "e_n1", title: "Jantar", category: "essencial", xp: 10, coin: 5, hard: false }, { id: "e_n2", title: "Escovar os dentes", category: "essencial", xp: 5, coin: 2, hard: false }]
};

const randomPool = {
    morning: [{ id: "r_m1", title: "Arrumar a cama", category: "ambiente", xp: 10, coin: 5, hard: false }, { id: "r_m2", title: "Alongamento", category: "corpo", xp: 15, coin: 5, hard: true }, { id: "r_m3", title: "Ler 10 páginas", category: "mente", xp: 20, coin: 10, hard: true }, { id: "r_m4", title: "Café com calma", category: "lazer", xp: 10, coin: 5, hard: false }],
    afternoon: [{ id: "r_a1", title: "Focar na missão principal", category: "trabalho/estudo", xp: 50, coin: 20, hard: true }, { id: "r_a3", title: "Estudar/Ler artigo", category: "mente", xp: 30, coin: 15, hard: true }, { id: "r_a4", title: "Exercício Físico", category: "corpo", xp: 35, coin: 15, hard: true }],
    evening: [{ id: "r_n1", title: "Desconectar do ecrã 1h antes", category: "mente", xp: 20, coin: 10, hard: true }, { id: "r_n2", title: "Filme ou série", category: "lazer", xp: 15, coin: 5, hard: false }, { id: "r_n4", title: "Conversar com alguém", category: "social", xp: 20, coin: 10, hard: false }]
};

const defaultStoreItems = [
    { id: "s1", name: "Escolher o seu jantar favorito", desc: "Você decide o que comer hoje", cost: 50 },
    { id: "s2", name: "Pequeno mimo", desc: "Comprar um doce ou algo", cost: 100 },
    { id: "s3", name: "Pedir comida", desc: "Pedir um delivery", cost: 150 },
    { id: "s5", name: "Recompensa Maior", desc: "Um presente para si", cost: 500 }
];

const achievements = [
    { id: "ac1", icon: "🌱", title: "Primeiro passo", req: 1 }, { id: "ac2", icon: "🚿", title: "A cuidar de mim", req: 5 }, { id: "ac3", icon: "🎯", title: "Foco no dia", req: 10 }, { id: "ac5", icon: "🆙", title: "A subir de nível", req: 50 }
];

function getRandomMissions(array, count) { return [...array].sort(() => 0.5 - Math.random()).slice(0, count); }

function generateDailyMissions() {
    if (!player.dailyMissions) {
        const getCustomEss = (turn) => player.customMissions.filter(m => m.type === 'essencial' && m.turn === turn).map(m => ({...m, category: 'essencial', xp: 15, coin: 5, hard: false}));
        const getCustomRand = (turn) => player.customMissions.filter(m => m.type === 'aleatoria' && m.turn === turn).map(m => ({...m, category: 'alternativa', xp: 25, coin: 10, hard: true}));

        player.dailyMissions = {
            morning: [...essentialMissions.morning, ...getCustomEss('morning'), ...getRandomMissions([...randomPool.morning, ...getCustomRand('morning')], 2)],
            afternoon: [...essentialMissions.afternoon, ...getCustomEss('afternoon'), ...getRandomMissions([...randomPool.afternoon, ...getCustomRand('afternoon')], 3)],
            evening: [...essentialMissions.evening, ...getCustomEss('evening'), ...getRandomMissions([...randomPool.evening, ...getCustomRand('evening')], 3)]
        };
        salvarNaNuvem();
    }
}

function getTodayLog() {
    let log = player.history.find(h => h.date === today);
    if (!log) {
        log = { date: today, mood: '😐', tasksDone: 0 };
        player.history.push(log);
        if (player.history.length > 14) player.history.shift();
    }
    return log;
}

function selectMood(emoji) {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`mood-${emoji}`).classList.add('active');
    getTodayLog().mood = emoji;
    salvarNaNuvem();
}

function getAvatar(level) {
    if (level < 3) return "🥚"; if (level < 5) return "🐣"; if (level < 10) return "🐥"; return "🦅";
}

function updateUI() {
    const nextXP = player.level * 100;
    
    document.getElementById('player-nickname').innerText = player.nickname || "Jogador";
    
    document.getElementById('level').innerText = player.level;
    document.getElementById('avatar').innerText = getAvatar(player.level);
    document.getElementById('xp').innerText = player.xp;
    document.getElementById('xp-next').innerText = nextXP;
    document.getElementById('lifecash').innerText = player.lifecash;
    document.getElementById('streak').innerText = player.streak;
    document.getElementById('modal-saldo').innerText = player.lifecash;
    document.getElementById('xp-fill').style.width = `${Math.min((player.xp / nextXP) * 100, 100)}%`;

    let totalM = 0; Object.values(player.dailyMissions).forEach(arr => totalM += arr.length);
    document.getElementById('missions-completed').innerText = player.tasksCompleted.length;
    document.getElementById('missions-total').innerText = totalM;

    const log = getTodayLog();
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    const btnMood = document.getElementById(`mood-${log.mood}`);
    if (btnMood) btnMood.classList.add('active');

    renderMissions(); renderAchievements(); renderStore(); renderMochila();
    salvarNaNuvem();
}

function toggleTask(id, xp, coin) {
    const index = player.tasksCompleted.indexOf(id);
    if (index === -1) {
        player.tasksCompleted.push(id); player.xp += xp; player.lifecash += coin;
        playDing();
        if (player.xp >= player.level * 100) {
            player.xp -= player.level * 100; player.level++;
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            setTimeout(() => { alert(`🎉 Magnífico! Subiu para o Nível ${player.level}!`); }, 600);
        }
    } else {
        player.tasksCompleted.splice(index, 1);
        player.xp = Math.max(0, player.xp - xp); player.lifecash = Math.max(0, player.lifecash - coin);
    }
    getTodayLog().tasksDone = player.tasksCompleted.length;
    updateUI();
}

function renderMissions() {
    const container = document.getElementById('missions-container'); container.innerHTML = '';
    player.dailyMissions[player.currentTab].forEach(m => {
        const isDone = player.tasksCompleted.includes(m.id);
        const cardClass = `mission-card ${isDone ? 'completed' : ''} ${m.category !== "essencial" ? 'nao-essencial' : ''}`;
        container.innerHTML += `<div class="${cardClass}" onclick="toggleTask('${m.id}', ${m.xp}, ${m.coin})"><div class="checkbox-wrapper"><div class="custom-checkbox"></div></div><div class="mission-info"><div class="mission-title">${m.title}</div><div class="mission-category">${m.category}</div></div><div class="mission-rewards"><div class="reward-xp">+${m.xp} XP</div><div class="reward-coin">+${m.coin} 🪙</div></div></div>`;
    });
}

function renderAchievements() {
    const container = document.getElementById('achievements-container'); container.innerHTML = '';
    const totalDoneEver = player.tasksCompleted.length; 
    achievements.forEach(ach => {
        const isUnlocked = totalDoneEver >= ach.req;
        container.innerHTML += `<div class="ach-card ${isUnlocked ? 'unlocked' : ''}"><div class="ach-icon">${ach.icon}</div><div class="ach-info"><div class="ach-title">${ach.title}</div><div class="ach-status">${isUnlocked ? 'Desbloqueada' : 'Ainda bloqueada'}</div></div></div>`;
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
    if (player.modoLeve) { document.body.classList.add('modo-leve-ativo'); btn.innerHTML = "🟢 Dia difícil ativado"; btn.style.borderColor = "#a3e6b5"; } 
    else { document.body.classList.remove('modo-leve-ativo'); btn.innerHTML = "🔴 Dia difícil"; btn.style.borderColor = "transparent"; }
}

function abrirLoja() { document.getElementById('loja-modal').classList.add('active'); }
function fecharLoja() { document.getElementById('loja-modal').classList.remove('active'); }
function abrirMochila() { document.getElementById('mochila-modal').classList.add('active'); }
function fecharMochila() { document.getElementById('mochila-modal').classList.remove('active'); }
function abrirDiario() { document.getElementById('diario-modal').classList.add('active'); renderDiario(); }
function fecharDiario() { document.getElementById('diario-modal').classList.remove('active'); }
function abrirConfig() { document.getElementById('config-modal').classList.add('active'); renderConfigList(); }
function fecharConfig() { document.getElementById('config-modal').classList.remove('active'); }

function renderStore() {
    const container = document.getElementById('loja-lista'); container.innerHTML = '';
    [...defaultStoreItems, ...player.customRewards].forEach(item => {
        const btnClass = player.lifecash >= item.cost ? "btn-comprar pode-comprar" : "btn-comprar";
        container.innerHTML += `<div class="loja-item"><div class="loja-info"><h3>${item.name}</h3><p>${item.desc || 'Recompensa'}</p></div><button class="${btnClass}" onclick="comprarItem(${item.cost}, '${item.name}', '${item.desc || 'Recompensa'}')">${item.cost} 🪙</button></div>`;
    });
}

function comprarItem(custo, nome, desc) {
    if (player.lifecash >= custo) {
        if (confirm(`Comprar "${nome}" por ${custo} moedas e guardar na Mochila?`)) {
            player.lifecash -= custo; player.inventory.push({ id: Date.now(), name: nome, desc: desc });
            updateUI(); alert(`🎒 Guardado na Mochila!`);
        }
    } else { alert("Moedas insuficientes."); }
}

function renderMochila() {
    const container = document.getElementById('mochila-lista'); container.innerHTML = '';
    if (player.inventory.length === 0) return container.innerHTML = '<p style="text-align:center;">A sua mochila está vazia.</p>';
    player.inventory.forEach((item, index) => {
        container.innerHTML += `<div class="loja-item"><div class="loja-info"><h3>${item.name}</h3></div><button class="btn-usar" onclick="usarItem(${index})">Usar Agora</button></div>`;
    });
}

function usarItem(index) {
    if (confirm(`Usar "${player.inventory[index].name}" agora?`)) {
        player.inventory.splice(index, 1);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
        updateUI();
    }
}

function renderDiario() {
    const container = document.getElementById('diario-lista'); container.innerHTML = '';
    [...player.history].reverse().forEach(log => {
        container.innerHTML += `<div class="historico-card"><div><div class="historico-data">${log.date}</div><div class="historico-resumo">${log.tasksDone} missões</div></div><div class="historico-emoji">${log.mood}</div></div>`;
    });
}

function renderConfigList() {
    const lM = document.getElementById('lista-missoes-custom'); lM.innerHTML = '';
    player.customMissions.forEach(m => lM.innerHTML += `<div class="custom-item"><div><h4>${m.title}</h4></div><button class="btn-del" onclick="removerMissaoCustomizada('${m.id}')">X</button></div>`);
    const lR = document.getElementById('lista-recompensas-custom'); lR.innerHTML = '';
    player.customRewards.forEach(r => lR.innerHTML += `<div class="custom-item"><div><h4>${r.name}</h4></div><button class="btn-del" onclick="removerRecompensaCustomizada('${r.id}')">X</button></div>`);
}

function adicionarMissaoCustomizada() {
    const nome = document.getElementById('nova-missao-nome').value.trim(); if (!nome) return;
    const nova = { id: 'cm_' + Date.now(), title: nome, type: document.getElementById('nova-missao-tipo').value, turn: document.getElementById('nova-missao-turno').value };
    player.customMissions.push(nova);
    if (nova.type === 'essencial') player.dailyMissions[nova.turn].push({...nova, category: 'essencial', xp: 15, coin: 5, hard: false});
    document.getElementById('nova-missao-nome').value = ''; updateUI(); renderConfigList();
}
function removerMissaoCustomizada(id) {
    player.customMissions = player.customMissions.filter(m => m.id !== id);
    Object.keys(player.dailyMissions).forEach(t => player.dailyMissions[t] = player.dailyMissions[t].filter(m => m.id !== id));
    updateUI(); renderConfigList();
}
function adicionarRecompensaCustomizada() {
    const nome = document.getElementById('nova-recompensa-nome').value.trim(); const custo = parseInt(document.getElementById('nova-recompensa-custo').value);
    if (!nome || !custo) return;
    player.customRewards.push({ id: 'cr_' + Date.now(), name: nome, desc: "Customizada", cost: custo });
    document.getElementById('nova-recompensa-nome').value = ''; document.getElementById('nova-recompensa-custo').value = ''; updateUI(); renderConfigList();
}
function removerRecompensaCustomizada(id) { player.customRewards = player.customRewards.filter(r => r.id !== id); updateUI(); renderConfigList(); }

window.setModoAuth = setModoAuth; window.processarAuth = processarAuth;
window.fazerLogout = fazerLogout;
window.selectMood = selectMood; window.toggleModoLeve = toggleModoLeve; window.switchTab = switchTab;
window.abrirLoja = abrirLoja; window.fecharLoja = fecharLoja; window.comprarItem = comprarItem;
window.abrirMochila = abrirMochila; window.fecharMochila = fecharMochila; window.usarItem = usarItem;
window.abrirDiario = abrirDiario; window.fecharDiario = fecharDiario;
window.abrirConfig = abrirConfig; window.fecharConfig = fecharConfig;
window.adicionarMissaoCustomizada = adicionarMissaoCustomizada; window.removerMissaoCustomizada = removerMissaoCustomizada;
window.adicionarRecompensaCustomizada = adicionarRecompensaCustomizada; window.removerRecompensaCustomizada = removerRecompensaCustomizada;
window.toggleTask = toggleTask;
