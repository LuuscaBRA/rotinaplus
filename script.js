// Estado inicial do jogador
let player = {
    level: 1,
    xp: 0,
    lifecash: 0,
    streak: 4
};

// Carrega dados salvos (se existirem)
const savedData = localStorage.getItem('levelup_data');
if (savedData) {
    player = JSON.parse(savedData);
}

// Configuração das Missões Essenciais
const essentialMissions = [
    { name: "🛏️ Levantar da cama", xp: 10, cash: 2 },
    { name: "🚿 Tomar banho", xp: 10, cash: 5 },
    { name: "🍳 Fazer uma refeição", xp: 10, cash: 5 },
    { name: "💧 Beber água", xp: 5, cash: 1 },
    { name: "🧹 Organizar o quarto", xp: 10, cash: 5 }
];

// Calcula quanto XP precisa para o próximo nível (Nível atual * 500)
function getNextLevelXP() {
    return player.level * 500;
}

// Atualiza os textos e barra na tela
function updateUI() {
    const nextLevelXP = getNextLevelXP();
    
    document.getElementById('level').innerText = player.level;
    document.getElementById('xp').innerText = player.xp;
    document.getElementById('xp-next').innerText = nextLevelXP;
    document.getElementById('lifecash').innerText = player.lifecash;
    document.getElementById('streak').innerText = player.streak;

    // Calcula a porcentagem da barra de XP
    const percentage = (player.xp / nextLevelXP) * 100;
    document.getElementById('xp-fill').style.width = `${Math.min(percentage, 100)}%`;

    // Salva automaticamente no navegador
    localStorage.setItem('levelup_data', JSON.stringify(player));
}

// Função chamada quando uma caixa é marcada
function completeTask(checkbox, xpReward, cashReward) {
    if (checkbox.checked) {
        player.xp += xpReward;
        player.lifecash += cashReward;

        // Verifica se subiu de nível
        if (player.xp >= getNextLevelXP()) {
            player.xp -= getNextLevelXP(); // Guarda o XP que sobrou
            player.level += 1;
            alert(`🎉 PARABÉNS! Você alcançou o Nível ${player.level}!`);
        }
        
        updateUI();
    } else {
        // Se desmarcar, remove o XP/Dinheiro
        player.xp -= xpReward;
        player.lifecash -= cashReward;
        // Lógica simples para evitar XP negativo caso desmarque após upar (para o MVP)
        if(player.xp < 0) player.xp = 0; 
        updateUI();
    }
}

// Renderiza a lista de missões dinamicamente
function renderMissions() {
    const container = document.getElementById('essential-missions');
    container.innerHTML = ''; // Limpa

    essentialMissions.forEach((mission, index) => {
        const item = document.createElement('label');
        item.className = 'mission-item';
        item.innerHTML = `
            <input type="checkbox" onchange="completeTask(this, ${mission.xp}, ${mission.cash})">
            <span class="task-name">${mission.name}</span>
            <span class="reward">+${mission.xp} XP</span>
        `;
        container.appendChild(item);
    });
}

// Modo sobrevivência
function activateSurvivalMode() {
    alert("Modo Sobrevivência Ativado.\nAs regras mudaram hoje. Faça apenas o básico. Sua sequência está segura e você não sofrerá penalidades. Respire.");
    // Aqui no futuro podemos mudar as cores da tela e limpar as missões pesadas
}

// Inicializa o app
renderMissions();
updateUI();