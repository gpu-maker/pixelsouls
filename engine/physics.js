export class Physics {
  constructor(){
    this.bodies = [];
    this.gravity = 0.6;
  }

  add(body){
    this.bodies.push(body);
  }

  update(){
    for(const b of this.bodies){

      if(!b.static){
        // apply gravity
        b.vy += this.gravity;

        // apply velocity
        b.x += b.vx;
        b.y += b.vy;

        // friction
        b.vx *= 0.9;

        // ground collision
        if(b.y > 500){
          b.y = 500;
          b.vy = 0;
          b.onGround = true;
        }
      }
    }
  }
}
