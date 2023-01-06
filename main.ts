function getBGPos () {
    return 0 - scene.cameraProperty(CameraProperty.Y) + game.runtime() / 100
}
function sfxWin () {
    timer.background(function () {
        music.playMelody("G5 -", 500)
        music.playMelody("G5", 550)
        music.playMelody("C6", 150)
    })
}

function sfxJellyfish() {
    timer.background(() => {
        music.playSoundEffect(music.createSoundEffect(WaveShape.Square, 2437, 2482, 74, 43, 100, SoundExpressionEffect.None, InterpolationCurve.Linear), SoundExpressionPlayMode.UntilDone);
    });
}

function sfxBlowfish() {
    sfxJellyfish();

    timer.background(() => {
        music.playSoundEffect(music.createSoundEffect(WaveShape.Square, 208, 565, 255, 88, 500, SoundExpressionEffect.Vibrato, InterpolationCurve.Linear), SoundExpressionPlayMode.UntilDone)
    });
}

class Obj {
    stopped = false;

    constructor() {
        timer.background(() => {
            while (!this.stopped) {
                this.loop()
                pause(16);
            }
        })
    }

    loop() { }
    stop() { this.stopped = true; }
}

class ObjSparkle extends Obj {
    player: ObjSquiddy = null;
    sprite: Sprite = null;

    constructor(player: ObjSquiddy) {
        super();
        this.player = player;
        let anim = assets.animation`sparkle`;
        this.sprite = sprites.create(
            anim[0],
            SpriteKind.Text
        );
        animation.runImageAnimation(
            this.sprite,
            anim,
            200, // interval
            true // loop
        )
    }

    loop() {
        let parent = this.player.sprite;
        this.sprite.setPosition(parent.x, parent.y);
        if (!this.player.canAirJump()) this.stop();
    }

    stop() {
        super.stop();
        this.sprite.destroy();
    }
}

let tilemapCurrent = tilemap`level`
tiles.setCurrentTilemap(tilemapCurrent)
class ObjSquiddy extends Obj {
    defaultImg = assets.animation`squid`[0];
    sprite: Sprite = null;
    timeJumpStart = 0;

    constructor() {
        super();

        this.sprite = sprites.create(this.defaultImg, SpriteKind.Player);
        this.sprite.setStayInScreen(false);

        this.sprite.ay = 225       
        this.sprite.y = tilemapCurrent.height * 16 - 8
        this.sprite.x = 6 * 16;

        // Squid jump anim start
        controller.A.onEvent(
            ControllerButtonEvent.Pressed,
            () => this.startJump()
        );
        controller.A.onEvent(
            ControllerButtonEvent.Released,
            () => this.releaseJump()
        );
    }

    startJump() {
        if (this.stopped) return;

        timer.background(() => {
            animation.runImageAnimation(
                this.sprite,
                assets.animation`squid`,
                100,
                false
            );
            pause(1000);
            if (this.stopped) return;
            if (this.timeJumpCharge() < 1000 - 16) return; // Give 1 frame leeway, just in case
            if (!controller.A.isPressed()) return;
            animation.runImageAnimation(
                this.sprite,
                assets.animation`squid-charged`,
                80,
                true
            );
        });
        this.timeJumpStart = game.runtime();
    }

    airJumpTime = -Infinity;
    airJumpTimeMax = 10 * 1000;

    canAirJump() {
        console.log(game.runtime() - this.airJumpTime);
        return game.runtime() - this.airJumpTime < this.airJumpTimeMax
    }

    onGround() {
        return this.sprite.isHittingTile(CollisionDirection.Bottom)
    }

    timeJumpCharge() {
        return game.runtime() - this.timeJumpStart;
    }

    releaseJump() {
        if (this.stopped) return;

        animation.stopAnimation(
            animation.AnimationTypes.ImageAnimation,
            this.sprite
        );
        this.sprite.setImage(this.defaultImg)

        // Need to be on ground (unless air jump active)
        if (!this.canAirJump()) {
            if (!this.onGround())
                return;
        }

        let jumpPowerMax = -250 // vy
        let jumpChargeTimeMax = 1000.0 // milliseconds
        let jumpPower = (Math.min(
            this.timeJumpCharge(),
            jumpChargeTimeMax
        ) / jumpChargeTimeMax) * jumpPowerMax
        this.sprite.vy = Math.min(this.sprite.vy, jumpPower)

        music.playSoundEffect(
            music.createSoundEffect(WaveShape.Square, 1902, 253, 88, 7, 250, SoundExpressionEffect.Tremolo, InterpolationCurve.Logarithmic),
            SoundExpressionPlayMode.UntilDone
        );
    }

    loopCamera() {
        scene.centerCameraAt(6 * 16, this.sprite.y);
    }

    loopBounds() {
        let leftBound = 8;
        let rightBound = leftBound * 2 + screen.width;
        if (this.sprite.x < leftBound) this.sprite.x = rightBound;
        else if (this.sprite.x > rightBound) this.sprite.x = leftBound;
    }

    stop() {
        super.stop();
        this.sprite.vx = 0;
        this.sprite.vy = 0;
        this.sprite.ax = 0;
        this.sprite.ay = 0;
    }

    win() {
        this.stop();
        sfxWin();
        
        let bgSprite = sprites.create(assets.image`winBg`, SpriteKind.Text);
        bgSprite.x = scene.cameraLeft() + (screen.width / 2);
        bgSprite.y = scene.cameraTop() + (screen.height / 2);

        let textItems = [
            { x: 0, y: -12, text: "GOAL!" },
            { x: 0, y: 0, text: "STAGE BONUS 300" },
            { x: 0, y: 12, text: "TIME BONUS 100" }
        ];

        textItems.forEach(item => {
            let textSprite = textsprite.create(item.text);
            textSprite.x = item.x + scene.cameraLeft() + (screen.width / 2);
            textSprite.y = item.y + scene.cameraTop() + (screen.height / 2);
            textSprite.setMaxFontHeight(6);
        });
    }

    getJellyfish(tileLocation: tiles.Location) {
        tiles.setTileAt(tileLocation, assets.tile`blank`);
        sfxJellyfish();
        this.airJumpTime = game.runtime();
        new ObjSparkle(this);
    }

    getBlowfish(tileLocation: tiles.Location) {
        tiles.setTileAt(tileLocation, assets.tile`blank`);
        sfxBlowfish();
        this.sprite.vy = -300;
    }

    loopTiles() {
        let tileLocation = this.sprite.tilemapLocation();

        if (tiles.tileAtLocationEquals(tileLocation, assets.tile`zapfish`))
            this.win();
        else if (tiles.tileAtLocationEquals(tileLocation, assets.tile`blowfish`))
            this.getBlowfish(tileLocation);
        else if (tiles.tileAtLocationEquals(tileLocation, assets.tile`jellyfish`))
            this.getJellyfish(tileLocation);
    }

    loop() {
        if (this.sprite.vy < 0) {
            this.sprite.setFlag(SpriteFlag.GhostThroughWalls, true);
        } else {
            this.sprite.setFlag(SpriteFlag.GhostThroughWalls, false);
        }

        let squiddyAcc = 100;
        if (this.sprite.isHittingTile(CollisionDirection.Bottom)) {
            this.sprite.ax = 0;
            this.sprite.vx = 0;
        } if (controller.left.isPressed())
            this.sprite.ax = -squiddyAcc;
        else if (controller.right.isPressed())
            this.sprite.ax = squiddyAcc;
        else
            this.sprite.ax = 0;

        this.loopBounds();
        this.loopCamera();
        this.loopTiles();
    }
}
scene.setBackgroundImage(assets.image`bg`)
let squiddy = new ObjSquiddy();
forever(function () {
    // Adjust BG pos
    scroller.setBackgroundScrollOffset(0, getBGPos())
})
