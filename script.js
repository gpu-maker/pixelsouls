// ===============================
// CANVAS SETUP
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const mini = document.getElementById("minimap");
const mctx = mini.getContext("2d");

const W = canvas.width;
const H = canvas.height;

// ===============================
// GAME STATE
// ===============================

let game = {
paused:false,
gold:50,
playerHP:100,
potions:3,
biome:"forest",
xp:0,
level:1,
skills:{
strength:0,
magic:0,
vitality:0
},
quests:[
{title:"Find the village",done:false}
]
};

// ===============================
// PLAYER
// ===============================

const player = {
x:500,
y:400,
size:24,
speed:3,
color:"#5cf",
mana:100
};

// ===============================
// INPUT
// ===============================

const keys = {};

addEventListener("keydown",e=>{
keys[e.key]=true;

if(e.key==="Escape") togglePause();
if(e.key==="j") togglePanel("journal");
if(e.key==="k") togglePanel("skillTree");
if(e.key==="h") usePotion();
if(e.key==="s") saveGame();
});

addEventListener("keyup",e=>keys[e.key]=false);

// ===============================
// PIXEL DRAWING SYSTEM (NO IMAGES)
// ===============================

function drawPixel(x,y,color,size=4){
ctx.fillStyle=color;
ctx.fillRect(x,y,size,size);
}

function drawSprite(x,y,pattern,scale=4){
for(let r=0;r<pattern.length;r++){
for(let c=0;c<pattern[r].length;c++){
if(pattern[r][c]!==" "){
drawPixel(
x+c*scale,
y+r*scale,
pattern[r][c],
scale
);
}
}
}
}

// ===============================
// SPRITES (PIXEL ONLY)
// ===============================

const playerSprite=[
"  #5cf ",
" ##### ",
"  #5cf ",
" ## ## ",
"#     #"
];

const enemySprite=[
"  red  ",
" rrrrr ",
"  rrr  ",
" r r r "
];

const bossSprite=[
" purplepurple ",
"pppppppppppp",
" pppppppppp ",
"pppppppppppp"
];

// ===============================
// ENEMIES
// ===============================

let enemies = [
{x:900,y:500,hp:30,type:"forest"},
{x:1300,y:200,hp:60,type:"desert"}
];

let bosses=[
{x:2000,y:1000,hp:400}
];

// ===============================
// WORLD + BIOMES
// ===============================

function getBiome(x){
if(x<800) return "forest";
if(x<1600) return "desert";
return "ruins";
}

function drawBiome(){
let b = getBiome(player.x);

if(b==="forest") ctx.fillStyle="#063";
if(b==="desert") ctx.fillStyle="#a83";
if(b==="ruins") ctx.fillStyle="#444";

ctx.fillRect(0,0,W,H);

game.biome=b;
}

// ===============================
// MOVEMENT
// ===============================

function updatePlayer(){

if(keys["w"]) player.y-=player.speed;
if(keys["s"]) player.y+=player.speed;
if(keys["a"]) player.x-=player.speed;
if(keys["d"]) player.x+=player.speed;

}

// ===============================
// COMBAT
// ===============================

function castSpell(){
enemies.forEach(e=>{
let d=Math.hypot(player.x-e.x,player.y-e.y);
if(d<120) e.hp-=20+game.skills.magic*5;
});
}

addEventListener("click",castSpell);

// ===============================
// POTIONS
// ===============================

function usePotion(){
if(game.potions>0){
game.playerHP+=30;
game.potions--;
}
}

// ===============================
// SHOP SYSTEM
// ===============================

function openShop(){
let shop=document.getElementById("shop");
shop.classList.remove("hidden");
shop.innerHTML=`
<h2>Village Shop</h2>
<button onclick="buyPotion()">Buy Potion (10 gold)</button>
`;
}

window.buyPotion=()=>{
if(game.gold>=10){
game.gold-=10;
game.potions++;
}
};

// ===============================
// SKILL TREE
// ===============================

function toggleSkillTree(){
let el=document.getElementById("skillTree");
el.classList.toggle("hidden");

el.innerHTML=`
<h2>Skill Tree</h2>
Strength: ${game.skills.strength}
<button onclick="upgradeSkill('strength')">+</button><br>

Magic: ${game.skills.magic}
<button onclick="upgradeSkill('magic')">+</button><br>

Vitality: ${game.skills.vitality}
<button onclick="upgradeSkill('vitality')">+</button>
`;
}

window.upgradeSkill=(s)=>{
if(game.xp>=10){
game.skills[s]++;
game.xp-=10;
}
toggleSkillTree();
toggleSkillTree();
};

// ===============================
// QUEST JOURNAL
// ===============================

function toggleJournal(){
let j=document.getElementById("journal");
j.classList.toggle("hidden");

j.innerHTML="<h2>Quest Journal</h2>";
game.quests.forEach(q=>{
j.innerHTML+=`<div>${q.done?"✓":"○"} ${q.title}</div>`;
});
}

// ===============================
// PAUSE MENU
// ===============================

function togglePause(){
game.paused=!game.paused;

let p=document.getElementById("pauseMenu");
p.classList.toggle("hidden");

p.innerHTML=`
<h2>Paused</h2>
WASD Move<br>
Click = Spell<br>
H = Heal<br>
J = Journal<br>
K = Skills<br>
S = Save Game
`;
}

// ===============================
// SAVE SYSTEM (FILE DOWNLOAD)
// ===============================

function saveGame(){

let data=JSON.stringify({
game,
player
});

let blob=new Blob([data],{type:"application/json"});
let a=document.createElement("a");

a.href=URL.createObjectURL(blob);
a.download="pixelsouls_save.json";
a.click();
}

// ===============================
// MINIMAP
// ===============================

function drawMinimap(){

mctx.fillStyle="#000";
mctx.fillRect(0,0,200,200);

mctx.fillStyle="white";
mctx.fillRect(player.x/20,player.y/20,4,4);

}

// ===============================
// ENEMY UPDATE
// ===============================

function updateEnemies(){
enemies=enemies.filter(e=>e.hp>0);

enemies.forEach(e=>{
let dx=player.x-e.x;
let dy=player.y-e.y;
let d=Math.hypot(dx,dy);

if(d<200){
e.x+=dx/d;
e.y+=dy/d;
}

if(d<30) game.playerHP-=0.2;
});
}

// ===============================
// DRAW
// ===============================

function draw(){

drawBiome();

drawSprite(player.x,player.y,playerSprite);

enemies.forEach(e=>{
drawSprite(e.x,e.y,enemySprite);
});

bosses.forEach(b=>{
drawSprite(b.x,b.y,bossSprite,6);
});

}

// ===============================
// UI UPDATE
// ===============================

function updateUI(){
hp.textContent=Math.floor(game.playerHP);
gold.textContent=game.gold;
pots.textContent=game.potions;
}

// ===============================
// GAME LOOP
// ===============================

function loop(){

if(!game.paused){
updatePlayer();
updateEnemies();
}

draw();
drawMinimap();
updateUI();

requestAnimationFrame(loop);
}

loop();

// ===============================
// PANEL TOGGLE HELPER
// ===============================

function togglePanel(name){
if(name==="journal") return toggleJournal();
if(name==="skillTree") return toggleSkillTree();
}
