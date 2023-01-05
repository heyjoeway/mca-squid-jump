let tilemapCurrent = tilemap`level`;
tiles.setCurrentTilemap(tilemapCurrent);

class ObjSquiddy {
    defaultImg = assets.animation`squid`[0];
    sprite: Sprite = null;
    timeJumpStart = 0;

    constructor() {
        this.sprite = sprites.create(this.defaultImg, SpriteKind.Player);
        this.sprite.setStayInScreen(false);

        this.sprite.ay = 225
        scene.cameraFollowSprite(this.sprite)
        this.sprite.y = tilemapCurrent.height * 16 - 8

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
        animation.runImageAnimation(
            this.sprite,
            assets.animation`squid`,
            100,
            false
        )
        this.timeJumpStart = game.runtime();
    }

    releaseJump() {
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
    }
}

scene.setBackgroundImage(assets.image`bg`)

function getBGPos() {
    return (
        -scene.cameraProperty(CameraProperty.Y) +
        game.runtime() / 100
    );
}

forever(() => {
    // Adjust BG pos
    scroller.setBackgroundScrollOffset(0, getBGPos());
});

let squiddy = new ObjSquiddy();