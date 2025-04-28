![Terminal Slot](https://github.com/user-attachments/assets/a308068c-0082-43a0-a731-80eab58814a7)

# Terminal Slot

This project is a terminal simulation of [Amatic](https://www.amatic.com/)'s "**Hot Scatter**" slot.\
It allows you to play the slot game, to optimize the RTP of the game, to simulate spins, and to simulate bonus buys.

![Preview](https://i.imgur.com/peAQU2r.gif)

## Features

- **Interactive**: Fully animated with reel spins, bonus teases, lines representation, flashing texts and more.
- **Real RTP**: The simulation is based on original reels and the RTP (Return to Player) is legit.
- **Crypto RNG**: Uses cryptographically secure random number generation for fair and unbiased results.
- **Bonus Game**: Just like the real game.
- **Lines**: Allows the player to select the number of active paylines for each spin.
- **Bet Sizes**: Provides a range of bet sizes for the player to choose from.
- **Auto Spin**: Automatically spins until you stop it.
- **Turbo Spin**: Spins the game and shows the outcome at the fastest possible speed.
- **SBTW**: Also known as hyper-spin, just keep spacebar pressed for the ultimate fix.
- **Information & Paytable**: Displays the winning combinations and their respective payouts.
- **Replay Spin**: Allows the player to replay their last spin in the case it wasn't finished.
- **Persistent Data**: Saves the player's balance and spin data between sessions.

## Installation

To install the project, follow these steps:

1. Clone the repository:
   ```sh
   git clone https://github.com/ntanis-dev/terminal-slot.git
   cd terminal-slot
   ```

2. Install the dependencies:
   ```sh
   npm install
   ```

## Usage

To run the project, use the following command (the default mode is PLAY):
```sh
npm start
```

### Keybinds

- `i` = Show Information
- `t` = Toggle Turbo Spin
- `a` = Toggle Auto Spin
- `arrow up` = Increase Bet
- `arrow down` = Decrease Bet
- `arrow right` = Increase Lines
- `arrow left` = Decrease Lines
- `spacebar` = Start Spin / Stop Spin

#### Cheats

- `r` = Reset Balance (500.00 €)
- `c` = Clear Balance (0.00 €)
- `b` = Minimum Bonus Spin
- `m` = Minimum Win Spin
- `n` = No Win Spin

## Modes

The project has four modes: PLAY, OPTIMIZE_RTP, SIMULATE_SPINS, and SIMULATE_BUYS.\
You can set the mode in the `index.js` file by changing the `mode` variable.

### PLAY

To play the game, set the mode to `MODES.PLAY`:
```js
const mode = MODES.PLAY
```
This mode allows you to play the slot game with the keybinds mentioned above.

### OPTIMIZE_RTP

To optimize the RTP of the game, set the mode to `MODES.OPTIMIZE_RTP`:
```js
const mode = MODES.OPTIMIZE_RTP
```
This mode attempts to optimize the reels to achieve a target RTP.

![image](https://github.com/user-attachments/assets/9aa4f057-8348-4701-b49a-9ac19d383aac)

### SIMULATE_SPINS

To simulate game spins, set the mode to `MODES.SIMULATE_SPINS`:
```js
const mode = MODES.SIMULATE_SPINS
```
This mode simulates a specified number of spins and logs the results.

![image](https://github.com/user-attachments/assets/e3d60515-9987-4c9a-a5b8-7abbdd962e63)

### SIMULATE_BUYS

To simulate bonus buys, set the mode to `MODES.SIMULATE_BUYS`:
```js
const mode = MODES.SIMULATE_BUYS
```
This mode simulates a specified number of bonus buys and logs the results.

![image](https://github.com/user-attachments/assets/36f0729a-b3c0-4045-a473-9fa748058fe2)

## Settings

There are various settings you can change on each mode.\
Read the comments in `index.js` file for more information.
