'use strict';

const _ = require('lodash');

const game = window.game;

const Gus = require('./gus');
const ParticleBurst = require( "../particles/burst" );

const COLLISION_GROUPS = require( "../consts/collisionGroups" );
const EPSILON = require( "../consts" ).EPSILON;
const TAU = require( "../consts" ).TAU;

const FRAMES_PER_COURSE_CORRECTION = 10;

class RecordingGus extends Gus {
  constructor(x, y) {
    super(x, y);

    this.startTime = game.time.now;

    this.inputRecords = [];

    this.courseCorrectionRecords = [];
    this.framesSinceCourseCorrectionRecord = 0;

    this.currentRecord = { input: [0] };

  }

  getTime() {
    return game.time.now - this.startTime;
  }

  recordInput() {
    const input = [];
    const spacebar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    // not sure what's supposed to happen if both are held down,
    // but I'm defaulting to the 'right' action
    if (game.cursors.left.isDown) input.push(1);
    if (game.cursors.right.isDown) input.push(2);
    if (spacebar.isDown) input.push(3);
    if (!input.length) input.push(0);
    if (!_.isEqual(this.currentRecord.input, input)){
      this.inputRecords.push({
        input: this.currentRecord.input,
        endTime: this.getTime()
      });
      this.currentRecord.input = input;
    }

  }

  recordCourseCorrection() {
    this.courseCorrectionRecords.push({
      x: this.sprite.x,
      y: this.sprite.y,
      time: this.getTime()
    })
  }

  recordInput() {
    const input = [];
    const spacebar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    // not sure what's supposed to happen if both are held down,
    // but I'm defaulting to the 'right' action
    if (game.cursors.left.isDown) input.push(1);
    if (game.cursors.right.isDown) input.push(2);
    if (spacebar.isDown) input.push(3);
    if (!input.length) input.push(0);
    if (!_.isEqual(this.currentRecord.input, input)){
      this.inputRecords.push({
        input: this.currentRecord.input,
        endTime: this.getTime()
      });
      this.currentRecord.input = input;
    }

  }

  kill() {
    this.inputRecords = this.inputRecords.reverse();
    this.courseCorrectionRecords = this.courseCorrectionRecords.reverse();

    const recordNode = document.getElementById('arr');
    if (recordNode) recordNode.textContent = JSON.stringify(this.inputRecords) + '\n\n' + JSON.stringify(this.courseCorrectionRecords);

    new ParticleBurst( this.sprite.position.x, this.sprite.position.y, "GusHead", {
      lifetime: 5000,
      count: 14,
      scaleMin: 0.4,
      scaleMax: 1.0,
      speed: 100,
      fadeOut: true
    });

    this.sprite.visible = false;
    this.isDead = true;

    this.sprite.body.velocity.x = 0;
    this.sprite.body.velocity.y = 0;

  }

  update() {
    this.recordInput();

    if (this.framesSinceCourseCorrectionRecord === FRAMES_PER_COURSE_CORRECTION) {
      this.recordCourseCorrection();
      this.framesSinceCourseCorrectionRecord = 0;
    } else {
      this.framesSinceCourseCorrectionRecord++;
    }

    // clear horizontal movement
    if (Math.abs(Math.cos(this.rotation)) > EPSILON) this.sprite.body.velocity.x = 0;
    else this.sprite.body.velocity.y = 0;

    // check to see if we're rotating
    if (this.rotating) {

      // stop all movement
      this.stop();
      this.sprite.body.velocity.y = 0;
      this.sprite.body.velocity.x = 0;

      // create a rotate tween
      if (this.rotateTween === undefined) {
        this.rotateTween = game.add.tween(this.sprite).to({
            rotation: this.targetRotation
          }, 300, Phaser.Easing.Default, true)
          .onComplete.add(function() {
            this.rotation = this.targetRotation % (TAU); // keep angle within 0-2pi
            this.finishRotation();
          }, this);
      }

    } else if (!this.isDead) {

      // do gravity
      this.applyGravity();

      if (this.rotationSensor.needsCollisionData) {
        this.setCollision();
        this.rotationSensor.needsCollisionData = false;
      }

      // check for input
      if (game.cursors.left.isDown) {
        this.walk("left");
      } else if (game.cursors.right.isDown) {
        this.walk("right");
      } else {
        this.stop();
      }

      if (!this.isTouching("down")) {
        this.fallTime += game.time.physicsElapsedMS;

        if (this.fallTime > this.killTime) {
          this.kill();
        }

      } else {
        this.fallTime = 0;
      }

    }

  }
}

module.exports = RecordingGus;
