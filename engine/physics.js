const Physics={

// world settings
gravity:0.4,
friction:0.85,

createBody(x,y,w=20,h=20){

return{
x,y,
w,h,
vx:0,
vy:0,
ax:0,
ay:0,
mass:1,
grounded:false
};

},

// physics update
update(body){

// apply forces
body.vx+=body.ax;
body.vy+=body.ay+this.gravity;

// friction
body.vx*=this.friction;

// move
body.x+=body.vx;
body.y+=body.vy;

// reset forces
body.ax=0;
body.ay=0;

},

// world collision using WorldGen map
collideWorld(body){

if(!window.WorldGen?.map) return;

let ts=WorldGen.tileSize;

let gx=Math.floor(body.x/ts);
let gy=Math.floor(body.y/ts);

if(WorldGen.map[gy]?.[gx]===1){

body.y-=body.vy;
body.vy=0;
body.grounded=true;

}else{
body.grounded=false;
}

},

// rectangle collision
rectCollision(a,b){

return(
a.x<b.x+b.w &&
a.x+a.w>b.x &&
a.y<b.y+b.h &&
a.y+a.h>b.y
);

},

// knockback
impulse(body,x,y){
body.vx+=x/body.mass;
body.vy+=y/body.mass;
}

};
