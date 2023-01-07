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
function sfxMiss () {
    timer.background(function () {
        music.playSoundEffect(music.createSoundEffect(WaveShape.Sawtooth, 90, 46, 255, 255, 100, SoundExpressionEffect.Vibrato, InterpolationCurve.Logarithmic), SoundExpressionPlayMode.UntilDone)
        pause(50)
        music.playSoundEffect(music.createSoundEffect(WaveShape.Sawtooth, 90, 46, 255, 255, 200, SoundExpressionEffect.Vibrato, InterpolationCurve.Logarithmic), SoundExpressionPlayMode.UntilDone)
    })
}

class Level {
    bgHue: number = null;
    platformDistance: Array<number> = null;
    platformWidth: Array<number> = null;
    tileProbability: Array<any> = null;
    itemCounts: Array<any> = null;

    constructor(
        platformDistance: Array<number>,
        platformWidth: Array<number>,
        tileProbability: Array<any>,
        itemCounts: Array<any>,
        bgHue: number = null
    ) {
        this.platformDistance = platformDistance;
        this.platformWidth = platformWidth;
        this.tileProbability = tileProbability;
        this.bgHue = bgHue;
        this.itemCounts = itemCounts;
    }

    generate() {
        // Seed RNG with level id to get consistent generations
        let rng = new Math.FastRandom(level * 1000);
        // Waste RNG (seems to have distribution issues?)
        for (let i = 0; i < level * 2; i++)
            rng.next();

        // Redefine randint to use seeded rng
        let randint = function (min: number, max: number) {
            return Math.round(rng.randomRange(min, max));
        }

        let bgHue = this.bgHue;
        console.log(bgHue)
        if (bgHue == null) {
            bgHue = (rng.next() / 0xFFFF) * 360;
        }
        console.log(bgHue)


        let colorBG = color.HSL.fromHexValue(0x2F3169);
        colorBG.hue = bgHue;
        let colorStars = color.HSL.fromHexValue(0x6B5394);
        colorStars.hue = bgHue;

        color.setColor(8, colorBG.hexValue());
        color.setColor(11, colorStars.hexValue());

        tilemapCurrent = tilemap`level`;
        tiles.setTilemap(tilemapCurrent);

        function randomTile(tileProbability: Array<any>) {
            let value = rng.randomRange(0, 100) / 100.0;
            let total = 0;
            for (let i = 0; i < tileProbability.length - 1; i++) {
                let probability = tileProbability[i].probability;
                if (probability + total >= value)
                    return tileProbability[i].tile;
                total += probability;
            }
            return tileProbability[tileProbability.length - 1].tile;
        }

        let y = tilemapCurrent.height - 6;
        // Create platforms
        // We leave a roughly square area around the zapfish
        while (y > tilemapCurrent.width) {
            let x = randint(0, tilemapCurrent.width - 1);
            let width = randint(this.platformWidth[0], this.platformWidth[1]);
            let tile = randomTile(this.tileProbability);
            for (let i = 0; i < width; i++) {
                x = (x + 1) % tilemapCurrent.width;
                let tileLocation = tiles.getTileLocation(x, y);
                tiles.setTileAt(tileLocation, tile);
                tiles.setWallAt(tileLocation, true);
            }
            y -= randint(this.platformDistance[0], this.platformDistance[1]);
        }

        this.itemCounts.forEach(item => {
            let count = item.count;
            while (count > 0) {
                let tileLocation = tiles.getTileLocation(
                    randint(2, 10),
                    randint(tilemapCurrent.width, tilemapCurrent.height)
                );
                if (tiles.tileAtLocationIsWall(tileLocation))
                    continue;
                tiles.setTileAt(tileLocation, item.tile)
                count -= 1;
            }
        });
    }
}

let level = 1

let levelDataFirst = new Level(
    [4, 6],
    [4, 6],
    [{
        tile: assets.tile`ground`,
        probability: 1
    }],
    [],
    238
);

let levelData1 = new Level(
    [4, 8],
    [4, 6],
    [{
        tile: assets.tile`ground`,
        probability: 1
    }],
    [{
        tile: assets.tile`blowfish`,
        count: 5
    }]
);

let levelData2 = new Level(
    [4, 8],
    [4, 5],
    [{
        tile: assets.tile`ground`,
        probability: 1
    }],
    [{
        tile: assets.tile`blowfish`,
        count: 5
    }]
);

let levelData3 = new Level(
    [6, 8],
    [3, 4],
    [{
        tile: assets.tile`ground`,
        probability: 0.75
    },{
        tile: assets.tile`ice`,
        probability: 0.25
    }],
    [{
        tile: assets.tile`jellyfish`,
        count: 5
    }]
);

let levelData4 = new Level(
    [6, 8],
    [3, 4],
    [{
        tile: assets.tile`ground`,
        probability: 0.5
    }, {
        tile: assets.tile`ice`,
        probability: 0.5
    }],
    [{
        tile: assets.tile`blowfish`,
        count: 3
    },{
        tile: assets.tile`jellyfish`,
        count: 2
    }]
);

let levelData5 = new Level(
    [6, 8],
    [3, 4],
    [{
        tile: assets.tile`ice`,
        probability: 1
    }],
    [{
        tile: assets.tile`jellyfish`,
        count: 5
    }]
);

let levelData6 = new Level(
    [6, 8],
    [2, 3],
    [{
        tile: assets.tile`ice`,
        probability: 1
    }],
    [{
        tile: assets.tile`blowfish`,
        count: 3
    },{
        tile: assets.tile`jellyfish`,
        count: 2
    }]
);


let levelData7 = new Level(
    [7, 8],
    [2, 3],
    [{
        tile: assets.tile`ground`,
        probability: 0.25
    }, {
        tile: assets.tile`ice`,
        probability: 0.75
    }],
    [{
        tile: assets.tile`blowfish`,
        count: 3
    }, {
        tile: assets.tile`jellyfish`,
        count: 2
    }]
);

let levelData = [
    levelDataFirst,
    levelData1,
    levelData1,
    levelData2,
    levelData2,
    levelData3,
    levelData3,
    levelData4,
    levelData4,
    levelData5,
    levelData5,
    levelData6,
    levelData6,
    levelData7,
    levelData7
];

function sfxBlowfish () {
    sfxJellyfish()
    timer.background(function () {
        music.playSoundEffect(music.createSoundEffect(WaveShape.Square, 208, 565, 255, 88, 500, SoundExpressionEffect.Vibrato, InterpolationCurve.Linear), SoundExpressionPlayMode.UntilDone)
    })
}
function repeatChar (count: number, ch: string) {
    if (count == 0) {
        return ""
    }
    count2 = count / 2
    result = ch
    while (result.length <= count2) {
        result = "" + result + result
    }
    return "" + result + result[0, count - result.length - 1]
}
let result = ""
let count2 = 0
let tileset: Image[] = []
let tilemapCurrent: tiles.TileMapData = null
let hiscore = 0
let score = 0
let lives = 2
if (blockSettings.exists("hiscore")) {
    hiscore = blockSettings.readNumber("hiscore")
}
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
        this.sprite.y = tilemapCurrent.height * 16 - 40
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
            music.createSoundEffect(WaveShape.Square, 313, 936, 0, 5, 100, SoundExpressionEffect.Tremolo, InterpolationCurve.Linear),
            SoundExpressionPlayMode.UntilDone
        );
    }

    loopCamera() {
        scene.centerCameraAt(6 * 16, this.sprite.y - 16);
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
        new ObjMsgWin(this.time());
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
        // Top solid platforms
        if (this.sprite.vy < 0) {
            this.sprite.setFlag(SpriteFlag.GhostThroughWalls, true);
        } else {
            this.sprite.setFlag(SpriteFlag.GhostThroughWalls, false);
        }

        // Keep in bounds
        if (this.sprite.y < 0)
            this.sprite.y = 0;

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
    stageBonus = 300;
    timeBonus = 0;
    time = 0;

    constructor(time: number) {
        super();
    }

    newScore() {
        return score + this.stageBonus + this.timeBonus;
    }

    init() {
        let timeBonusMax = 500;
        let timeBonusWidth = 16;
        let timeBonusStart = 24;
        this.timeBonus = Math.max(
            0,
            Math.min(
                timeBonusMax,
                (
                    (
                        (-this.time / 1000) +
                        timeBonusWidth +
                        timeBonusStart
                    ) / timeBonusWidth
                ) * timeBonusMax
            )
        );

        let newScore = this.newScore();
        let hiscoreText = `HISCORE ${hiscore}`;

        if (newScore > hiscore) {
            hiscore = newScore;
            blockSettings.writeNumber("hiscore", hiscore)
            hiscoreText = "NEW HISCORE!";
        }

        this.pauseTime = 5000;
        this.items = [
            new ObjMsgItem(0, -24, "GOAL!"),
            new ObjMsgItem(0, -12, `STAGE BONUS ${this.stageBonus}`),
            new ObjMsgItem(0, 0, `TIME BONUS ${this.timeBonus}`),
            new ObjMsgItem(0, 12, `TOTAL ${newScore}`),
            new ObjMsgItem(0, 24, hiscoreText),
        ];
        sfxWin();
    }

    after() {
        score = this.newScore();
        level++;
        gameMode.destroy();
        gameMode = new ObjGameModeMain(tilemapCurrent);
    }
}
class ObjMsgGameOver extends ObjMsg {
    init() {
        this.pauseTime = 5000;
        this.items = [
            new ObjMsgItem(0, 0, "GAME OVER!"),
        ];
    }

    after() { game.reset(); }
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
        if (lives == 0) {
            new ObjMsgGameOver();
            return;
        }
        
        lives--;
        gameMode.destroy();
        gameMode = new ObjGameModeMain(tilemapCurrent);
    }
}
function rightJustify(text: any, length: number, char: string) {
    if (text == 0)
        return repeatChar(length, char)

    let paddingLength = length - convertToText(text).length;
    let padding = repeatChar(paddingLength, char);
    return padding + convertToText(text);
}
class ObjHUD extends Obj {
    _bgSprite: Sprite = null;
    _timerSprite: TextSprite = null;
    _scoreSprite: TextSprite = null;
    _livesSprites: Sprite[] = [];
    _levelSprite: TextSprite = null;
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

        this._levelSprite = textsprite.create(`LEVEL ${level}`, 0, 1);
        this._levelSprite.setFlag(SpriteFlag.RelativeToCamera, true);
        this._levelSprite.x = 22;
        this._levelSprite.y = 116;

        timer.background(() => {
            pause(2000);
            this._levelSprite.destroy();

            this._scoreSprite = textsprite.create(
                rightJustify(score, 8, "0"),
                0, 1
            );
            this._scoreSprite.setFlag(SpriteFlag.RelativeToCamera, true);
            this._scoreSprite.x = 24;
            this._scoreSprite.y = 116;
        });

        let lifeWidth = 8;
        let livesWidth = lives * lifeWidth;
        for (let i = 0; i < lives; i++) {
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
        
        levelData[Math.min(level-1,levelData.length-1)].generate();
        scene.setBackgroundColor(8);
        scroller.setLayerImage(
            scroller.BackgroundLayer.Layer0,
            assets.image`bg`
        )
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
/*
    Order is:
    0: ?
    1: white
    2: red (blowfish)
    3: pink (charging)
    4: light orange (ground)
    5: yellow (charging)
    6: dark sky blue
    7: ?
    8: dark purple (bg)
    9: light sky blue (ice, jellyfish)
    10: purple (water)
    11: stars
    12: grey (eyes)
    13: ?
    14: brown (ground)
    15: black
*/
color.setPalette(color.bufferToPalette(hex`
    000000
    FFFFFF
    FF1856
    FF98B4
    ffb293
    FFFF00
    38a3cd
    000000
    2F3169
    9bddff
    7C169E
    6B5394
    555555
    000000
    87513C
    000000
`))
let gameMode = new ObjGameModeMain(assets.tilemap`level`);