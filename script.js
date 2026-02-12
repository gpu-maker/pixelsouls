import { Renderer } from "./engine/renderer.js";
import { Physics } from "./engine/physics.js";
import { AnimationSystem } from "./engine/animationSystem.js";
import { LockOnCamera } from "./engine/lockOnCamera.js";
import { generateContinent } from "./world/continentGenerator.js";

const renderer = new Renderer();
const physics = new Physics();
const animations = new AnimationSystem();

function gameLoop(){
  physics.update();
  animations.update();
  renderer.render();
  requestAnimationFrame(gameLoop);
}

gameLoop();
