// ===============================
// CANVAS SETUP
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ===============================
// GAME LOOP ENGINE
// ===============================

const Game = {
time:0,
delta:0,
last:0,
paused:false,

start(){
requestAnimationFrame(this.loop.bind(this));
},

loop(t){
this.delta=(t-this.last)/1000;
this.last=t;

if(!this.paused){
Environment.update(this.delta);
World.update(this.delta);
Physics.update();
AI.update();
Combat.update();
BossSystem.updateAll();
Particles.update();
Animation.update();
}

Renderer.draw();
requestAnimationFrame(this.loop.bind(this));
},

resume(){
this.paused=false;
document.getElementById("pauseMenu").classList.add("hidden");
}
};

// ===============================
// PHYSICS ENGINE + HITBOXES
// ===============================

const Physics={
bodies:[],

add(body){
if(!this.bodies.includes(body))
this.bodies.push(body);
},

update(){
for(let a of this.bodies){
a.x+=a.vx||0;
a.y+=a.vy||0;

for(let b of this.bodies){
if(a===b) continue;
if(this.collide(a,b)) a.onCollision?.(b);
}
}
},

collide(a,b){
return a.x<b.x+b.w &&
a.x+a.w>b.x &&
a.y<b.y+b.h &&
a.y+a.h>b.y;
}
};

// ===============================
// ANIMATION STATE MACHINE + BLENDING
// ===============================

const Animation={
update(){
for(let e of World.entities){
if(!e.animations) continue;

const target=e.state||"idle";
const current=e.currentAnim||"idle";

if(current!==target){
e.blend=(e.blend||0)+0.1;
if(e.blend>=1){
e.currentAnim=target;
e.blend=0;
}
}
}
}
};

// ===============================
// PARTICLE ENGINE (SPELLS / FX)
// ===============================

const Particles={
list:[],

spawn(x,y,color="orange"){
this.list.push({
x,y,
vx:Math.random()*2-1,
vy:-2,
life:1,
color
});
},

update(){
this.list=this.list.filter(p=>p.life>0);

for(let p of this.list){
p.x+=p.vx;
p.y+=p.vy;
p.life-=0.02;
}
}
};

// ===============================
// PLAYER DATA + EQUIPMENT SYSTEM
// ===============================

const Player={
x:300,y:300,w:32,h:32,
vx:0,vy:0,
hp:100,
maxHp:100,
stamina:100,
maxStamina:100,
attack:10,
gold:0,
speed:2,
equipment:{
weapon:null,
armor:null
}
};

Physics.add(Player);

// ===============================
// SOULS COMBAT SYSTEM
// ===============================

const Combat={

attack(attacker){
if(attacker.stamina<10) return;

attacker.stamina-=10;

const hitbox={
x:attacker.x+20,
y:attacker.y,
w:40,
h:40
};

for(let e of World.entities){
if(e===attacker) continue;

if(Physics.collide(hitbox,e)){
e.hp-=attacker.attack||5;
Particles.spawn(e.x,e.y,"orange");
}
}
},

dodge(player){
if(player.stamina<20) return;
player.stamina-=20;
player.vx*=5;
player.vy*=5;
}
};

// ===============================
// A* STYLE PATHFINDING AI (SIMPLIFIED)
// ===============================

const AI={
update(){
for(let e of World.entities){
if(!e.ai) continue;
this.chasePlayer(e);
}
},

chasePlayer(enemy){
const dx=Player.x-enemy.x;
const dy=Player.y-enemy.y;

enemy.vx=Math.sign(dx)*enemy.speed;
enemy.vy=Math.sign(dy)*enemy.speed;
}
};

// ===============================
// MODULAR ENEMY DATABASE (500+)
// ===============================

const EnemyDB={
types:["ghoul","knight","beast","mage","shade"],

generate(n=500){
let arr=[];
for(let i=0;i<n;i++){
arr.push({
name:this.types[i%this.types.length]+"_"+i,
hp:50+Math.random()*100,
maxHp:150,
attack:5+Math.random()*10,
speed:0.5+Math.random(),
ai:true,
w:32,
h:32,
vx:0,
vy:0
});
}
return arr;
}
};

// ===============================
// WORLD + BIOME GENERATION
// ===============================

const World={
entities:[],
tiles:[],

generate(){

// biome map
for(let y=0;y<100;y++){
for(let x=0;x<100;x++){

let r=Math.random();

this.tiles.push({
x,y,
type:r<0.3?"forest":r<0.6?"desert":"ruins"
});
}
}

this.entities.push(Player);
this.spawnEnemies();
},

spawnEnemies(){
const pool=EnemyDB.generate(500);

for(let e of pool){
e.x=Math.random()*1400;
e.y=Math.random()*900;
this.entities.push(e);
Physics.add(e);
}
},

update(){}
};

// ===============================
// PROCEDURAL DUNGEON GENERATOR
// ===============================

const Dungeon={
generate(){
let rooms=[];
for(let i=0;i<20;i++){
rooms.push({
x:Math.random()*1200,
y:Math.random()*800,
w:100,
h:100
});
}
return rooms;
}
};

// ===============================
// DIALOGUE TREE SYSTEM
// ===============================

const Dialogue={
start(node){
const box=document.getElementById("dialogue");
box.classList.remove("hidden");
box.innerHTML=node.text;

node.choices?.forEach(c=>{
let b=document.createElement("button");
b.innerText=c.text;
b.onclick=()=>this.start(c.next);
box.appendChild(b);
});
}
};

// ===============================
// QUEST SYSTEM + BRANCHING CHAINS
// ===============================

const QuestSystem={
quests:{},

start(id){
this.quests[id]={stage:0};
},

advance(id){
this.quests[id].stage++;
}
};

// ===============================
// BOSS PHASE SYSTEM
// ===============================

const BossSystem={
bosses:[],

add(boss){
this.bosses.push(boss);
},

updateAll(){
for(let b of this.bosses){

if(b.hp<b.maxHp*0.5 && !b.phase2){
b.phase2=true;
b.attack*=2;
Particles.spawn(b.x,b.y,"red");
}
}
}
};

// ===============================
// WEATHER + DAY/NIGHT SYSTEM
// ===============================

const Environment={
time:0,
weather:"clear",

update(dt){
this.time+=dt;

if(Math.random()<0.001){
this.weather=["rain","storm","fog"][Math.floor(Math.random()*3)];
}
}
};

// ===============================
// SKILL TREE GRAPH UI
// ===============================

const SkillTree={
nodes:[
{id:"atk",x:200,y:200,unlocked:false},
{id:"magic",x:300,y:300,unlocked:false}
],

draw(){
ctx.strokeStyle="white";

for(let n of this.nodes){
ctx.strokeRect(n.x,n.y,20,20);
}
}
};

// ===============================
// SAVE / LOAD FILE SYSTEM
// ===============================

const SaveManager={

saveFile(){
const data=JSON.stringify({
player:Player,
quests:QuestSystem.quests
});

const blob=new Blob([data]);
const a=document.createElement("a");
a.href=URL.createObjectURL(blob);
a.download="save.json";
a.click();
},

loadFile(){
const input=document.createElement("input");
input.type="file";

input.onchange=e=>{
const file=e.target.files[0];
const reader=new FileReader();

reader.onload=()=>{
const data=JSON.parse(reader.result);
Object.assign(Player,data.player);
QuestSystem.quests=data.quests||{};
};

reader.readAsText(file);
};

input.click();
}
};

// ===============================
// PIXEL RENDERER (NO PNG)
// ===============================

const Renderer={

draw(){

ctx.fillStyle="#111";
ctx.fillRect(0,0,1500,1000);

// draw world tiles
for(let t of World.tiles){

ctx.fillStyle=
t.type==="forest"?"#1a3":
t.type==="desert"?"#a83":
"#444";

ctx.fillRect(t.x*15,t.y*15,15,15);
}

// draw entities
for(let e of World.entities){
ctx.fillStyle="white";
ctx.fillRect(e.x,e.y,e.w,e.h);
}

// draw particles
for(let p of Particles.list){
ctx.fillStyle=p.color;
ctx.fillRect(p.x,p.y,3,3);
}

// UI bars
document.getElementById("healthBar").style.width =
(Player.hp/Player.maxHp*200)+"px";

document.getElementById("staminaBar").style.width =
(Player.stamina/Player.maxStamina*200)+"px";

document.getElementById("gold").innerText="Gold: "+Player.gold;
}
};

// ===============================
// INPUT SYSTEM
// ===============================

document.addEventListener("keydown",e=>{

if(e.key==="Escape"){
Game.paused=!Game.paused;
document.getElementById("pauseMenu").classList.toggle("hidden");
}

if(Game.paused) return;

if(e.key==="w") Player.vy=-Player.speed;
if(e.key==="s") Player.vy=Player.speed;
if(e.key==="a") Player.vx=-Player.speed;
if(e.key==="d") Player.vx=Player.speed;

if(e.key===" ") Combat.dodge(Player);
});

document.addEventListener("keyup",()=>{
Player.vx=0;
Player.vy=0;
});

document.addEventListener("mousedown",()=>{
Combat.attack(Player);
});

// ===============================
// START GAME
// ===============================

World.generate();
Game.start();
