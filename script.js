const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");

////////////////////////////////////////////////////////////
// GLOBAL GAME STATE
////////////////////////////////////////////////////////////

const Game={
paused:false,
time:0,
tile:32,
world:[],
entities:[],
quests:[],
gold:100,
biome:"plains",

resume(){
Game.paused=false;
UI.hide("pauseMenu");
},

////////////////////////////////////////////////////////////
// SAVE SYSTEM (LOCAL + FILE)
////////////////////////////////////////////////////////////

save(){
localStorage.setItem("pixelSoulsSave",JSON.stringify({
player:Player,
gold:Game.gold,
quests:Game.quests,
biome:Game.biome
}));
},

load(){
const s=localStorage.getItem("pixelSoulsSave");
if(!s)return;
const data=JSON.parse(s);
Object.assign(Player,data.player);
Game.gold=data.gold;
Game.quests=data.quests;
Game.biome=data.biome;
},

downloadSave(){
const data=JSON.stringify(localStorage.getItem("pixelSoulsSave"));
const blob=new Blob([data],{type:"text/plain"});
const a=document.createElement("a");
a.href=URL.createObjectURL(blob);
a.download="pixelSouls.save";
a.click();
}
};

////////////////////////////////////////////////////////////
// INPUT
////////////////////////////////////////////////////////////

const Keys={};

window.addEventListener("keydown",e=>{
Keys[e.key.toLowerCase()]=true;

if(e.key==="Escape"){
Game.paused=!Game.paused;
UI.toggle("pauseMenu");
}

if(e.key==="k")UI.toggle("skillTree");
if(e.key==="j")UI.toggle("journal");
});

window.addEventListener("keyup",e=>{
Keys[e.key.toLowerCase()]=false;
});

////////////////////////////////////////////////////////////
// PIXEL SPRITE DRAWER (NO PNG)
////////////////////////////////////////////////////////////

function drawSprite(x,y,pixels,size=4){
for(let r=0;r<pixels.length;r++){
for(let c=0;c<pixels[r].length;c++){
if(pixels[r][c]){
ctx.fillStyle=pixels[r][c];
ctx.fillRect(x+c*size,y+r*size,size,size);
}
}
}
}

////////////////////////////////////////////////////////////
// PLAYER
////////////////////////////////////////////////////////////

const Player={
x:500,
y:400,
hp:100,
maxHp:100,
speed:4,
potions:3,
level:1,
xp:0,
skills:{attack:1,magic:1,health:1},

update(){
if(Keys.w)Player.y-=Player.speed;
if(Keys.s)Player.y+=Player.speed;
if(Keys.a)Player.x-=Player.speed;
if(Keys.d)Player.x+=Player.speed;
},

draw(){
drawSprite(Player.x,Player.y,[
[0,"white","white",0],
["white","white","white","white"],
[0,"white","white",0]
]);
}
};

////////////////////////////////////////////////////////////
// BIOMES
////////////////////////////////////////////////////////////

const Biomes={
plains:{color:"#2e8b57",enemy:"slime"},
desert:{color:"#c2b280",enemy:"scarab"},
snow:{color:"#e8f6ff",enemy:"wraith"},
forest:{color:"#013220",enemy:"wolf"}
};

function generateWorld(){
for(let y=0;y<50;y++){
Game.world[y]=[];
for(let x=0;x<80;x++){
const r=Math.random();
let biome="plains";
if(r>.75)biome="forest";
if(r>.85)biome="desert";
if(r>.95)biome="snow";
Game.world[y][x]=biome;
}
}
}

////////////////////////////////////////////////////////////
// ENEMIES
////////////////////////////////////////////////////////////

class Enemy{
constructor(x,y,type){
this.x=x;
this.y=y;
this.hp=30;
this.type=type;
}

update(){
const dx=Player.x-this.x;
const dy=Player.y-this.y;
this.x+=Math.sign(dx)*0.6;
this.y+=Math.sign(dy)*0.6;
}

draw(){
drawSprite(this.x,this.y,[
["red","red"],
["red","red"]
]);
}
}

////////////////////////////////////////////////////////////
// BOSS SYSTEM
////////////////////////////////////////////////////////////

class Boss extends Enemy{
constructor(x,y){
super(x,y,"boss");
this.hp=500;
this.size=8;
}

draw(){
drawSprite(this.x,this.y,[
["purple","purple","purple"],
["purple",0,"purple"],
["purple","purple","purple"]
],8);
}
}

////////////////////////////////////////////////////////////
// SHOPS / VILLAGES
////////////////////////////////////////////////////////////

const Shop={
open(){
UI.show("shop");
document.getElementById("shop").innerHTML=`
<h2>Village Shop</h2>
<button onclick="Shop.buyPotion()">Buy Potion (10g)</button>
<button onclick="UI.hide('shop')">Close</button>
`;
},

buyPotion(){
if(Game.gold>=10){
Game.gold-=10;
Player.potions++;
}
}
};

////////////////////////////////////////////////////////////
// SPELL SYSTEM
////////////////////////////////////////////////////////////

const Spells={
cast(){
Game.entities.push(new Projectile(Player.x,Player.y));
}
};

class Projectile{
constructor(x,y){
this.x=x;
this.y=y;
this.life=60;
}

update(){
this.x+=6;
this.life--;
}

draw(){
ctx.fillStyle="cyan";
ctx.fillRect(this.x,this.y,8,8);
}
}

////////////////////////////////////////////////////////////
// QUEST JOURNAL
////////////////////////////////////////////////////////////

function addQuest(name){
Game.quests.push({name,done:false});
renderJournal();
}

function renderJournal(){
const j=document.getElementById("journal");
j.innerHTML="<h2>Quest Journal</h2>";
Game.quests.forEach(q=>{
j.innerHTML+=`<div>${q.done?"✔":"◻"} ${q.name}</div>`;
});
}

////////////////////////////////////////////////////////////
// SKILL TREE
////////////////////////////////////////////////////////////

function renderSkillTree(){
const el=document.getElementById("skillTree");
el.innerHTML=`
<h2>Skill Tree</h2>
<button onclick="upgradeSkill('attack')">Attack</button>
<button onclick="upgradeSkill('magic')">Magic</button>
<button onclick="upgradeSkill('health')">Health</button>
`;
}

function upgradeSkill(name){
Player.skills[name]++;
if(name==="health")Player.maxHp+=20;
}

////////////////////////////////////////////////////////////
// UI
////////////////////////////////////////////////////////////

const UI={
show(id){document.getElementById(id).classList.remove("hidden")},
hide(id){document.getElementById(id).classList.add("hidden")},
toggle(id){document.getElementById(id).classList.toggle("hidden")}
};

////////////////////////////////////////////////////////////
// MINIMAP
////////////////////////////////////////////////////////////

function drawMinimap(){
const size=4;
for(let y=0;y<Game.world.length;y++){
for(let x=0;x<Game.world[y].length;x++){
ctx.fillStyle=Biomes[Game.world[y][x]].color;
ctx.fillRect(1200+x*size,10+y*size,size,size);
}
}
ctx.fillStyle="white";
ctx.fillRect(1200+Player.x/32*size,10+Player.y/32*size,size,size);
}

////////////////////////////////////////////////////////////
// WORLD DRAW
////////////////////////////////////////////////////////////

function drawWorld(){
for(let y=0;y<Game.world.length;y++){
for(let x=0;x<Game.world[y].length;x++){
ctx.fillStyle=Biomes[Game.world[y][x]].color;
ctx.fillRect(x*32,y*32,32,32);
}
}
}

////////////////////////////////////////////////////////////
// GAME LOOP
////////////////////////////////////////////////////////////

function update(){
if(Game.paused)return;

Player.update();

Game.entities.forEach(e=>e.update());
Game.entities=Game.entities.filter(e=>e.life===undefined||e.life>0);

Game.time++;
if(Game.time%600===0)Game.save();
}

function draw(){
ctx.clearRect(0,0,canvas.width,canvas.height);

drawWorld();

Player.draw();

Game.entities.forEach(e=>e.draw());

drawMinimap();

document.getElementById("hp").textContent=
`HP ${Player.hp}/${Player.maxHp}`;

document.getElementById("gold").textContent=
` Gold ${Game.gold}`;
}

function loop(){
update();
draw();
requestAnimationFrame(loop);
}

////////////////////////////////////////////////////////////
// STARTUP
////////////////////////////////////////////////////////////

generateWorld();
Game.load();
renderSkillTree();
renderJournal();
Game.entities.push(new Enemy(700,300,"slime"));
Game.entities.push(new Boss(900,500));

loop();
