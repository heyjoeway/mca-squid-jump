function sfxWin () {
    timer.background(function () {
        music.playMelody("G5 -", 500)
        music.playMelody("G5", 550)
        music.playMelody("C6", 150)
    })
}
function sfxJellyfish () {
    timer.background(function () {
        music.playSoundEffect(music.createSoundEffect(WaveShape.Square, 2437, 2482, 74, 43, 100, SoundExpressionEffect.None, InterpolationCurve.Linear), SoundExpressionPlayMode.UntilDone)
    })
}
function sfxBlowfish () {
    sfxJellyfish()
    timer.background(function () {
        music.playSoundEffect(music.createSoundEffect(WaveShape.Square, 208, 565, 255, 88, 500, SoundExpressionEffect.Vibrato, InterpolationCurve.Linear), SoundExpressionPlayMode.UntilDone)
    })
}

function sfxMiss() {
    timer.background(function () {
        music.playSoundEffect(music.createSoundEffect(WaveShape.Sawtooth, 90, 46, 255, 255, 100, SoundExpressionEffect.Vibrato,InterpolationCurve.Logarithmic), SoundExpressionPlayMode.UntilDone)
        pause(50);
        music.playSoundEffect(music.createSoundEffect(WaveShape.Sawtooth, 90, 46, 255, 255, 200, SoundExpressionEffect.Vibrato,InterpolationCurve.Logarithmic), SoundExpressionPlayMode.UntilDone)
    })
}

let tilemapCurrent: tiles.TileMapData = null
class ForeverStopable {
    stopped = false;

    constructor(func: Function) {
        timer.background(() => {
            while (!this.stopped) {
                func();
                pause(16);
            }
        })
    }

    stop() { this.stopped = true; }
}

class Obj {
    stopped = false;
    loopRunner: ForeverStopable = null;

    constructor() {
        this.loopRunner = new ForeverStopable(() => {
            this.loop()
        });
    }

    loop() { }
    stop() {
        this.stopped = true;
        this.loopRunner.stop();
    }
    destroy() {
        this.stop();
        this._cleanup();
    }
    _cleanup() { }
}
class ObjWater extends Obj {
    sprite: Sprite = null; 
    position = 0;

    constructor() {
        super();
        this.sprite = sprites.create(
            assets.image`water`,
            SpriteKind.Enemy
        );
        this.position = (tilemapCurrent.height * 16) * 1.5;
        this.sprite.x = 6 * 16;
    }

    loop() {
        // Workaround for rounding error (?)
        this.position -= 45 / 60;
        this.sprite.y = this.position;
    }

    _cleanup() {
        super._cleanup();
        this.sprite.destroy();
    }
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
        if (!this.player.hasAirJump()) this.stop();
    }

    stop() {
        super.stop();
        this.sprite.destroy();
    }

    _cleanup() {
        super._cleanup();
        this.sprite.destroy();
    }
}
class ObjSquiddy extends Obj {
    defaultImg = assets.animation`squid`[0];
    sprite: Sprite = null;
    timeJumpStart = 0;
    timeStart = 0;

    constructor() {
        super();

        this.timeStart = game.runtime();

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
        sprites.onOverlap(
            SpriteKind.Player,
            SpriteKind.Enemy,
            (sprite: Sprite, otherSprite: Sprite) => {
                if (sprite != this.sprite) return;
                if (this.stopped) return;
                gameMode.stop();
                new ObjMsgMiss();
            }
        );

        // Hack to fix camera jitter :)
        game.currentScene().eventContext.registerFrameHandler(
            15,
            () => this.loopCamera()
        );
    }

    time() {
        return game.runtime() - this.timeStart;
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
    airJumpCount = 0;
    airJumpCountMax = 1;

    hasAirJump() {
        return game.runtime() - this.airJumpTime < this.airJumpTimeMax
    }

    canAirJump() {
        return this.hasAirJump() && (this.airJumpCount < this.airJumpCountMax);
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

        if (!this.onGround() && this.canAirJump())
            this.airJumpCount++;

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
        gameMode.stop();
        new ObjMsgWin();
    }

    getJellyfish(tileLocation: tiles.Location) {
        tiles.setTileAt(tileLocation, assets.tile`blank`);
        sfxJellyfish();
        this.airJumpTime = game.runtime();
        this.airJumpCount = 0;
        new ObjSparkle(this);
    }

    getBlowfish(tileLocation: tiles.Location) {
        tiles.setTileAt(tileLocation, assets.tile`blank`);
        sfxBlowfish();
        this.sprite.vy = -300;
        this.airJumpCount = 0;
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
            if (!this.sprite.tileKindAt(TileDirection.Bottom, assets.tile`ice`)) {
                this.sprite.ax = 0;
                this.sprite.vx = 0;
            }
            this.airJumpCount = 0;
        } if (controller.left.isPressed())
            this.sprite.ax = -squiddyAcc;
        else if (controller.right.isPressed())
            this.sprite.ax = squiddyAcc;
        else
            this.sprite.ax = 0;

        this.loopBounds();
        this.loopTiles();
    }

    _cleanup() {
        super._cleanup();
        this.sprite.destroy();
    }
}

class ObjMsgItem extends Obj{
    x = 0;
    y = 0;
    text = "";
    _textSprite: TextSprite = null;

    constructor(x: number, y: number, text: string) {
        super();
        this.x = x;
        this.y = y;
        this.text = text;
    }

    draw() {
        this._textSprite = textsprite.create(this.text);
        this._textSprite.setFlag(SpriteFlag.RelativeToCamera, true);
        this._textSprite.x = this.x + (screen.width / 2);
        this._textSprite.y = this.y + (screen.height / 2);
        this._textSprite.setMaxFontHeight(6);
    }

    _cleanup() {
        super._cleanup();
        this._textSprite.destroy();
    }
}

class ObjMsg extends Obj {
    items: ObjMsgItem[] = [];
    pauseTime = 5000;

    _bgSprite: Sprite = null;

    init() { }
    after() { }

    constructor() {
        super();
        this.init();

        this._bgSprite = sprites.create(assets.image`msgBg`, SpriteKind.Text);
        this._bgSprite.x = screen.width / 2;
        this._bgSprite.y = screen.height / 2;
        this._bgSprite.setFlag(SpriteFlag.RelativeToCamera, true);

        this.items.forEach(item => item.draw());

        timer.background(() => {
            pause(this.pauseTime);
            this.after();
            this.destroy();
        })
    }

    _cleanup() {
        super._cleanup();
        this._bgSprite.destroy();
        this.items.forEach(item => item.destroy());
    }
}

class ObjMsgWin extends ObjMsg {
    init() {
        this.pauseTime = 5000;
        this.items = [
            new ObjMsgItem(0, -12, "GOAL!"),
            new ObjMsgItem(0, 0, "STAGE BONUS 300"),
            new ObjMsgItem(0, 12, "TIME BONUS 100")
        ];
        sfxWin();
    }

    after() {
        gameMode.destroy();
        gameMode = new ObjGameModeMain(tilemapCurrent);
    }
}

class ObjMsgMiss extends ObjMsg {
    init() {
        this.pauseTime = 1800;
        this.items = [
            new ObjMsgItem(0, 0, "MISS!"),
        ];
        sfxMiss();
    }

    after() {
        gameMode.destroy();
        gameMode = new ObjGameModeMain(tilemapCurrent);
    }
}

function repeatChar(count: number, ch: string) {
    if (count == 0) {
        return "";
    }
    let count2 = count / 2;
    let result = ch;

    // double the input until it is long enough.
    while (result.length <= count2) {
        result += result;
    }
    // use substring to hit the precise length target without
    // using extra memory
    return result + result[0, count - result.length - 1];
}

function rightJustify(text: any, length: number, char: string) {
    let paddingLength = length - convertToText(text).length;
    let padding = repeatChar(paddingLength, char);
    return padding + text;
}

class ObjHUD extends Obj {
    _bgSprite: Sprite = null;
    _timerSprite: TextSprite = null;
    _scoreSprite: TextSprite = null;
    _livesSprites: Sprite[] = [];
    sprites: Sprite[] = null;
    player: ObjSquiddy = null;

    constructor(player: ObjSquiddy) {
        super();
        this.player = player;
        this._bgSprite = sprites.create(assets.image`hudBg`, SpriteKind.Text);
        this._bgSprite.setFlag(SpriteFlag.RelativeToCamera, true);

        this._timerSprite = textsprite.create("00:00:00", 0, 1);
        this._timerSprite.setFlag(SpriteFlag.RelativeToCamera, true);
        this._timerSprite.x = 136;
        this._timerSprite.y = 116;

        this._scoreSprite = textsprite.create("00000000", 0, 1);
        this._scoreSprite.setFlag(SpriteFlag.RelativeToCamera, true);
        this._scoreSprite.x = 24;
        this._scoreSprite.y = 116;

        let lives = 2;
        let lifeWidth = 8;
        let livesWidth = lives * lifeWidth;
        for (let i = 0; i < 2; i++) {
            let livesSprite = sprites.create(assets.image`life`, SpriteKind.Text);
            livesSprite.setFlag(SpriteFlag.RelativeToCamera, true);
            livesSprite.x = (screen.width / 2) + (livesWidth / 2) - (i * lifeWidth) - 3;
            livesSprite.y = 116;
            this._livesSprites.push(livesSprite);
        }
    }

    loop() {
        let time = this.player.time();
        let minutes = Math.floor(time / (60 * 1000));
        let seconds = Math.floor(time / 1000) % 60;
        let centiseconds = Math.floor((time % 1000) / 10);
        let timerText = (
            rightJustify(minutes, 2, "0") + ":" +
            rightJustify(seconds, 2, "0") + ":" +
            rightJustify(centiseconds, 2, "0")
        );
        this._timerSprite.setText(timerText);

        if (this.player.stopped) this.stop();
    }

    _cleanup() {
        this._timerSprite.destroy();
        this._scoreSprite.destroy();
        this._livesSprites.forEach(x => x.destroy());

    }
}

let tilemapCurrentName = "level"
class ObjGameModeMain extends Obj {
    squiddy: ObjSquiddy = null;
    water: ObjWater = null;
    hud: ObjHUD = null;

    constructor(tilemap: tiles.TileMapData) {
        super();
        
        tilemapCurrent = helpers.getTilemapByName(tilemapCurrentName);
        tiles.setCurrentTilemap(tilemapCurrent);
        scene.setBackgroundImage(assets.image`bg`);
        this.squiddy = new ObjSquiddy();
        this.water = new ObjWater();
        this.hud = new ObjHUD(this.squiddy);

        // Hack to fix camera jitter :)
        game.currentScene().eventContext.registerFrameHandler(
            15,
            () => this.loopBG()
        );
    }

    getBGPos() {
        return 0 - scene.cameraProperty(CameraProperty.Y) + game.runtime() / 100
    }

    loopBG() {
        scroller.setBackgroundScrollOffset(0, this.getBGPos())
    }

    stop() {
        super.stop();
        this.squiddy.stop();
        this.water.stop();
    }

    _cleanup() {
        super._cleanup();
        this.squiddy.destroy();
        this.water.destroy();
    }
}
let gameMode = new ObjGameModeMain(assets.tilemap`level`);
