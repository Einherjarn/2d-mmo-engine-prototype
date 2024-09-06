import Phaser from "phaser";
import Game from "./js/game"


const config = {
    type: Phaser.AUTO,
    parent: "phaser-example",
    //render: {antialias: false,}, // Fix rendering when needed
    width: 640,
    height: 480,
    physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 }
        }
      },
    scene: [
        Game
    ]
};

const game = new Phaser.Game(config);