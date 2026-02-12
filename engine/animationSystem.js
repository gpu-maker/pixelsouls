export class AnimationSystem {
  constructor(){
    this.animations = {};
  }

  play(entity,name){
    entity.currentAnimation = this.animations[name];
  }

  update(){
    // frame progression
  }
}
