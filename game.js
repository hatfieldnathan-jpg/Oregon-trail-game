// --- CORE GAME STATE ---
let day = 0;
let distance = 0;
let food = 500; // Initial Food
let oxen = 2; // Initial Oxen
let destinationDistance = 2000;
let wagonParts = 1; // Initial Spare Parts
let currentScene = 'initial';

const party = [
    { name: "Leader", health: 100 },
    { name: "Spouse", health: 100 },
    { name: "Child 1", health: 100 },
    { name: "Child 2", health: 100 }
];

// --- GRAPHICS SETUP ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const TILE_SIZE = 30;

// --- SCENE DEFINITIONS ---
const CORE_ACTIONS = {
    'main': {
        text: "You are on the trail. What is your next move?",
        choices: [
            { text: "Travel Forward", action: "travel" },
            { text: "Stop and Hunt", action: "hunt" },
            { text: "Rest for a Day", action: "rest" },
            { text: "Check Supplies", action: "supplies" }
        ]
    },
    'supplies': {
        text: `Current Supplies:\nFood: ${food} lbs\nOxen: ${oxen}\nSpare Parts: ${wagonParts}`,
        choices: [
            { text: "Return to Trail", action: "main" }
        ]
    },
    'broken_wagon': {
        text: "Your wagon is broken! You must repair it before moving on.",
        choices: [
            { text: "Use a Spare Part (1 needed)", action: "repair" },
            { text: "Rest and Wait (DANGER)", action: "rest" }
        ]
    }
};

// --- DRAWING FUNCTIONS (Wagon and Scene) ---
function drawWagon(x, y) {
    // Wheels
    ctx.fillStyle = '#111';
    ctx.fillRect(x - 5, y + TILE_SIZE * 2 - 5, 10, 10);
    ctx.fillRect(x + 95, y + TILE_SIZE * 2 - 5, 10, 10);
    
    // Wagon Body
    ctx.fillStyle = '#654321'; 
    ctx.fillRect(x, y + TILE_SIZE, 100, TILE_SIZE + 5); 
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 5, y + TILE_SIZE + 5, 90, TILE_SIZE - 5);
    
    // Wagon Cover
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(x + 10, y, 5, TILE_SIZE + 10); 
    ctx.fillRect(x + 85, y, 5, TILE_SIZE + 10);
    ctx.fillRect(x + 10, y, 75, TILE_SIZE);
    
    // Oxen
    ctx.fillStyle = '#A0522D';
    if (oxen > 0) ctx.fillRect(x + 105, y + TILE_SIZE * 2, 20, 10);
    if (oxen > 1) ctx.fillRect(x + 130, y + TILE_SIZE * 2, 20, 10);
}

function drawScene() {
    // 1. Setup
    ctx.fillStyle = '#1c2833'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Sky/Horizon
    ctx.fillStyle = '#7a9b9a'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    
    // 3. Draw Ground
    ctx.fillStyle = '#4a673c'; 
    ctx.fillRect(0, canvas.height - TILE_SIZE * 2, canvas.width, TILE_SIZE * 2);

    // 4. Draw Wagon (Centered)
    const wagonX = canvas.width / 2 - 60;
    const wagonY = canvas.height - TILE_SIZE * 3;
    drawWagon(wagonX, wagonY);

    // 5. Draw Scenery based on scene
    let sceneryColor = '#5c5c5c';
    if (distance > 500) sceneryColor = '#8A795D'; 
    if (distance > 1000) sceneryColor = '#a52a2a'; 

    // Mountain
    ctx.fillStyle = sceneryColor;
    ctx.beginPath();
    ctx.moveTo(canvas.width - 150, canvas.height - TILE_SIZE * 2);
    ctx.lineTo(canvas.width - 100, canvas.height - TILE_SIZE * 6);
    ctx.lineTo(canvas.width - 50, canvas.height - TILE_SIZE * 2);
    ctx.fill();

    // River crossing simulation
    if (currentScene.includes('river')) {
        ctx.fillStyle = '#3a8fb0'; 
        ctx.fillRect(0, canvas.height - TILE_SIZE * 4, canvas.width, TILE_SIZE * 2);
    }
}

// --- UI UPDATES & GAME FLOW ---

function updateDisplay() {
    document.getElementById('dayDisplay').textContent = day;
    document.getElementById('distanceDisplay').textContent = distance;
    document.getElementById('foodDisplay').textContent = food;
    document.getElementById('oxenDisplay').textContent = oxen;
    
    const currentSceneData = CORE_ACTIONS[currentScene] || CORE_ACTIONS['main'];
    document.getElementById('message').textContent = currentSceneData.text.replace('${food}', food).replace('${oxen}', oxen).replace('${wagonParts}', wagonParts);

    const charDiv = document.getElementById('characterStatus');
    if (currentScene !== 'initial') {
        charDiv.innerHTML = party.map(member => `
            <div class="character-status">
                ${member.name} HP: ${member.health}%
                <div class="health-bar">
                    <div class="health-fill" style="width: ${member.health}%; background-color: ${member.health > 50 ? 'green' : (member.health > 20 ? 'orange' : 'red')};"></div>
                </div>
            </div>
        `).join('');
    } else {
         charDiv.innerHTML = 'Party members ready.';
    }
    
    updateChoices(currentSceneData.choices);
    drawScene();
    checkGameStatus();
}

function updateChoices(choices) {
    const choicesDiv = document.getElementById('choices');
    choicesDiv.innerHTML = '';
    choices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice.text;
        button.onclick = () => handleAction(choice.action);
        choicesDiv.appendChild(button);
    });
}

// --- GAME LOGIC SECTION ---

function applyRandomEvent() {
    const events = [
        { type: 'disease', odds: 0.15, effect: () => {
            const aliveMembers = party.filter(m => m.health > 0);
            if (aliveMembers.length > 0) {
                const sickMember = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
                sickMember.health = Math.max(0, sickMember.health - 25);
                document.getElementById('message').textContent += `\n**RANDOM EVENT:** ${sickMember.name} has fallen ill! Health reduced.`;
            }
        }},
        { type: 'oxenLoss', odds: 0.05, effect: () => {
            if (oxen > 0) {
                oxen = Math.max(0, oxen - 1);
                document.getElementById('message').textContent += "\n**RANDOM EVENT:** One of your oxen has died. Travel speed will be slower.";
            }
        }},
        { type: 'goodWeather', odds: 0.20, effect: () => {
            document.getElementById('message').textContent += "\n**RANDOM EVENT:** Excellent weather! You gain a slight travel bonus.";
            return { bonusDistance: 15 };
        }},
        { type: 'badLuck', odds: 0.10, effect: () => {
            food = Math.max(0, food - 50);
            document.getElementById('message').textContent += "\n**RANDOM EVENT:** A sudden storm ruined some of your food supply (-50 food).";
        }},
        { type: 'wagonBreak', odds: 0.05, effect: () => {
            if (currentScene !== 'broken_wagon') { 
                currentScene = 'broken_wagon';
                document.getElementById('message').textContent += "\n**RANDOM EVENT:** A wagon wheel broke! You must stop and repair it.";
            }
        }}
    ];

    if (Math.random() < 0.35) { 
        let eventTotalOdds = events.reduce((sum, event) => sum + event.odds, 0);
        let randomValue = Math.random() * eventTotalOdds;
        
        let cumulativeOdds = 0;
        for (const event of events) {
            cumulativeOdds += event.odds;
            if (randomValue < cumulativeOdds) {
                return event.effect() || {};
            }
        }
    }
    return {};
}

function checkGameStatus() {
    const aliveMembers = party.filter(member => member.health > 0).length;
    
    if (distance >= destinationDistance) {
        document.getElementById('gameStatus').textContent = "CONGRATULATIONS! You reached the destination in " + day + " days!";
        currentScene = 'end_win';
        updateChoices([]);
    } else if (aliveMembers === 0 || oxen === 0 || food <= 0 && distance < destinationDistance && day > 5) {
        document.getElementById('gameStatus').textContent = "GAME OVER. Your party perished or your wagon is stranded.";
        currentScene = 'end_lose';
        updateChoices([]);
    } else {
         document.getElementById('gameStatus').textContent = `Distance to go: ${destinationDistance - distance} miles.`;
    }
}

// --- ACTION HANDLERS ---

function handleAction(action) {
    if (currentScene.startsWith('end')) return; 
    
    document.getElementById('message').textContent = ""; 

    switch (action) {
        case 'travel':
            if (oxen === 0 || currentScene === 'broken_wagon') {
                 document.getElementById('message').textContent = oxen === 0 ? "You have no oxen!" : "You cannot travel with a broken wagon!";
                 break;
            }

            day++;
            let travelRate = Math.min(60, Math.max(10, oxen * 20));
            const foodConsumption = party.length * 4; 
            food = Math.max(0, food - foodConsumption); 

            const eventResult = applyRandomEvent();
            travelRate += (eventResult.bonusDistance || 0);

            distance += travelRate;
            document.getElementById('message').textContent += `\nYou traveled ${travelRate} miles today.`;

            if (food === 0) {
                 party.forEach(member => member.health = Math.max(0, member.health - 5));
                 document.getElementById('message').textContent += "\nYour party is starving! Health is dropping.";
            }

            currentScene = 'main';
            break;

        case 'hunt':
            day++;
            const foodGained = Math.floor(Math.random() * 150) + 50; 
            food += foodGained;
            food = Math.max(0, food - 10); 
            
            document.getElementById('message').textContent = `You spent the day hunting and gained ${foodGained} lbs of food.`;

            if (Math.random() < 0.1) {
                party[0].health = Math.max(0, party[0].health - 10); 
                document.getElementById('message').textContent += "\nThe Leader sustained a minor injury while hunting (-10 Health).";
            }
            
            applyRandomEvent();
            currentScene = 'main';
            break;

        case 'rest':
            day++;
            party.forEach(member => member.health = Math.min(100, member.health + 10));
            
            const restConsumption = party.length * 2; 
            food = Math.max(0, food - restConsumption); 

            document.getElementById('message').textContent = "You rested for a day. Party members feel better.";

            if (food === 0) {
                 document.getElementById('message').textContent += "\nBut you have no food, and rest offers little comfort.";
                 party.forEach(member => member.health = Math.max(0, member.health - 5));
            }

            applyRandomEvent();
            currentScene = 'main';
            break;

        case 'supplies':
            CORE_ACTIONS['supplies'].text = `Current Supplies:\nFood: ${food} lbs\nOxen: ${oxen}\nSpare Parts: ${wagonParts}`;
            currentScene = 'supplies';
            break;

        case 'repair':
            if (wagonParts > 0) {
                wagonParts--;
                currentScene = 'main';
                document.getElementById('message').textContent = "The wagon is repaired using one spare part. Back on the trail!";
            } else {
                document.getElementById('message').textContent = "You do not have any spare wagon parts to perform the repair.";
            }
            break;
            
        case 'initial_start':
            currentScene = 'main';
            document.getElementById('message').textContent = "The journey has begun! Head west!";
            break;

        case 'main':
            currentScene = 'main';
            break;
    }

    updateDisplay();
}

// --- INITIALIZATION ---
function initGame() {
    CORE_ACTIONS['initial'] = {
        text: "Welcome to the Oregon Trail! Your goal is to travel 2000 miles to your destination. Click Start to begin.",
        choices: [
            { text: "Start Journey", action: "initial_start" }
        ]
    };
    
    drawScene();
    updateDisplay();
}

window.onload = initGame;
