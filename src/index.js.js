import Phaser from 'phaser';

const config = {

  
  type: Phaser.AUTO,
  scale:{
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  width: 800,
  height: 720,
  pixelArt: true,
  antialias: false,
  physics: {
    gravity: 200,
    default: 'arcade',
    arcade: {
      debug: true,
    }
  },
  scene: {
    preload,
    create,
    update
  }
}

//Variables
let bird = null;
let pipe = null;
let cursors = null;
let joyStick = null;
let joystickCursors = null;
var stars;
var score = 0;
var scoreText;
let jumpSound;
let backgroundMusic;

function preload() {
  //background
  this.load.image('sky', 'assets/sky.png');

  //floating heads
  this.load.spritesheet('floatingHeads', 'assets/floating_heads_sprite.png', { frameWidth: 184, frameHeight: 184 });
  this.load.spritesheet('floatingHeads2', 'assets/floating_heads_sprite2.png', { frameWidth: 184, frameHeight: 184 });
  this.load.spritesheet('floatingHeads3', 'assets/floating_heads_sprite3.png', { frameWidth: 184, frameHeight: 184 });
  
  //Plataform
  this.load.image('pipe', 'assets/pipe.png');

  //Morty
  this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
  
  //Joystick
  let url = 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js';
  this.load.plugin('rexvirtualjoystickplugin', url, true);

  //Extras
  this.load.image('fscreen', 'assets/fscreen.png');
  this.load.image('star', 'assets/star.png');

  //audios
  this.load.audio('jump', 'assets/jump.mp3');
  this.load.audio('backgroundMusic', 'assets/background_music.mp3');
}

function create() {

  backgroundMusic = this.sound.add('backgroundMusic', { loop: true }); // Loop é definido como true para repetir continuamente
  backgroundMusic.play();
  backgroundMusic.setVolume(0.1);

  this.add.image(0, 0, 'sky').setOrigin(0);

  pipe = this.physics.add.staticGroup();

  const floatingHeads = this.add.sprite(350, 360, 'floatingHeads').setOrigin(1.5);
  const floatingHeads2 = this.add.sprite(650, 360, 'floatingHeads2').setOrigin(1.0);
  const floatingHeads3 = this.add.sprite(220, 460, 'floatingHeads3').setOrigin(0.5);

  pipe.create(500, 560, 'pipe').setOrigin(0).refreshBody();
  pipe.create(-130, 560, 'pipe').setOrigin(0).refreshBody();

  bird = this.physics.add.sprite(config.width * 0.1, config.height / 2, 'dude').setOrigin(0);
  bird.setScale(2); 
  bird.setBounce(0.2);
  bird.setCollideWorldBounds(false);
  bird.body.gravity.y = 500;

  this.anims.create({
    key: 'floatingAnimation',
    frames: this.anims.generateFrameNumbers('floatingHeads', { start: 0, end: 3 }),
    frameRate: 1,
    repeat: -1
  });floatingHeads.anims.play('floatingAnimation');
  
  this.anims.create({
    key: 'floatingAnimation2',
    frames: this.anims.generateFrameNumbers('floatingHeads2', { start: 0, end: 3 }),
    frameRate: 0.5,
    repeat: -1
  });floatingHeads2.anims.play('floatingAnimation2');

  this.anims.create({
    key: 'floatingAnimation3',
    frames: this.anims.generateFrameNumbers('floatingHeads3', { start: 0, end: 3 }),
    frameRate: 0.1,
    repeat: -1
  });floatingHeads3.anims.play('floatingAnimation3');

  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: 'turn',
    frames: [ { key: 'dude', frame: 4 } ],
    frameRate: 20
  });

  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
  });

  cursors = this.input.keyboard.createCursorKeys();

  stars = this.physics.add.group({
    key: 'star',
    repeat: 4,
    setXY: { x: 12, y: 0, stepX: 70 }
});
stars.children.iterate(function (child) {
  child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  child.body.gravity.y = 300;
});

this.physics.add.collider(bird, pipe);
  this.physics.add.collider(stars, pipe);
  this.physics.add.overlap(bird, stars, collectStar, null, this);

  this.physics.world.enable(stars);
  stars.setVelocityY(100);
  
  addFScreen(this);


  joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
    x: 100,
    y: 600,
    radius: 50,
    base: this.add.circle(0, 0, 50, 0x888888),
    thumb: this.add.circle(0, 0, 30, 0xcccccc),
  });

  joystickCursors = joyStick.createCursorKeys();

  scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });

  jumpSound = this.sound.add('jump');
}


function update() {
  if (cursors.left.isDown || joystickCursors.left.isDown) {
    bird.setVelocityX(-160);
    bird.anims.play('left', true);
  } else if (cursors.right.isDown || joystickCursors.right.isDown) {
    bird.setVelocityX(160);
    bird.anims.play('right', true);
  } else {
    bird.setVelocityX(0);
    bird.anims.play('turn');
  }

  if ((cursors.up.isDown || joystickCursors.up.isDown) && bird.body.touching.down) {
    bird.setVelocityY(-330);
    jumpSound.play();
  }

  if (bird.y > config.height || bird.y < 0) {
    this.physics.pause();
    bird.setTint(0x00ff00);
    restartBirdPosition();
    const gameOverText = this.add.text(config.width / 2, config.height / 2, 'GAME OVER', { fontSize: '64px', fill: '#ffffff' });
    gameOverText.setOrigin(0.5);
  }
  if (stars.y > config.height || stars.y < 0) {
    
  }
}

function restartBirdPosition() {
  bird.x = config.width * 0.1;
  bird.y = config.height / 2;
  bird.body.velocity.y = 0;
}



function addFScreen(context) {
  context.fscreen = context.add.sprite(context.scale.width * 0.9, context.scale.height * 0.93, 'fscreen');
  context.fscreen.setInteractive().on("pointerdown", () => {
    context.scale.toggleFullscreen();
  });
}

function collectStar (bird, star)
{
    star.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0)
    {
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
        });
      }
    }
new Phaser.Game(config);