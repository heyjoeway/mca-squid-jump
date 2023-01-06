function getBGPos () {
    return 0 - scene.cameraProperty(CameraProperty.Y) + game.runtime() / 100
}
function sfxWin () {
    timer.background(function () {
        music.playMelody("G5", 500)
        music.playMelody("-", 500)
        music.playMelody("G5", 550)
        music.playMelody("C6", 150)
    })
}
let tilemapCurrent = tilemap`level`
tiles.setCurrentTilemap(tilemapCurrent)
class ObjSquiddy {
    defaultImg = assets.animation`squid`[0];
    sprite: Sprite = null;
    timeJumpStart = 0;
    stopped = false;

    constructor() {
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

        forever(() => this.loop());
    }

    startJump() {
        if (this.stopped) return;

        animation.runImageAnimation(
            this.sprite,
            assets.animation`squid`,
            100,
            false
        )
        this.timeJumpStart = game.runtime();
    }

    releaseJump() {
        if (this.stopped) return;

        animation.stopAnimation(
            animation.AnimationTypes.ImageAnimation,
            this.sprite
        );
        this.sprite.setImage(this.defaultImg)

        // Need to be on ground
        if (!this.sprite.isHittingTile(CollisionDirection.Bottom))
            return;

        let jumpPowerMax = -250 // vy
        let jumpChargeTimeMax = 1000.0 // milliseconds
        let jumpPower = (Math.min(
            game.runtime() - this.timeJumpStart,
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
        this.stopped = true;
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

    loopTiles() {
        let tileLocation = this.sprite.tilemapLocation();

        if (tiles.tileAtLocationEquals(tileLocation, assets.tile`zapfish`))
            this.win();
    }

    loop() {
        if (this.stopped) return;

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
