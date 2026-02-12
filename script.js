/* =====================================================
   SOULS ENGINE — PRODUCTION SCALE VERSION
   Expandable to 10k+ lines
===================================================== */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* =====================================================
   UTILITIES
===================================================== */

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rand=(a,b)=>Math.random()*(b-a)+a;

/* =====================================================
   CORE ENGINE
===================================================== */

const Engine={
  entities:[],
  particles:[],
  lights:[],
  time:0,

  add(e){this.entities.push(e)},

  update(dt){
    this.time+=dt;

    Weather.update(dt);
    DayNight.update(dt);

    for(const e of this.entities) e.update?.(dt);
    for(const p of this.particles) p.update(dt);

    Physics.solve();
  },

  draw(){
    Renderer.clear();
    Camera.update();
    Camera.apply();

    Dungeon.draw();
    for(const e of this.entities) e.draw?.();
    for(const p of this.particles) p.draw();

    ctx.setTransform(1,0,0,1,0,0);
    Lighting.render();
    UI.render();
  }
};

/* =====================================================
   RENDERER
===================================================== */

const Renderer={
  clear(){
    ctx.fillStyle=DayNight.skyColor();
    ctx.fillRect(0,0,1500,1000);
  },

  rect(x,y,w,h,c){
    ctx.fillStyle=c;
    ctx.fillRect(x,y,w,h);
  }
};

/* =====================================================
   CAMERA
===================================================== */

const Camera={
  x:0,y:0,zoom:1,
  update(){
    this.x=player.x-750;
    this.y=player.y-500;
  },
  apply(){ctx.setTransform(this.zoom,0,0,this.zoom,-this.x,-this.y)}
};

/* =====================================================
   PHYSICS
===================================================== */

const Physics={
  gravity:900,
  solve(){
    for(const e of Engine.entities){
      if(!e.body) continue;
      e.body.vy+=this.gravity/60;
      e.x+=e.body.vx/60;
      e.y+=e.body.vy/60;
      if(e.y>900){e.y=900;e.body.vy=0}
    }
  }
};

/* =====================================================
   PARTICLES
===================================================== */

class Particle{
  constructor(x,y,c){
    this.x=x;this.y=y;
    this.life=1;
    this.vx=rand(-50,50);
    this.vy=rand(-50,50);
    this.c=c;
  }
  update(dt){
    this.life-=dt;
    this.x+=this.vx*dt;
    this.y+=this.vy*dt;
  }
  draw(){
    if(this.life<=0)return;
    Renderer.rect(this.x,this.y,3,3,this.c);
  }
}

const spawnParticles=(x,y,c)=>{
  for(let i=0;i<8;i++)
    Engine.particles.push(new Particle(x,y,c));
};

/* =====================================================
   LIGHTING
===================================================== */

const Lighting={
  render(){
    ctx.globalCompositeOperation="multiply";
    ctx.fillStyle="rgba(0,0,0,.6)";
    ctx.fillRect(0,0,1500,1000);
    ctx.globalCompositeOperation="source-over";
  }
};

/* =====================================================
   DAY / NIGHT CYCLE
===================================================== */

const DayNight={
  time:0,
  update(dt){this.time=(this.time+dt*.02)%1},
  skyColor(){
    const t=this.time;
    if(t<.25)return"#223";
    if(t<.5)return"#448";
    if(t<.75)return"#f80";
    return"#111";
  }
};

/* =====================================================
   WEATHER SYSTEM
===================================================== */

const Weather={
  state:"clear",
  timer:0,

  update(dt){
    this.timer-=dt;
    if(this.timer<=0){
      this.timer=20;
      this.state=["clear","rain","fog"][Math.floor(Math.random()*3)];
    }

    if(this.state==="rain"){
      spawnParticles(rand(0,1500),rand(0,1000),"#6af");
    }
  }
};

/* =====================================================
   SOULS DEATH + CORPSE RECOVERY
===================================================== */

let lostSouls=0;
let corpse=null;

function playerDeath(){
  lostSouls+=Economy.gold;
  Economy.gold=0;

  corpse={x:player.x,y:player.y};

  player.x=300;
  player.y=300;
  player.hp=100;
}

/* =====================================================
   STAMINA
===================================================== */

class Stamina{
  constructor(){this.max=100;this.v=100}
  use(v){if(this.v<v)return false;this.v-=v;return true}
  update(dt){this.v=clamp(this.v+30*dt,0,this.max)}
}

/* =====================================================
   WEAPON
===================================================== */

class Weapon{
  constructor(dmg){this.dmg=dmg}
  attack(u){
    for(const e of Engine.entities)
      if(e!==u && e.hp && Math.hypot(e.x-u.x,e.y-u.y)<40){
        e.hp-=this.dmg;
        spawnParticles(e.x,e.y,"#ff0");
      }
  }
}

/* =====================================================
   PLAYER
===================================================== */

class Player{
  constructor(){
    this.x=300;this.y=300;
    this.hp=100;
    this.body={vx:0,vy:0};
    this.weapon=new Weapon(12);
    this.stamina=new Stamina();
  }

  update(dt){
    this.stamina.update(dt);

    if(keys.a)this.body.vx=-200;
    else if(keys.d)this.body.vx=200;
    else this.body.vx=0;

    if(keys[" "] && this.stamina.use(20))
      this.weapon.attack(this);

    if(keys.Shift && this.stamina.use(30))
      this.body.vx=600;

    if(this.hp<=0) playerDeath();

    if(corpse && Math.hypot(this.x-corpse.x,this.y-corpse.y)<40){
      Economy.gold+=lostSouls;
      lostSouls=0;
      corpse=null;
    }
  }

  draw(){
    Renderer.rect(this.x,this.y,20,20,"#0f0");
  }
}

/* =====================================================
   MODULAR ENEMY DATABASE (100+ AUTO GENERATED)
===================================================== */

const EnemyDB=[];

for(let i=0;i<120;i++){
  EnemyDB.push({
    hp:20+rand(0,50),
    speed:50+rand(0,150),
    color:`hsl(${rand(0,360)},70%,50%)`
  });
}

class Enemy{
  constructor(x,y,type){
    this.x=x;this.y=y;
    Object.assign(this,EnemyDB[type]);
    this.body={vx:0,vy:0};
  }

  update(){
    const dx=player.x-this.x;
    this.body.vx=Math.sign(dx)*this.speed;
  }

  draw(){Renderer.rect(this.x,this.y,18,18,this.color)}
}

/* =====================================================
   SKILL TREE GRAPH UI
===================================================== */

const SkillTree={
  nodes:{
    strength:{x:50,y:200,unlocked:false},
    magic:{x:200,y:200,unlocked:false},
    vitality:{x:350,y:200,unlocked:false}
  },

  render(){
    for(const k in this.nodes){
      const n=this.nodes[k];
      Renderer.rect(n.x,n.y,30,30,n.unlocked?"#0f0":"#444");
    }
  }
};

/* =====================================================
   DIALOGUE SYSTEM (BRANCHING)
===================================================== */

const Dialogue={
  active:null,

  start(tree){this.active=tree},

  choose(i){this.active=this.active.options[i]},

  render(){
    if(!this.active)return;
    ctx.fillStyle="#000";
    ctx.fillRect(50,800,600,150);
    ctx.fillStyle="#fff";
    ctx.fillText(this.active.text,60,820);
  }
};

/* =====================================================
   PROCEDURAL DUNGEON GENERATOR
===================================================== */

const Dungeon={
  grid:[],

  generate(){
    for(let y=0;y<40;y++){
      this.grid[y]=[];
      for(let x=0;x<60;x++)
        this.grid[y][x]=Math.random()>.8?1:0;
    }
  },

  draw(){
    for(let y=0;y<this.grid.length;y++)
      for(let x=0;x<this.grid[y].length;x++)
        if(this.grid[y][x])
          Renderer.rect(x*30,y*30,30,30,"#333");
  }
};

/* =====================================================
   ECONOMY + REPUTATION
===================================================== */

const Economy={
  gold:100,
  reputation:0
};

class Village{
  constructor(x,y){this.x=x;this.y=y}

  update(){
    if(Math.hypot(player.x-this.x,this.y-player.y)<40 && keys.f){
      Economy.reputation+=1;
    }
  }

  draw(){Renderer.rect(this.x,this.y,30,30,"#ff8")}
}

/* =====================================================
   UI
===================================================== */

const UI={
  render(){
    ctx.fillStyle="#fff";
    ctx.fillText("Gold:"+Economy.gold,20,20);
    ctx.fillText("Rep:"+Economy.reputation,20,40);
    ctx.fillText("Souls:"+lostSouls,20,60);

    if(corpse)
      Renderer.rect(corpse.x,corpse.y,10,10,"#ff0");

    SkillTree.render();
    Dialogue.render();
  }
};

/* =====================================================
   INPUT
===================================================== */

const keys={};
window.onkeydown=e=>keys[e.key]=true;
window.onkeyup=e=>keys[e.key]=false;

/* =====================================================
   START GAME
===================================================== */

Dungeon.generate();

const player=new Player();
Engine.add(player);

for(let i=0;i<20;i++)
  Engine.add(new Enemy(rand(200,1200),rand(200,800),i));

Engine.add(new Village(600,500));

/* =====================================================
   LOOP
===================================================== */

let last=0;
function loop(t){
  const dt=(t-last)/1000;
  last=t;

  Engine.update(dt);
  Engine.draw();

  requestAnimationFrame(loop);
}
loop(0);
