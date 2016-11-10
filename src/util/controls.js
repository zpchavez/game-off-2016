export const LEFT_STICK = 'LEFT_STICK';
export const RIGHT_STICK = 'RIGHT_STICK';
export const FIRE = 'FIRE';
export const DASH = 'DASH';
export const RELOAD = 'RELOAD';
export const UP = 'UP';
export const DOWN = 'DOWN';
export const SELECT = 'SELECT';

const gamepadButtonMappings = {};
gamepadButtonMappings[FIRE] = Phaser.Gamepad.XBOX360_RIGHT_BUMPER;
gamepadButtonMappings[DASH] = Phaser.Gamepad.XBOX360_LEFT_BUMPER;
gamepadButtonMappings[RELOAD] = Phaser.Gamepad.XBOX360_RIGHT_TRIGGER;
gamepadButtonMappings[UP] = Phaser.Gamepad.XBOX360_DPAD_UP;
gamepadButtonMappings[DOWN] = Phaser.Gamepad.XBOX360_DPAD_DOWN;
gamepadButtonMappings[SELECT] = [
    Phaser.Gamepad.XBOX360_RIGHT_BUMPER,
    Phaser.Gamepad.XBOX360_A
];

class Controls
{
    constructor(game)
    {
        this.leftStickX = [0, 0, 0, 0];
        this.leftStickY = [0, 0, 0, 0];
        this.rightStickX = [0, 0, 0, 0];
        this.rightStickY = [0, 0, 0, 0];
        this.onDownMappings = [{}, {}, {}, {}];
        this.onUpMappings = [{}, {}, {}, {}];

        for (var player = 0; player < 4; player += 1) {
            game.input.gamepad['pad' + (player + 1)].onAxisCallback = (
                this._getGamepadAxisCallback(player)
            );
            game.input.gamepad['pad' + (player + 1)].onDownCallback = (
                this._getGamepadDownCallback(player)
            );
            game.input.gamepad['pad' + (player + 1)].onUpCallback = (
                this._getGamepadUpCallback(player)
            );
        }

        game.input.gamepad.start();
        // Lower deadzone from default 0.26 for slightly more precise aiming
        game.input.gamepad.setDeadZones(0.20);

        this.game = game;
    }

    isDown(player, button)
    {
        if (button === LEFT_STICK && this.getLeftStickAngle(player) !== false) {
            return true;
        } else if (button === RIGHT_STICK && this.getRightStickAngle(player) !== false) {
            return true;
        } else if ([LEFT_STICK, RIGHT_STICK].indexOf(button) !== -1) {
            return;
        }

        let isDown = false;
        this._getGamepadConstants(button).forEach(buttonConstant => {
            if (this.game.input.gamepad['pad' + (player + 1)].isDown(buttonConstant)) {
                isDown = true;
            }
        });

        return isDown;
    }

    onDown(player, button, callback)
    {
        this._getGamepadConstants(button).forEach(buttonConstant => {
            this.onDownMappings[player][buttonConstant] = callback;
        });
    }

    onUp(player, button, callback)
    {
        this._getGamepadConstants(button).forEach(buttonConstant => {
            this.onUpMappings[player][buttonConstant] = callback;
        });
    }

    getLeftStickAngle(player)
    {
        return this._getStickAngle('left', player);
    }

    getRightStickAngle(player)
    {
        return this._getStickAngle('right', player);
    }

    reset()
    {
        this.onDownMappings = [{}, {}, {}, {}];
        this.onUpMappings = [{}, {}, {}, {}];
    }

    _getStickAngle(propertyPrefix, player) {
        let x, y;
        x = this[propertyPrefix + 'StickX'][player];
        y = this[propertyPrefix + 'StickY'][player];

        if (x === 0 && y === 0)
        {
            return false;
        }

        var rad = Math.atan2(y, x) + Phaser.Math.degToRad(90);
        return rad;
    }

    _getGamepadConstants(button)
    {
        if (
            typeof gamepadButtonMappings[button] === 'undefined' &&
            ['LEFT_STICK', 'RIGHT_STICK'].indexOf(button) === -1
        ) {
            throw new Error('Unknown button: ' + button);
        }

        var buttons = (
            Array.isArray(gamepadButtonMappings[button]) ?
            gamepadButtonMappings[button] :
            [gamepadButtonMappings[button]]
        );

        return buttons;
    }

    _getGamepadAxisCallback(player)
    {
        return (pad, button, value) => {
            if (button === Phaser.Gamepad.XBOX360_STICK_LEFT_X) {
                this.leftStickX[player] = value;
            } else if (button === Phaser.Gamepad.XBOX360_STICK_LEFT_Y) {
                // Allow left stick to be used to trigger onDown for UP and DOWN
                if (this.leftStickY[player] === 0) {
                    if (value < 0 && this.onDownMappings[player][gamepadButtonMappings[UP]]) {
                        this.onDownMappings[player][gamepadButtonMappings[UP]]();
                    } else if (value > 0 && this.onDownMappings[player][gamepadButtonMappings[DOWN]]) {
                        this.onDownMappings[player][gamepadButtonMappings[DOWN]]();
                    }
                }
                this.leftStickY[player] = value;
            } else if (button === Phaser.Gamepad.XBOX360_STICK_RIGHT_X) {
                this.rightStickX[player] = value;
            } else if (button === Phaser.Gamepad.XBOX360_STICK_RIGHT_Y) {
                this.rightStickY[player] = value;
            }
        };
    }

    _getGamepadDownCallback(player)
    {
        var playerMappings = this.onDownMappings[player];
        if (! playerMappings) {
            return function() {};
        }

        return function (button) {
            if (playerMappings[button]) {
                playerMappings[button]();
            }
        };
    }

    _getGamepadUpCallback(player)
    {
        var playerMappings = this.onUpMappings[player];
        if (! playerMappings) {
            return function() {};
        }

        return function (button) {
            if (playerMappings[button]) {
                playerMappings[button]();
            }
        };
    }
}

export default Controls;
