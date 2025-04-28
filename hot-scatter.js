import fs from 'fs'
import path from 'path'
import url from 'url'
import crypto from 'crypto'
import chalk from 'chalk'
import stripAnsi from 'strip-ansi'
import keypress from 'keypress'
import cliProgress from 'cli-progress'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)
const randomValue = a => a[Math.floor(Math.random() * a.length)]

class HotScatter {
    constructor() {
        process.title = 'HOT SCATTER'

        this.settings = {}

        this.consoleArt = chalk.bold(`${chalk.hex('e43606')('H')}${chalk.hex('dc5414')('O')}${chalk.hex('da5238')('T')} ${chalk.hex('ffd700')('SCATTER')}`)

        this.symbols = [
            {
                name: 'seven',
                emoji: '💰',
                payouts: [0, 10, 100, 500]
            },

            {
                name: 'watermelon',
                emoji: '🍉',
                payouts: [0, 4, 20, 40]
            },

            {
                name: 'grape',
                emoji: '🍇',
                payouts: [0, 4, 20, 40]
            },

            {
                name: 'blueberry',
                emoji: '🫐',
                payouts: [0, 2, 5, 20]
            },

            {
                name: 'orange',
                emoji: '🍊',
                payouts: [0, 1, 4, 15]
            },

            {
                name: 'lemon',
                emoji: '🍋',
                payouts: [0, 1, 4, 15]
            },

            {
                name: 'cherry',
                emoji: '🍒',
                payouts: [0.5, 1, 2.5, 10]
            },

            {
                name: 'scatter',
                emoji: '✨',
                payouts: [0, 2, 10, 50]
            },
        ]

        for (let index = 0; index < this.symbols.length; index++)
            this.symbols[index].index = index

        this.lines = [
            {
                combination: [1, 1, 1, 1, 1],
                hex: '0a43c6'
            },

            {
                combination: [0, 0, 0, 0, 0],
                hex: 'ad1411'
            },

            {
                combination: [2, 2, 2, 2, 2],
                hex: '287f19'
            },

            {
                combination: [0, 1, 2, 1, 0],
                hex: 'e1d10c'
            },

            {
                combination: [2, 1, 0, 1, 2],
                hex: 'b35b9b'
            },

            {
                combination: [0, 0, 1, 0, 0],
                hex: 'bf8944'
            },

            {
                combination: [2, 2, 1, 2, 2],
                hex: '7b9a9e'
            },

            {
                combination: [1, 0, 0, 0, 1],
                hex: '8eb23a'
            },

            {
                combination: [1, 2, 2, 2, 1],
                hex: 'b77c6c'
            },

            {
                combination: [0, 1, 1, 1, 0],
                hex: 'a779b7'
            },
        ]

        this.fixedLines = false

        this.rows = 3

        this.reels = [          // The original Hot Scatter reels by Amatic.
            [5, 7, 5, 5, 6, 6, 6, 5, 5, 1, 1, 4, 1, 4, 4, 5, 4, 3, 0, 3, 3, 3, 2, 2, 5, 5, 5, 2, 2, 4, 4, 6, 4, 2, 2, 5, 4],
            [5, 5, 1, 1, 0, 1, 6, 6, 6, 7, 3, 3, 3, 4, 4, 2, 4, 2, 2, 0, 6, 6, 5, 5, 5, 1, 1, 3, 3, 6, 6, 6, 4, 4, 6, 4, 0, 2, 1, 1],
            [5, 5, 5, 0, 6, 6, 6, 7, 4, 4, 4, 0, 4, 1, 1, 1, 3, 3, 3, 5, 5, 5, 2, 2, 6, 2, 3, 3, 3, 4, 4, 6, 6, 6, 0, 4, 4, 2, 4],
            [5, 6, 5, 5, 6, 6, 6, 3, 3, 1, 1, 0, 4, 4, 4, 4, 0, 4, 3, 3, 3, 7, 2, 2, 5, 5, 6, 6, 0, 1, 1, 6, 6, 6, 4, 4, 4, 2, 2, 1, 1, 2],
            [5, 7, 5, 5, 1, 1, 4, 6, 6, 4, 4, 4, 4, 3, 3, 3, 5, 0, 6, 6, 2, 2, 0, 3, 3, 6, 6, 6, 0, 1, 5, 5, 5, 2, 2, 1, 1, 4, 4, 0]
        ]

        this.bonusReels = [     // The original Hot Scatter reels by Amatic.
            [7, 6, 6, 6, 5, 5, 1, 4, 4, 3, 0, 3, 3, 6, 6, 6, 5, 5, 5, 2, 4],
            [0, 6, 6, 7, 3, 3, 4, 4, 2, 2, 6, 5, 5, 6, 6, 6, 5, 5, 5, 1, 4, 6],
            [5, 5, 5, 6, 6, 6, 7, 4, 4, 0, 1, 5, 5, 5, 2, 2, 6, 6, 3, 3, 4, 4, 6],
            [5, 5, 4, 4, 6, 6, 6, 3, 1, 4, 4, 6, 0, 3, 3, 7, 2, 2, 5, 5, 5, 6, 6],
            [5, 7, 1, 4, 6, 6, 4, 4, 3, 5, 5, 5, 0, 6, 6, 4, 4, 6, 2, 2, 3, 3, 5, 5]
        ]

        if (this.bonusReels.length === 0)
            this.bonusReels = this.reels

        this.virtualReels = []

        this.betsPerLine = [
            0.01,
            0.02,
            0.03,
            0.04,
            0.05,
            0.10,
            0.15,
            0.20,
            0.25,
            0.30,
            0.40,
            0.50,
            1.00,
            2.00,
            3.00,
            4.00,
            5.00
        ]

        this.noWinPhrases = [
            'Unlucky',
            'No Win',
            'Oh Snap'
        ]

        this.spinPhrases = [
            'Good Luck',
            'Lets Win'
        ]

        this.startPositions = [17, 18, 10, 15, 27]

        this.cryptoRNG = true
        this.showLinesTimeout = null
        this.pendingSpin = false
        this.spinning = false
        this.stopSpin = false
        this.simulating = false
        this.turboSpin = false
        this.autoSpin = false
        this.showingInfo = false

        this.rendererData = {
            showLine: {
                active: null,
                animationId: 0
            },

            animateSymbols: {
                symbols: null,
                times: null,

                frame: {
                    current: 0,
                    times: 0,
                    lastAt: null,
                },

                speedMs: 0
            },

            showText: {
                text: null,
                animationId: 0
            },

            showSubtext: {
                text: null,
                animationId: 0
            },

            showFreeGamesText: {
                text: null,
                animationId: 0
            },

            showFreeGamesSubtext: {
                text: null,
                animationId: 0
            },

            spin: {
                pre: {
                    reels: []
                },

                virtualStopPositions: [],
                virtualReelSymbolPop: [],
                stopPositions: []
            }
        }

        this.replayingSpin = false

        this.balance = 0.0
        this.playingBet = 0
        this.playingLines = this.lines.length

        this.lastSpin = {
            stopPositions: this.startPositions.slice(),
            timestamp: Date.now(),
            win: null,
            finished: false,
            previousStopPositions: this.startPositions.slice(),
            previousInBonus: false,
            inBonus: false
        }

        this.bonusGame = null

        this.persistentData = {
            balance: this.balance,
            lastSpin: this.lastSpin,
            bonusGame: this.bonusGame,
            playingBet: this.playingBet,
            playingLines: this.playingLines
        }

        try {
            this.persistentData = JSON.parse(fs.readFileSync(path.join(path.dirname(url.fileURLToPath(import.meta.url)), 'hot-scatter-data.json')))
        } catch (e) { }

        if (typeof(this.persistentData.balance) === 'number')
            this.balance = this.persistentData.balance

        if (typeof(this.persistentData.playingBet) === 'number')
            this.playingBet = this.persistentData.playingBet

        if (typeof(this.persistentData.playingLines) === 'number')
            this.playingLines = this.persistentData.playingLines

        if (this.persistentData.lastSpin) {
            this.lastSpin.stopPositions = this.persistentData.lastSpin.stopPositions.slice()
            this.lastSpin.previousStopPositions = this.persistentData.lastSpin.previousStopPositions.slice()
            this.lastSpin.timestamp = this.persistentData.lastSpin.timestamp
            this.lastSpin.previousInBonus = this.persistentData.lastSpin.previousInBonus
            this.lastSpin.inBonus = this.persistentData.lastSpin.inBonus
            this.lastSpin.win = this.persistentData.lastSpin.win
            this.lastSpin.finished = this.persistentData.lastSpin.finished

            if (!this.persistentData.lastSpin.finished) {
                this.replayingSpin = true
                this.showText(chalk.bold('Unfinished Spin Recovered'), 3, 250, 200, true)
                this.showSubtext(chalk.bold('Press Spin to Replay'), 3, 250, 200, true)
            }
        }

        if (this.persistentData.bonusGame)
            this.bonusGame = {
                total: this.persistentData.bonusGame.total,
                left: this.persistentData.bonusGame.left + (this.replayingSpin ? 1 : 0),
                current: this.persistentData.bonusGame.current - (this.replayingSpin ? 1 : 0),
                win: this.persistentData.bonusGame.win
            }

        this.startBalance = this.balance

        this.rendererData.spin.virtualStopPositions = this.replayingSpin ? this.lastSpin.previousStopPositions.slice() : this.lastSpin.stopPositions.slice()
        this.rendererData.spin.stopPositions = this.replayingSpin ? this.lastSpin.previousStopPositions.slice() : this.lastSpin.stopPositions.slice()

        if (this.bonusGame) {
            if (this.bonusGame.left === this.bonusGame.total)
                this.animateFreeGames()

            for (let index = 0; index < this.bonusReels.length; index++)
                this.virtualReels.push(this.bonusReels[index].slice())
        } else
            for (let index = 0; index < this.reels.length; index++)
                this.virtualReels.push(this.reels[index].slice())

        if ((!!this.bonusGame) !== this.lastSpin.previousInBonus) {
            const symbolsOnScreen = []
            const reels = this.lastSpin.previousInBonus ? this.bonusReels : this.reels

            for (let rowIndex = 0; rowIndex < this.rows; rowIndex++) {
                symbolsOnScreen[rowIndex] = []

                for (let reelIndex = 0; reelIndex < reels.length; reelIndex++) {
                    let symbolPositionOnReel = this.rendererData.spin.virtualStopPositions[reelIndex]

                    for (let symbolOffset = 1; symbolOffset <= rowIndex; symbolOffset++) {
                        symbolPositionOnReel += 1

                        if (symbolPositionOnReel > reels[reelIndex].length - 1)
                            symbolPositionOnReel = 0
                    }

                    symbolsOnScreen[rowIndex][reelIndex] = reels[reelIndex][symbolPositionOnReel]
                }
            }

            this.rendererData.spin.virtualStopPositions = []
            this.rendererData.spin.virtualReelSymbolPop = []

            for (let reelIndex = 0; reelIndex < this.virtualReels.length; reelIndex++) {
                for (let rowIndex = 0; rowIndex < this.rows; rowIndex++)
                    this.virtualReels[reelIndex].push(symbolsOnScreen[rowIndex][reelIndex])

                this.rendererData.spin.virtualReelSymbolPop[reelIndex] = this.rows
                this.rendererData.spin.virtualStopPositions[reelIndex] = this.virtualReels[reelIndex].length - this.rows
            }
        }
    }

    play(settings) {
        this.settings = settings

        process.stdin.setEncoding('utf8')
            
        if (process.stdin.setRawMode)
            process.stdin.setRawMode(true)
        
        process.stdin.resume()
        process.stdout.write('\u001b[?25l')

        console.clear()

        keypress(process.stdin)

        process.stdin.on('keypress', (ch, key) => {
            if (key && key.ctrl && key.name == 'c') {
                process.stdin.pause()
                console.clear()
                this.savePersistentData()
                process.exit(0)
            } else if (key) {
                if (key.name !== 'i' && this.showingInfo)
                    return

                switch (key.name) {
                    case 't':
                        if (this.simulating)
                            return

                        this.turboSpin = !this.turboSpin

                        if (this.autoSpin)
                            this.tryToSpin()

                        break
     
                    case 'i':
                        if (this.simulating)
                            return

                        this.showingInfo = !this.showingInfo
                        this.autoSpin = false

                        console.clear()

                        break
     
                    case 'r':
                        if (this.simulating)
                            return

                        this.balance = 500.0
                        this.persistentData.balance = this.balance

                        break
     
                    case 'c':
                        if (this.simulating)
                            return

                        this.balance = 0.0
                        this.persistentData.balance = this.balance

                        break

                    case 'a':
                        if (this.simulating)
                            return

                        this.autoSpin = !this.autoSpin

                        if (this.autoSpin)
                            this.tryToSpin()

                        break

                    case 'up':
                        if (this.bonusGame || this.spinning || this.pendingSpin || this.simulating)
                            return

                        if (this.playingBet + 1 <= this.betsPerLine.length - 1)
                            this.playingBet += 1

                        this.updatePersistentData()

                        break

                    case 'down':
                        if (this.bonusGame || this.spinning || this.pendingSpin || this.simulating)
                            return

                        if (this.playingBet - 1 >= 0)
                            this.playingBet -= 1

                        this.updatePersistentData()

                        break

                    case 'left':
                        if (this.bonusGame || this.spinning || this.pendingSpin || this.fixedLines || this.autoSpin || this.simulating)
                            return

                        if (this.playingLines - 1 >= 1)
                            this.playingLines -= 1

                        this.updatePersistentData()
                        this.stopLineAnimations()
                        this.stopSubTextAnimation()
                        this.stopSymbolAnimations()

                        clearTimeout(this.showLinesTimeout)

                        this.showLinesTimeout = setTimeout(() => this.showLines(Object.keys(this.lines.slice(0, this.playingLines)).map(v => {
                            return {
                                line: v,
                                count: this.bonusGame ? this.bonusReels.length : this.reels.length
                            }
                        }), 2, 250, 50), 500)

                        break

                    case 'right':
                        if (this.bonusGame || this.spinning || this.pendingSpin || this.fixedLines || this.autoSpin || this.simulating)
                            return

                        if (this.playingLines + 1 <= this.lines.length)
                            this.playingLines += 1

                        this.updatePersistentData()
                        this.stopLineAnimations()
                        this.stopSubTextAnimation()
                        this.stopSymbolAnimations()

                        clearTimeout(this.showLinesTimeout)

                        this.showLinesTimeout = setTimeout(() => this.showLines(Object.keys(this.lines.slice(0, this.playingLines)).map(v => {
                            return {
                                line: v,
                                count: this.bonusGame ? this.bonusReels.length : this.reels.length
                            }
                        }), 2, 250, 50), 500)

                        break

                    case 'space':
                        if (this.simulating)
                            return

                        if (this.spinning)
                            this.stopSpin = true
                
                        this.tryToSpin()
                        
                        break

                    case 'm':
                        if (this.simulating || this.spinning)
                            return

                        this.tryToSpin(this.settings.minimumWinKeyMultiplier)
                        
                        break

                    case 'n':
                        if (this.simulating || this.spinning)
                            return

                        this.tryToSpin(null, 0)
                        
                        break
                }
            }
        })

        process.stdin.setRawMode(true)
        process.stdin.resume()

        setInterval(() => this.render(), 16.66)
    }

    updatePersistentData() {
        if (this.simulating)
            return

        this.persistentData = {
            balance: this.balance,
            lastSpin: this.lastSpin,
            bonusGame: this.bonusGame,
            playingBet: this.playingBet,
            playingLines: this.playingLines
        }
    }

    savePersistentData() {
        fs.writeFileSync(path.join(path.dirname(url.fileURLToPath(import.meta.url)), 'hot-scatter-data.json'), JSON.stringify(this.persistentData))
    }

    finalizeSpin(minMultiplier, maxMultiplier) {
        new Promise(async (resolve, reject) => {
            const winnings = this.getAlteredLastSpinWinningsAndFreeGames(minMultiplier, maxMultiplier)

            this.rendererData.spin.stopPositions = this.lastSpin.stopPositions.slice()
    
            const reels = this.bonusGame ? this.bonusReels : this.reels
            const nonFinalScatters = []
    
            for (let reelIndex = 0; reelIndex < reels.length; reelIndex++) {
                let time = Date.now()
    
                while (true) {
                    await sleep(0)
    
                    if (this.stopSpin || this.turboSpin || (Date.now() - time) > (nonFinalScatters.length >= 2 ? this.settings.minimumPreSpinTimeTeaseMs : this.settings.minimumPreSpinTimeMs))
                        break
                }
    
                for (let rowIndex = 0; rowIndex < this.rows; rowIndex++) {
                    let vStopPosition = this.rendererData.spin.virtualStopPositions[reelIndex] - (rowIndex + 1)
                    let stopPosition = this.rendererData.spin.stopPositions[reelIndex] + (2 - rowIndex)
    
                    if (vStopPosition < 0)
                        vStopPosition = reels[reelIndex].length + vStopPosition
    
                    if (stopPosition > reels[reelIndex].length - 1)
                        stopPosition = stopPosition - reels[reelIndex].length
    
                    this.virtualReels[reelIndex][vStopPosition] = reels[reelIndex][stopPosition]
    
                    if ((reelIndex !== reels.length - 1) && this.symbols[reels[reelIndex][stopPosition]].name === 'scatter')
                        nonFinalScatters.push({
                            reelIndex,
                            rowIndex: 2 - rowIndex
                        })
                }
    
                this.rendererData.spin.pre.reels[reelIndex].stopping = 3
    
                if (nonFinalScatters.length >= 2)
                    this.animateSymbols(nonFinalScatters, 150)
    
                time = Date.now()
    
                while (true) {
                    await sleep(0)
    
                    if (this.stopSpin || this.turboSpin || (!this.rendererData.spin.pre.reels[reelIndex].active))
                        break
                }
    
                if (this.stopSpin || this.turboSpin)
                    break
            }
    
            this.rendererData.spin.pre.active = false
            this.stopSymbolAnimations()
    
            for (let index = 0; index < this.rendererData.spin.pre.reels.length; index++)
                this.rendererData.spin.pre.reels[index].active = false
    
            while (true) {
                await sleep(0)
    
                let reelsAnimating = false
    
                for (let index = 0; index < this.rendererData.spin.pre.reels.length; index++)
                    if (this.rendererData.spin.pre.reels[index].active) {
                        reelsAnimating = true
                        break
                    }
    
                if ((!reelsAnimating) || this.stopSpin || this.turboSpin)
                    break
            }

            this.lastSpin.previousInBonus = this.lastSpin.inBonus
    
            this.rendererData.spin.virtualStopPositions = this.lastSpin.stopPositions.slice()
            this.rendererData.spin.virtualReelSymbolPop = []
    
            this.virtualReels = []
    
            for (let index = 0; index < reels.length; index++)
                this.virtualReels.push(reels[index].slice())

            if (winnings.totalWin > 0)
                this.showLines(winnings.lines.map(v => {
                    return {
                        line: v.line,
                        symbols: v.symbols,
                        count: v.count,
                        text: chalk.bold(`${v.scatter ? this.symbols.filter(v => v.name === 'scatter')[0].emoji.repeat(v.count) : `${chalk.hex(this.lines[v.line].hex)(`[${v.line + 1}]`)} ${this.symbols[v.symbol].emoji.repeat(v.count)}`}${this.bonusGame ? ' x3 =' : ''} ${v.payout.toFixed(2)} €`)
                    }
                }), 5, 350, 50, 250, true, () => {
                    if (this.autoSpin)
                        this.tryToSpin()
                })

            if (winnings.scatters.length > 2) {
                this.addFreeGames()
                this.animateFreeGames()
            }

            if (this.bonusGame && this.bonusGame.total !== this.bonusGame.left)
                this.bonusGame.win += winnings.totalWin
            else
                this.balance += winnings.totalWin

            this.lastSpin.win = winnings.totalWin

            if (this.lastSpin.win === 0)
                this.showText(chalk.bold(this.noWinPhrases[randomNumber(0, this.noWinPhrases.length - 1)]), 3, 250, 200, false, 250, () => {
                    if (this.autoSpin)
                        this.tryToSpin()
                })
            else
                this.showText(chalk.bold(`${this.lastSpin.win.toFixed(2)} € ${chalk.italic(chalk.hex('999')('Spin Win'))}`), 1, null, null, true)
            
            if (this.bonusGame && this.bonusGame.left === 0) {
                this.showFreeGamesText('Free Games Finished', 1, null, null, true)
                this.showFreeGamesSubtext(`${this.bonusGame.win.toFixed(2)} € ${chalk.italic(chalk.hex('999')('Total Win'))}`, 1, null, null, true)
                this.balance += this.bonusGame.win
                this.bonusGame = null

                this.lastSpin.inBonus = false
    
                const symbolsOnScreen = []
    
                for (let rowIndex = 0; rowIndex < this.rows; rowIndex++) {
                    symbolsOnScreen[rowIndex] = []
    
                    for (let reelIndex = 0; reelIndex < this.virtualReels.length; reelIndex++) {
                        let symbolPositionOnReel = this.rendererData.spin.virtualStopPositions[reelIndex]
    
                        for (let symbolOffset = 1; symbolOffset <= rowIndex; symbolOffset++) {
                            symbolPositionOnReel += 1
    
                            if (symbolPositionOnReel > this.virtualReels[reelIndex].length - 1)
                                symbolPositionOnReel = 0
                        }
    
                        symbolsOnScreen[rowIndex][reelIndex] = this.virtualReels[reelIndex][symbolPositionOnReel]
                    }
                }
    
                this.rendererData.spin.virtualStopPositions = []
                this.rendererData.spin.virtualReelSymbolPop = []
    
                this.virtualReels = []
    
                for (let index = 0; index < this.reels.length; index++)
                    this.virtualReels.push(this.reels[index].slice())
    
                for (let reelIndex = 0; reelIndex < this.virtualReels.length; reelIndex++) {
                    for (let rowIndex = 0; rowIndex < this.rows; rowIndex++)
                        this.virtualReels[reelIndex].push(symbolsOnScreen[rowIndex][reelIndex])
    
                    this.rendererData.spin.virtualReelSymbolPop[reelIndex] = this.rows
                    this.rendererData.spin.virtualStopPositions[reelIndex] = this.virtualReels[reelIndex].length - this.rows
                }
            }

            resolve()
        }).then(() => {
            this.lastSpin.finished = true
            this.stopSpin = false
            this.spinning = false
            this.pendingSpin = false

            this.updatePersistentData()
    
            if (this.turboSpin && this.autoSpin)
                this.tryToSpin()
        })
    }

    startSpin(minMultiplier, maxMultiplier) {
        this.spinning = true
        this.pendingSpin = true

        this.stopAnimations()

        const reels = this.bonusGame ? this.bonusReels : this.reels

        for (let index = 0; index < reels.length; index++)
            this.rendererData.spin.pre.reels[index] = {
                active: true,
                speedMs: 125,
                stopping: 0,
                lastAt: null
            }

        this.rendererData.spin.pre.active = true

        this.showText(chalk.bold(this.spinPhrases[randomNumber(0, this.spinPhrases.length - 1)]), 3, 250, 200)

        if (this.replayingSpin) {
            this.replayingSpin = false

            if (this.bonusGame) {
                this.bonusGame.current++
                this.bonusGame.left--
            }

            this.updatePersistentData()
            this.finalizeSpin()
        } else
            sleep(randomNumber(this.settings.simulatedServerResponseMs[0], this.settings.simulatedServerResponseMs[1])).then(() => {
                this.generateSpin()
                this.finalizeSpin(minMultiplier, maxMultiplier)
            })
    }

    tryToSpin(minMultiplier, maxMultiplier) {
        if (this.pendingSpin)
            return

        if (this.replayingSpin || (this.bonusGame && this.bonusGame.left > 0))
            this.startSpin(minMultiplier, maxMultiplier)
        else if (this.balance < (this.betsPerLine[this.playingBet] * this.playingLines)) {
            this.showText(chalk.bold('Not Enough Balance'), 5, 250, 200)
            this.autoSpin = false
        } else {
            this.balance -= (this.betsPerLine[this.playingBet] * this.playingLines)
            this.updatePersistentData()
            this.startSpin(minMultiplier, maxMultiplier)
        }
    }

    showText(text, times, inMs, outMs, retain, delayFinishMs, finishedCb) {
        this.rendererData.showText.animationId++

        const animationId = this.rendererData.showText.animationId

        new Promise(async (resolve, reject) => {
            for (let i = 0; i < times; i++) {
                this.rendererData.showText.text = text
                
                if (inMs)
                    await sleep(inMs)

                if (animationId !== this.rendererData.showText.animationId || (retain && i === times - 1)){
                    resolve()
                    return
                }

                this.rendererData.showText.text = ' '
                
                if (outMs)
                    await sleep(outMs)

                if (animationId !== this.rendererData.showText.animationId){
                    resolve()
                    return
                }
            }

            this.rendererData.showText.text = null

            if (delayFinishMs)
                await sleep(delayFinishMs)

            if (finishedCb)
                finishedCb()

            resolve()
        })
    }

    showSubtext(text, times, inMs, outMs, retain) {
        this.rendererData.showSubtext.animationId++

        const animationId = this.rendererData.showSubtext.animationId

        new Promise(async (resolve, reject) => {
            for (let i = 0; i < times; i++) {
                this.rendererData.showSubtext.text = text

                if (inMs)
                    await sleep(inMs)

                if (animationId !== this.rendererData.showSubtext.animationId || (retain && i === times - 1)){
                    resolve()
                    return
                }

                this.rendererData.showSubtext.text = ' '
                
                if (outMs)
                    await sleep(outMs)

                if (animationId !== this.rendererData.showSubtext.animationId) {
                    resolve()
                    return
                }
            }

            this.rendererData.showSubtext.text = null

            resolve()
        })
    }

    showFreeGamesText(text, times, inMs, outMs, retain) {
        this.rendererData.showFreeGamesText.animationId++

        const animationId = this.rendererData.showFreeGamesText.animationId

        new Promise(async (resolve, reject) => {
            for (let i = 0; i < times; i++) {
                this.rendererData.showFreeGamesText.text = text

                if (inMs)
                    await sleep(inMs)

                if (animationId !== this.rendererData.showFreeGamesText.animationId || (retain && i === times - 1)){
                    resolve()
                    return
                }

                this.rendererData.showFreeGamesText.text = ' '
                
                if (outMs)
                    await sleep(outMs)

                if (animationId !== this.rendererData.showFreeGamesText.animationId) {
                    resolve()
                    return
                }
            }

            this.rendererData.showFreeGamesText.text = null

            resolve()
        })
    }

    showFreeGamesSubtext(text, times, inMs, outMs, retain) {
        this.rendererData.showFreeGamesSubtext.animationId++

        const animationId = this.rendererData.showFreeGamesSubtext.animationId

        new Promise(async (resolve, reject) => {
            for (let i = 0; i < times; i++) {
                this.rendererData.showFreeGamesSubtext.text = text

                if (inMs)
                    await sleep(inMs)

                if (animationId !== this.rendererData.showFreeGamesSubtext.animationId || (retain && i === times - 1)){
                    resolve()
                    return
                }

                this.rendererData.showFreeGamesSubtext.text = ' '
                
                if (outMs)
                    await sleep(outMs)

                if (animationId !== this.rendererData.showFreeGamesSubtext.animationId) {
                    resolve()
                    return
                }
            }

            this.rendererData.showFreeGamesSubtext.text = null

            resolve()
        })
    }

    showLines(lines, timesPerLine, inMs, outMs, loopDelayMs, keep, finishedLoopCb) {
        this.rendererData.showLine.animationId++

        const animationId = this.rendererData.showLine.animationId

        new Promise(async (resolve, reject) => {
            while (true) {
                for (let index = 0; index < lines.length; index++)
                    for (let ii = 0; ii < timesPerLine; ii++) {
                        if (lines[index].line >= 0)
                            this.rendererData.showLine.active = {
                                line: lines[index].line,
                                count: lines[index].count
                            }
                        else
                            this.rendererData.showLine.active = null

                        if (lines[index].symbols)
                            this.animateSymbols(lines[index].symbols, 150)

                        if (lines[index].text)
                            this.showSubtext(lines[index].text, 1, null, null, true)

                        await sleep(inMs)

                        if (animationId !== this.rendererData.showLine.animationId) {
                            resolve()
                            return
                        }

                        if (!keep)
                            this.rendererData.showLine.active = null

                        await sleep(outMs)

                        if (animationId !== this.rendererData.showLine.animationId) {
                            resolve()
                            return
                        }
                    }

                    if (!loopDelayMs)
                        break

                    await sleep(loopDelayMs)

                    if (finishedLoopCb)
                        finishedLoopCb()
    
                    if (animationId !== this.rendererData.showLine.animationId) {
                        resolve()
                        return
                    }
                }

            resolve()
        })
    }

    animateFreeGames() {
        if (this.bonusGame.total === this.bonusGame.left) {
            this.showFreeGamesText('Free Games Triggered', 5, 150, 50, true)
            this.showFreeGamesSubtext('x3 Multiplier', 5, 150, 50, true)
        } else
            this.showFreeGamesText('Free Games Retriggered', 5, 150, 50)
    }

    getSimulationRtp(runs, type = 'base') {
        let totalWin = 0

        for (let index = 0; index < runs; index++) {
            this.generateSpin()

            const winnings = this.getAlteredLastSpinWinningsAndFreeGames()

            if (type === 'bonus' && winnings.scatters.length > 2)
                this.addFreeGames()

            if (type === 'base')
                totalWin += winnings.totalWin
            else {
                while (this.bonusGame && this.bonusGame.left !== 0) {
                    this.generateSpin()
        
                    const freeWinnings = this.getAlteredLastSpinWinningsAndFreeGames()

                    if (freeWinnings.scatters.length > 2)
                        this.addFreeGames()

                    totalWin += freeWinnings.totalWin
                }

                this.bonusGame = null
            }
        }

        return (totalWin / (this.betsPerLine[this.playingBet] * this.playingLines) / runs) * 100
    }

    optimizeRtp(options = {}) {
        this.simulating = true

        if (typeof(options.cryptoRNG) === 'boolean')
            this.cryptoRNG = options.cryptoRNG

        process.stdin.setRawMode(false)
        process.stdin.pause()

        console.clear()

        const data = {
            skipSymbols: options.skipSymbols,
            minimumSymbolsPerReel: options.minimumSymbolsPerReel,
            targetMin: options.targetMin,
            targetMax: options.targetMax,
            maxIterations: options.maxIterations,
            runsPerIteration: options.runsPerIteration,
            ignoreMaxOptimizations: options.ignoreMaxOptimizations,
            maintainStackedSymbols: options.maintainStackedSymbols,
            type: options.type,
            targetRtpReached: false,
            optimizedRtpOutOfBounds: false,
            maxIterationsReached: false,
            currentIteration: 0,
            nReel: 0,
            lastRtp: 0,
            descent: true,
            currentRtp: 0,
            optimizedRtp: 0,
            startRtp: 0,
            lastReels: [],
            currentReels: [],
            originalReels: [],
            optimizedReels: []
        }

        console.log(`${this.consoleArt} RTP Optimization\n`)
        console.log(chalk.bold(`${chalk.yellow(data.runsPerIteration.toLocaleString())} Runs / Iteration • ${chalk.yellow(data.maxIterations.toLocaleString())} Max Iterations • ${data.type === 'base' ? chalk.hex('ff6600')('Base Spins RTP') : chalk.green('Free Spins RTP')} • ${this.cryptoRNG ? chalk.green('Crypto RNG') : chalk.red('Math RNG')}`))
        console.log(chalk.bold(`${data.ignoreMaxOptimizations ? 'Ignoring Max Optimizations' : 'Checking Max Optimizations'} • ${data.maintainStackedSymbols ? 'Maintaining Stacked Symbols' : 'Disregarding Stacked Symbols'}\n`))

        data.currentReels = data.type === 'base' ? this.reels.map(v => v.slice()) : this.bonusReels.map(v => v.slice())
        data.originalReels = data.currentReels.slice()

        console.log(chalk.bold(`Original Symbols Per Reel:\n    [${data.currentReels.map(v => this.symbols.map((vv, k) => `${vv.emoji}x${v.filter(v => v == k).length}`).join(', ')).join(']\n    [')}]\n`))
        console.log(chalk.bold(`Minimum Symbols Per Reel:\n    [${data.minimumSymbolsPerReel.map(v => v.map((vv, k) => `${this.symbols[k].emoji}x${vv}`).join(', ')).join(']\n    [')}]\n`))
        console.log(chalk.bold(`Skipped Symbols: [${data.skipSymbols.map(v => this.symbols[v].emoji).join(', ')}]\n`))

        console.log(chalk.bold('[Optimization Started]\n'))

        data.currentRtp = this.getSimulationRtp(options.runsPerIteration, options.type)
        data.startRtp = data.currentRtp
        data.descent = data.currentRtp > data.targetMax

        console.log(chalk.bold(`Start RTP: ${chalk.yellow(data.startRtp.toFixed(4))}%`))
        console.log(chalk.bold(`Target RTP: ${chalk.yellow(data.targetMin.toFixed(4))}% ... ${chalk.yellow(data.targetMax.toFixed(4))}%\n`))

        if (data.targetMin >= data.currentRtp && data.targetMax <= data.currentRtp)
            data.targetRtpReached = true
        else {
            const expensiveSortedSymbols = this.symbols.slice().filter((v, k) => !data.skipSymbols.includes(v.index)).sort((a, b) => b.payouts.reduce((ac, cv) => ac + cv, 0) - a.payouts.reduce((ac, cv) => ac + cv, 0))

            let minimumWinCombination = null

            for (let i = 0; i < this.symbols.length; i++)
                for (let ii = 0; ii < this.symbols[i].payouts.length; ii++)
                    if (this.symbols[i].payouts[ii] > 0 && (minimumWinCombination === null || ii < minimumWinCombination))
                        minimumWinCombination = ii

            const nonMinimumSymbols = expensiveSortedSymbols.slice().reverse().filter(v => v.payouts[minimumWinCombination] === 0)
            const nonWinningSymbols = expensiveSortedSymbols.slice().reverse().filter(v => this.symbols[v.index].payouts[minimumWinCombination] === 0)
            const minimalWinCandidates = expensiveSortedSymbols.filter(v => this.symbols[v.index].payouts[minimumWinCombination] > 0)

            minimalWinCandidates.sort((a, b) => this.symbols[a.index].payouts[minimumWinCombination] - this.symbols[b.index].payouts[minimumWinCombination])

            const augmentSymbol = minimalWinCandidates[0]

            while (true) {
                data.currentIteration++

                console.log(chalk.bold(`Iteration ${chalk.hex('ffb6c1')(data.currentIteration)}`))

                data.optimizedRtp = data.currentRtp
                data.optimizedReels = data.currentReels.map(v => v.slice())

                let n = 1

                while (n <= 2) {
                    let replaced = false

                    switch (n) {
                        case 1: {
                            console.log(chalk.bold('    First-Improvement Greedy Hill-Climbing'))

                            const reel = data.type === 'base' ? this.reels[data.nReel] : this.bonusReels[data.nReel]

                            if (data.descent) {
                                for (let index = 0; index < expensiveSortedSymbols.length - 1; index++)
                                    if (reel.filter(v => v === expensiveSortedSymbols[index].index).length > data.minimumSymbolsPerReel[data.nReel][expensiveSortedSymbols[index].index]) {
                                        const symbolPosition = randomValue(reel.reduce((a, e, i) => e === expensiveSortedSymbols[index].index ? a.push(i) && a : a, []))
                                        const previousSymbolPosition = (symbolPosition - 1) < 0 ? 0 : symbolPosition - 1
                                        const nextSymbolPosition = (symbolPosition + 1) % reel.length

                                        if ((!data.maintainStackedSymbols) || (reel[previousSymbolPosition] !== reel[symbolPosition] && reel[nextSymbolPosition] !== reel[symbolPosition])) {
                                            console.log(chalk.dim(`       Replacing ${this.symbols[reel[symbolPosition]].emoji} → ${this.symbols[expensiveSortedSymbols[index + 1].index].emoji} • Reel ${chalk.hex('ffb6c1')(data.nReel)} • Position ${chalk.hex('ffb6c1')(symbolPosition)}`))
                                            reel[symbolPosition] = expensiveSortedSymbols[index + 1].index
                                            replaced = true
                                            break
                                        }
                                    }
                            } else
                                for (let index = expensiveSortedSymbols.length - 2; index >= 0; index--)
                                    if (reel.filter(v => v === expensiveSortedSymbols[index].index).length > data.minimumSymbolsPerReel[data.nReel][expensiveSortedSymbols[index].index]) {
                                        const symbolPosition = randomValue(reel.reduce((a, e, i) => e === expensiveSortedSymbols[index].index ? a.push(i) && a : a, []))
                                        const previousSymbolPosition = (symbolPosition - 1) < 0 ? 0 : symbolPosition - 1
                                        const nextSymbolPosition = (symbolPosition + 1) % reel.length

                                        if ((!data.maintainStackedSymbols) || (reel[previousSymbolPosition] !== reel[symbolPosition] && reel[nextSymbolPosition] !== reel[symbolPosition])) {
                                            console.log(chalk.dim(`       Replacing ${this.symbols[reel[symbolPosition]].emoji} → ${this.symbols[expensiveSortedSymbols[index + 1].index].emoji} • Reel ${chalk.hex('ffb6c1')(data.nReel)} • Position ${chalk.hex('ffb6c1')(symbolPosition)}`))
                                            reel[symbolPosition] = expensiveSortedSymbols[index + 1].index
                                            replaced = true
                                            break
                                        }
                                    }

                            break
                        }

                        case 2: {
                            if (data.descent)
                                console.log(chalk.bold('    Minimal-Win Combination Pruning'))
                            else
                                console.log(chalk.bold('    Minimal-Win Combination Augmentation'))

                            const reel = data.type === 'base' ? this.reels[data.nReel] : this.bonusReels[data.nReel]

                            if (data.descent) {
                                if (nonMinimumSymbols.length > 0)
                                    for (let symbolIndex = 0; symbolIndex < this.symbols.length; symbolIndex++)
                                        if (this.symbols[symbolIndex].payouts[minimumWinCombination] > 0 && (!data.skipSymbols.includes(symbolIndex)))
                                            if (reel.filter(v => v === symbolIndex).length > data.minimumSymbolsPerReel[data.nReel][symbolIndex]) {
                                                const symbolPosition = randomValue(reel.reduce((a, e, i) => e === symbolIndex ? a.push(i) && a : a, []))
                                                const previousSymbolPosition = (symbolPosition - 1) < 0 ? 0 : symbolPosition - 1
                                                const nextSymbolPosition = (symbolPosition + 1) % reel.length

                                                if ((!data.maintainStackedSymbols) || (reel[previousSymbolPosition] !== reel[symbolPosition] && reel[nextSymbolPosition] !== reel[symbolPosition])) {
                                                    console.log(chalk.dim(`       Replacing ${this.symbols[reel[symbolPosition]].emoji} → ${this.symbols[nonMinimumSymbols[0].index].emoji} • Reel ${chalk.hex('ffb6c1')(data.nReel)} • Position ${chalk.hex('ffb6c1')(symbolPosition)}`))
                                                    reel[symbolPosition] = nonMinimumSymbols[0].index
                                                    replaced = true
                                                    break
                                                }
                                            }
                            } else
                                if (nonWinningSymbols.length > 0)
                                    for (let symbolIndex = 0; symbolIndex < this.symbols.length; symbolIndex++)
                                        if (this.symbols[symbolIndex].payouts[minimumWinCombination] === 0 && (!data.skipSymbols.includes(symbolIndex)) && reel.filter(v => v === symbolIndex).length > 0) {
                                            const positions = reel.reduce((a, e, i) => e === symbolIndex ? (a.push(i), a) : a, [])
                                            const symbolPosition = randomValue(positions)
                                            const previousSymbolPosition = (symbolPosition - 1 + reel.length) % reel.length
                                            const nextSymbolPosition = (symbolPosition + 1) % reel.length
                                    
                                            if ((!data.maintainStackedSymbols) || (reel[previousSymbolPosition] !== reel[symbolPosition] && reel[nextSymbolPosition] !== reel[symbolPosition])) {
                                                console.log(chalk.dim(`       Replacing ${this.symbols[reel[symbolIndex]].emoji} → ${this.symbols[augmentSymbol.index].emoji} • Reel ${chalk.hex('ffb6c1')(data.nReel)} • Position ${chalk.hex('ffb6c1')(symbolPosition)}`))
                                                reel[symbolPosition] = augmentSymbol.index
                                                replaced = true
                                                break
                                            }
                                        }

                            break
                        }
                    }

                    if (!replaced)
                        console.log(chalk.dim(`       Skipped • Reel ${chalk.hex('ffb6c1')(data.nReel)}`))

                    const neighborHoodRtp = this.getSimulationRtp(options.runsPerIteration, options.type)

                    if ((data.descent ? (neighborHoodRtp <= data.optimizedRtp) : (neighborHoodRtp >= data.optimizedRtp)) && (data.descent ? (neighborHoodRtp >= data.targetMin) : (neighborHoodRtp <= data.targetMax))) {
                        data.optimizedRtp = neighborHoodRtp
                        data.optimizedReels = data.type === 'base' ? this.reels.map(v => v.slice()) : this.bonusReels.map(v => v.slice())
                        console.log(chalk.bold(`       RTP: ${chalk.green(neighborHoodRtp.toFixed(4))}%\n`))
                        n = 1
                    } else {
                        if (data.type === 'base')
                            this.reels = data.optimizedReels.map(v => v.slice())
                        else
                            this.bonusReels = data.optimizedReels.map(v => v.slice())

                        console.log(chalk.bold(`       RTP: ${chalk.red(neighborHoodRtp.toFixed(4))}%\n`))

                        n++
                    }

                    data.nReel++

                    if (data.nReel > data.currentReels.length - 1)
                        data.nReel = 0

                    if (data.optimizedRtp >= data.targetMin && data.optimizedRtp <= data.targetMax)
                        break
                    else if (data.descent ? (data.optimizedRtp < data.targetMin) : (data.optimizedRtp > data.targetMax))
                        break
                }

                let sameReels = true

                if (data.currentReels.length !== data.optimizedReels.length)
                    sameReels = false
                else
                    for (let reelIndex = 0; reelIndex < data.currentReels.length; reelIndex++)
                        if (data.currentReels[reelIndex].length !== data.optimizedReels[reelIndex].length) {
                            sameReels = false
                            break
                        } else
                            for (let symbolIndex = 0; symbolIndex < data.currentReels[reelIndex].length; symbolIndex++)
                                if (data.currentReels[reelIndex][symbolIndex] !== data.optimizedReels[reelIndex][symbolIndex]) {
                                    sameReels = false
                                    break
                                }

                data.currentReels = data.optimizedReels.map(v => v.slice())
                data.currentRtp = data.optimizedRtp

                if (data.currentRtp >= data.targetMin && data.currentRtp <= data.targetMax) {
                    data.targetRtpReached = true
                    break
                } else if (sameReels && (!data.ignoreMaxOptimizations)) {
                    data.maxOptimizationReached = true
                    break
                } else if (data.currentIteration === data.maxIterations) {
                    data.maxIterationsReached = true
                    break
                }
            }
        }

        console.clear()

        console.log(`${this.consoleArt} RTP Optimization\n`)
        console.log(chalk.bold(`${chalk.yellow(data.runsPerIteration.toLocaleString())} Runs / Iteration • ${chalk.yellow(data.maxIterations.toLocaleString())} Max Iterations • ${data.type === 'base' ? chalk.hex('ff6600')('Base Spins RTP') : chalk.green('Free Spins RTP')} • ${this.cryptoRNG ? chalk.green('Crypto RNG') : chalk.red('Math RNG')}`))
        console.log(chalk.bold(`${data.ignoreMaxOptimizations ? 'Ignoring Max Optimizations' : 'Checking Max Optimizations'} • ${data.maintainStackedSymbols ? 'Maintaining Stacked Symbols' : 'No Regard For Stacked Symbols'}\n`))

        console.log(chalk.bold(`Original Symbols Per Reel:\n    [${data.originalReels.map(v => this.symbols.map((vv, k) => `${vv.emoji}x${v.filter(v => v == k).length}`).join(', ')).join(']\n    [')}]\n`))
        console.log(chalk.bold(`Minimum Symbols Per Reel:\n    [${data.minimumSymbolsPerReel.map(v => v.map((vv, k) => `${this.symbols[k].emoji}x${vv}`).join(', ')).join(']\n    [')}]\n`))
        console.log(chalk.bold(`Skipped Symbols: [${data.skipSymbols.map(v => this.symbols[v].emoji).join(', ')}]\n`))

        console.log(chalk.bold(`Start RTP: ${chalk.yellow(data.startRtp.toFixed(4))}%`))
        console.log(chalk.bold(`Target RTP: ${chalk.yellow(data.targetMin.toFixed(4))}% ... ${chalk.yellow(data.targetMax.toFixed(4))}%`))
        console.log(chalk.bold(`Optimized RTP: ${chalk.hex('ff6600')(data.currentRtp.toFixed(4))}%\n`))

        console.log(chalk.bold(`Optimized Symbols Per Reel:\n    [${data.originalReels.map(v => this.symbols.map((vv, k) => `${vv.emoji}x${v.filter(v => v == k).length}`).join(', ')).join(']\n    [')}]\n`))

        console.log(chalk.bold('Optimized Reels:'))

        for (let index = 0; index < data.currentReels.length; index++)
            console.log(chalk.bold(`    [${chalk.hex('ffee00')(data.currentReels[index].join(', '))}]${index !== data.currentReels.length - 1 ? ',' : ''}`))
        
        if (data.optimizedRtpOutOfBounds)
            console.log(chalk.bold(chalk.red('\nOptimized RTP Out of Bounds')))
        else if (data.maxIterationsReached)
            console.log(chalk.bold(chalk.red('\nMax Iterations Reached')))
        else if (data.maxOptimizationReached)
            console.log(chalk.bold(chalk.red('\nMax Optimizations Reached')))
        else if (data.targetRtpReached)
            console.log(chalk.bold(chalk.green('\nSuccessful Optimization')))

        process.exit(0)
    }

    simulateSpins(runs, options = {}) {
        this.simulating = true

        if (typeof(options.cryptoRNG) === 'boolean')
            this.cryptoRNG = options.cryptoRNG

        process.stdin.setRawMode(false)
        process.stdin.pause()

        let bar = null

        if (!options.raw) {
            console.clear()

            bar = new cliProgress.SingleBar({
                format: `${this.consoleArt} | Simulating Spins | ${chalk.yellow('{bar}')} | ~{percentage}% | ETA: ~{eta_formatted}`
            }, cliProgress.Presets.shades_classic)

            bar.start(runs, 0)
        }

        const data = {
            totalWin: 0,
            totalBaseSpinsWin: 0,
            totalBet: 0,
            totalSpins: 0,
            totalBaseSpins: 0,
            totalBaseBonus: 0,
            totalBonusRetriggers: 0,
            totalFreeSpins: 0,
            totalFreeSpinsWin: 0,
            baseWinSpins: 0,
            freeWinSpins: 0,
            winSpins: 0,
            baseRawWin: 0,
            baseRawWinSquare: 0,
            freeRawWin: 0,
            freeRawWinSquare: 0,
            rawWin: 0,
            rawWinSquare: 0,
            maxFreeSpins: 0,
            maxFreeSpinsTotalWin: 0,
            totalBonusTeases: 0,
            totalBonusRetriggerTeases: 0,
            baseHitFrequency: 0,
            freeHitFrequency: 0,
            totalHitFrequency: 0,
            hitFrequency: 0,

            maxWin: {
                positions: [],
                value: 0
            },

            maxBaseSpinsWin: {
                positions: [],
                value: 0
            },

            maxFreeSpinsWin: {
                positions: [],
                value: 0
            },

            maxRtp: {
                value: 0,
                spin: 0,
                reset: 0
            },

            volatility: {
                rtp: {},
                indexes: {},
                variance: 0,
                baseStandardDeviation: 0,
                freeStandardDeviation: 0,
                standardDeviation: 0
            },

            highWins: [],
            symbols: [],
            insufficientBalance: false,
            stoppedByOptions: false,
            highWinMultipliers: options.highWinMultipliers || [100],
            balance: typeof(options.balance) === 'number' ? options.balance : null
        }

        data.highWinMultipliers.sort((a, b) => b - a)

        for (let index = 0; index < data.highWinMultipliers.length; index++)
            data.highWins[index] = 0

        for (let index = 0; index < this.symbols.length; index++)
            data.symbols[index] = {
                totalBaseSpinsWin: 0,
                totalFreeSpinsWin: 0,
                totalWin: 0
            }

        this.playingLines = this.lines.length
        this.playingBet = 0

        const bet = this.betsPerLine[this.playingBet] * this.playingLines

        for (let index = 0; index < runs; index++) {
            if (data.balance !== null)
                if (bet > data.balance) {
                    data.insufficientBalance = true
                    break
                } else
                    data.balance -= bet

            data.totalBet += bet

            this.generateSpin()

            const winnings = this.getAlteredLastSpinWinningsAndFreeGames()

            if (winnings.scatters.length > 2) {
                this.addFreeGames()
                data.totalBaseBonus++

                if (data.maxFreeSpins < this.bonusGame.total)
                    data.maxFreeSpins = this.bonusGame.total
            } else if (winnings.scatters.filter(v => v.reelIndex !== this.reels.length - 1).length === 2)
                data.totalBonusTeases++

            const multiplier = winnings.totalWin / bet

            if (multiplier > data.maxWin.value)
                data.maxWin = {
                    value: multiplier,
                    positions: this.lastSpin.stopPositions.slice()
                }

            if (multiplier > data.maxBaseSpinsWin.value)
                data.maxBaseSpinsWin = {
                    value: multiplier,
                    positions: this.lastSpin.stopPositions.slice()
                }

            data.totalBaseSpinsWin += winnings.totalWin
            data.totalWin += winnings.totalWin

            data.baseRawWin += multiplier
            data.baseRawWinSquare += multiplier ** 2

            data.rawWin += multiplier
            data.rawWinSquare += multiplier ** 2

            if (multiplier > 0) {
                data.baseWinSpins++
                data.winSpins++
            }

            if (data.balance !== null)
                data.balance += winnings.totalWin

            data.totalSpins++
            data.totalBaseSpins++

            for (let index = 0; index < data.highWinMultipliers.length; index++)
                if (multiplier >= data.highWinMultipliers[index]) {
                    data.highWins[index]++
                    break
                }

            for (let index = 0; index < winnings.lines.length; index++) {
                data.symbols[winnings.lines[index].symbol].totalBaseSpinsWin += winnings.lines[index].payout
                data.symbols[winnings.lines[index].symbol].totalWin += winnings.lines[index].payout
            }

            let freeTotalWin = 0

            while (this.bonusGame && this.bonusGame.left !== 0) {
                this.generateSpin()

                const freeWinnings = this.getAlteredLastSpinWinningsAndFreeGames()

                if (freeWinnings.scatters.length > 2) {
                    this.addFreeGames()
                    data.totalBonusRetriggers++

                    if (data.maxFreeSpins < this.bonusGame.total)
                        data.maxFreeSpins = this.bonusGame.total
                } else if (freeWinnings.scatters.filter(v => v.reelIndex !== this.bonusReels.length - 1).length === 2)
                    data.totalBonusRetriggerTeases++

                const freeMultiplier = freeWinnings.totalWin / bet

                if (freeMultiplier > data.maxWin.value)
                    data.maxWin = {
                        value: freeMultiplier,
                        positions: this.lastSpin.stopPositions.slice()
                    }

                if (freeMultiplier > data.maxFreeSpinsWin.value)
                    data.maxFreeSpinsWin = {
                        value: freeMultiplier,
                        positions: this.lastSpin.stopPositions.slice()
                    }

                for (let index = 0; index < data.highWinMultipliers.length; index++)
                    if (freeMultiplier >= data.highWinMultipliers[index])
                        data.highWins[index]++

                freeTotalWin += freeWinnings.totalWin

                data.totalFreeSpinsWin += freeWinnings.totalWin
                data.totalWin += freeWinnings.totalWin

                data.freeRawWin += freeMultiplier
                data.freeRawWinSquare += freeMultiplier ** 2

                data.rawWin += freeMultiplier
                data.rawWinSquare += freeMultiplier ** 2

                if (freeMultiplier > 0) {
                    data.freeWinSpins++
                    data.winSpins++
                }

                data.totalSpins++
                data.totalFreeSpins++

                for (let index = 0; index < freeWinnings.lines.length; index++) {
                    data.symbols[freeWinnings.lines[index].symbol].totalFreeSpinsWin += freeWinnings.lines[index].payout
                    data.symbols[freeWinnings.lines[index].symbol].totalWin += freeWinnings.lines[index].payout
                }

                const fRtp = data.totalWin / data.totalBet

                if (fRtp > data.maxRtp.value) {
                    data.maxRtp.value = fRtp
                    data.maxRtp.spin = data.totalSpins
                }
            }

            this.bonusGame = null

            if ((freeTotalWin / bet) > data.maxFreeSpinsTotalWin)
                data.maxFreeSpinsTotalWin = freeTotalWin / bet

            if (data.balance !== null)
                data.balance += freeTotalWin

            const bRtp = data.totalWin / data.totalBet

            if (bRtp > data.maxRtp.value) {
                data.maxRtp.value = bRtp
                data.maxRtp.spin = data.totalSpins
            }

            if (index % (runs / 100) === 0 && (!options.raw))
                bar.update(index)
        }

        data.rtp = data.totalWin / data.totalBet

        data.baseHitFrequency = data.totalBaseSpins / data.baseWinSpins
        data.freeHitFrequency = data.totalFreeSpins / data.freeWinSpins
        data.totalHitFrequency = data.totalSpins / data.winSpins

        if (!options.raw) {
            bar.stop()

            console.clear()

            console.log(`${this.consoleArt} Simulation\n`)

            console.log(chalk.bold(`${chalk.yellow(data.totalBaseSpins.toLocaleString())} Base Spins • ${chalk.yellow(data.totalFreeSpins.toLocaleString())} Free Spins `))
            
            console.log(chalk.bold(`\nBase Hit Frequency: ${chalk.hex('ff6600')(data.baseHitFrequency.toFixed(2))}`))
            console.log(chalk.bold(`Free Hit Frequency: ${chalk.green(data.freeHitFrequency.toFixed(2))}`))
            console.log(chalk.bold(`Any Hit Frequency: ${chalk.yellow(data.totalHitFrequency.toFixed(2))}\n`))

            console.log(chalk.bold(`${chalk.hex('ffb6c1')(data.totalBaseBonus.toLocaleString())} (${chalk.hex('ffb6c1')((data.totalBaseBonus / data.totalBaseSpins).toFixed(4))}%) Bonus Games • ${chalk.hex('ffb6c1')(data.totalBonusRetriggers.toLocaleString())} Retriggers (${chalk.hex('ffb6c1')(((data.totalBonusRetriggers / data.totalFreeSpins) || 0).toFixed(4))}%) • ${chalk.hex('ffb6c1')((data.maxFreeSpins))} Max Free Spins • x${chalk.hex('ffb6c1')((data.maxFreeSpinsTotalWin.toFixed(2)))} Max Total Win`))
            console.log(chalk.bold(`${chalk.hex('ffb6c1')(data.totalBonusTeases.toLocaleString())} (${chalk.hex('ffb6c1')((data.totalBonusTeases / data.totalBaseSpins).toFixed(4))}%) Bonus Teases • ${chalk.hex('ffb6c1')(data.totalBonusRetriggerTeases.toLocaleString())} Retrigger Teases (${chalk.hex('ffb6c1')(((data.totalBonusRetriggerTeases / data.totalFreeSpins) || 0).toFixed(4))}%)\n`))

            console.log(chalk.bold(`Max Base Spin Win: x${chalk.cyan((data.maxBaseSpinsWin.value).toFixed(2))} • Stop Positions: ${chalk.hex('ffee00')(`[${data.maxBaseSpinsWin.positions.join(', ')}]`)})`))
            console.log(chalk.bold(`Max Free Spin Win: x${chalk.cyan((data.maxFreeSpinsWin.value).toFixed(2))} • Stop Positions: ${chalk.hex('ffee00')(`[${data.maxFreeSpinsWin.positions.join(', ')}]`)})`))
            console.log(chalk.bold(`Max Any Spin Win: x${chalk.cyan((data.maxWin.value).toFixed(2))} • Stop Positions: ${chalk.hex('ffee00')(`[${data.maxWin.positions.join(', ')}]`)})\n`))

            console.log(chalk.bold(`High Wins:`))

            for (let index = data.highWinMultipliers.length - 1; index >= 0; index--)
                console.log(chalk.bold(`    x${chalk.hex('ff69b4')((data.highWinMultipliers[index]).toFixed(2))} Multiplier • ${chalk.hex('ff69b4')((data.highWins[index]).toLocaleString())} Wins`))
           
            console.log(chalk.bold(`\nBase Spins RTP: ${chalk.hex('ff6600')(((data.totalBaseSpinsWin / data.totalBet) * 100).toFixed(4))}%`))
            console.log(chalk.bold(`Free Spins RTP: ${chalk.green(((data.totalFreeSpinsWin / data.totalBet) * 100).toFixed(4))}%\n`))

            for (let index = 0; index < this.symbols.length; index++)
                console.log(chalk.bold(`Symbol ${this.symbols[index].emoji} RTP: ${chalk.yellow(((data.symbols[index].totalWin / data.totalBet) * 100).toFixed(4))}% (Base Spins ${chalk.hex('ff6600')(((data.symbols[index].totalBaseSpinsWin / data.totalBet) * 100).toFixed(4))}% • Free Spins ${chalk.green(((data.symbols[index].totalFreeSpinsWin / data.totalBet) * 100).toFixed(4))}%)`))

            console.log(chalk.bold(`\nCeiling RTP: ${chalk.red((data.maxRtp.value * 100).toFixed(4))}%`))
            console.log(chalk.bold(`Simulation RTP: ${chalk.yellow((data.rtp * 100).toFixed(4))}%`))

            if (data.stoppedByOptions)
                console.log(chalk.bold(chalk.red('\nStopped by Options')))

            process.exit(0)
        } else
            return data
    }

    simulateBonusBuys(buys, priceMultiplier, options = {}) {
        this.simulating = true

        if (typeof(options.cryptoRNG) === 'boolean')
            this.cryptoRNG = options.cryptoRNG

        console.clear()

        process.stdin.setRawMode(false)
        process.stdin.pause()

        options.bet = this.betsPerLine.length - 1
        options.lines = this.lines.length

        const bar = new cliProgress.SingleBar({
            format: `${this.consoleArt} | Simulating Bonus Buys | ${chalk.yellow('{bar}')} | ~{percentage}% | ETA: ~{eta_formatted}`
        }, cliProgress.Presets.shades_classic)

        bar.start(buys, 0)

        const data = {
            bestBuy: {
                value: 0,
                bet: options.bet,
                lines: options.lines
            },

            highBuys: [],
            highReturnMultipliers: options.highReturnMultipliers || [100],
            totalBuysMultiplier: 0,
            totalBet: 0,
            totalLines: 0,
            zeroBuys: 0,
            breakEvenOrProfitBuys: 0,
            lossBuys: 0,
            worstBuy: null
        }

        data.highReturnMultipliers.sort((a, b) => b - a)

        for (let index = 0; index < data.highReturnMultipliers.length; index++)
            data.highBuys[index] = 0

        for (let index = 0; index < buys; index++) {
            this.playingBet = options.bet
            this.playingLines = options.lines

            const bet = this.betsPerLine[options.bet] * options.lines

            let balance = bet * priceMultiplier

            data.totalBet += bet
            data.totalLines += options.lines

            balance = 0

            this.addFreeGames()

            while (this.bonusGame && this.bonusGame.left !== 0) {
                this.generateSpin()

                const freeWinnings = this.getAlteredLastSpinWinningsAndFreeGames()

                if (freeWinnings.scatters.length > 2)
                    this.addFreeGames()

                balance += freeWinnings.totalWin
            }

            this.bonusGame = null

            const multiplier = balance / bet

            for (let index = 0; index < data.highReturnMultipliers.length; index++)
                if (multiplier >= data.highReturnMultipliers[index]) {
                    data.highBuys[index]++
                    break
                }

            data.totalBuysMultiplier += multiplier

            if (multiplier > data.bestBuy.value)
                data.bestBuy = {
                    value: multiplier,
                    bet: this.betsPerLine[options.bet],
                    lines: options.lines
                }

            if (multiplier === 0)
                data.zeroBuys++
            else if (multiplier >= priceMultiplier)
                data.breakEvenOrProfitBuys++
            else
                data.lossBuys++

            if (data.worstBuy === null || multiplier < data.worstBuy)
                data.worstBuy = multiplier

            if (index % (buys / 100) === 0)
                bar.update(index)
        }

        bar.stop()

        console.clear()

        console.log(`${this.consoleArt} Bonus Buys Simulation\n`)

        console.log(chalk.bold(`x${chalk.yellow(priceMultiplier.toFixed(2))} Cost • ${chalk.yellow(buys.toLocaleString())} Buys`))

        console.log(chalk.bold(`${chalk.cyan(data.zeroBuys.toLocaleString())} Zero Buys • ${chalk.cyan(data.lossBuys.toLocaleString())} Loss Buys • ${chalk.cyan(data.breakEvenOrProfitBuys.toLocaleString())} Break Even or Profit Buys\n`))

        console.log(chalk.bold(`Best Buy: x${chalk.red((data.bestBuy.value).toFixed(2))}${options.randomLinesAndBet ? ` (${chalk.red((data.bestBuy.bet * data.bestBuy.lines).toFixed(2))} € Total Bet • ${chalk.red(data.bestBuy.lines)} Line${data.bestBuy.lines === 1 ? '' : 's'})` : ''}`))
        console.log(chalk.bold(`Worst Buy: x${chalk.green(data.worstBuy.toFixed(2))}\n`))
 
        console.log(chalk.bold(`High Return Buys:`))

        for (let index = data.highReturnMultipliers.length - 1; index >= 0; index--)
            console.log(chalk.bold(`    x${chalk.hex('ff69b4')((data.highReturnMultipliers[index]).toFixed(2))} Multiplier • ${chalk.hex('ff69b4')((data.highBuys[index]).toLocaleString())} Wins`))

        console.log(chalk.bold(`\nTotal RTP: ${chalk.yellow(((data.totalBuysMultiplier / (buys * priceMultiplier)) * 100).toFixed(4))}%`))

        process.exit(0)
    }

    generateSpin(re = false) {
        let stopPositions = []

        const reels = this.bonusGame ? this.bonusReels : this.reels

        if (this.settings.alwaysSpin.length > 0)
            stopPositions = this.settings.alwaysSpin.slice()
        else
            for (let index = 0; index < reels.length; index++)
                stopPositions[index] = this.cryptoRNG ? crypto.randomInt(0, reels[index].length) : randomNumber(0, reels[index].length - 1)

        this.lastSpin.timestamp = Date.now()
        this.lastSpin.previousStopPositions = this.lastSpin.stopPositions.slice()
        this.lastSpin.stopPositions = stopPositions
        this.lastSpin.win = null
        this.lastSpin.finished = false

        if ((!re) && this.bonusGame) {
            this.bonusGame.current++
            this.bonusGame.left--
        }

        this.updatePersistentData()
    }

    addFreeGames() {
        if (!this.bonusGame) {
            this.bonusGame = {
                total: 15,
                left: 15,
                current: 0,
                win: 0
            }

            this.lastSpin.inBonus = true

            const symbolsOnScreen = []

            for (let rowIndex = 0; rowIndex < this.rows; rowIndex++) {
                symbolsOnScreen[rowIndex] = []

                for (let reelIndex = 0; reelIndex < this.virtualReels.length; reelIndex++) {
                    let symbolPositionOnReel = this.rendererData.spin.virtualStopPositions[reelIndex]

                    for (let symbolOffset = 1; symbolOffset <= rowIndex; symbolOffset++) {
                        symbolPositionOnReel += 1

                        if (symbolPositionOnReel > this.virtualReels[reelIndex].length - 1)
                            symbolPositionOnReel = 0
                    }

                    symbolsOnScreen[rowIndex][reelIndex] = this.virtualReels[reelIndex][symbolPositionOnReel]
                }
            }

            this.rendererData.spin.virtualStopPositions = []
            this.rendererData.spin.virtualReelSymbolPop = []

            this.virtualReels = []

            for (let index = 0; index < this.bonusReels.length; index++)
                this.virtualReels.push(this.bonusReels[index].slice())

            for (let reelIndex = 0; reelIndex < this.virtualReels.length; reelIndex++) {
                for (let rowIndex = 0; rowIndex < this.rows; rowIndex++)
                    this.virtualReels[reelIndex].push(symbolsOnScreen[rowIndex][reelIndex])

                this.rendererData.spin.virtualReelSymbolPop[reelIndex] = this.rows
                this.rendererData.spin.virtualStopPositions[reelIndex] = this.virtualReels[reelIndex].length - this.rows
            }
        } else {
            this.bonusGame.total += 15
            this.bonusGame.left += 15
        }

        this.updatePersistentData()
    }

    animateSymbols(symbols, speedMs, times) {
        this.rendererData.animateSymbols.speedMs = speedMs
        this.rendererData.animateSymbols.symbols = symbols
        this.rendererData.animateSymbols.times = times
    }

    stopLineAnimations() {
        this.rendererData.showLine.animationId++
        this.rendererData.showLine.active = null
    }

    stopTextAnimation() {
        this.rendererData.showText.animationId++
        this.rendererData.showText.text = null
    }

    stopSubTextAnimation() {
        this.rendererData.showSubtext.animationId++
        this.rendererData.showSubtext.text = null
    }

    stopFreeGamesTextAnimation() {
        this.rendererData.showFreeGamesText.animationId++
        this.rendererData.showFreeGamesText.text = null
    }

    stopFreeGamesSubtextAnimation() {
        this.rendererData.showFreeGamesSubtext.animationId++
        this.rendererData.showFreeGamesSubtext.text = null
    }

    stopSymbolAnimations() {
        this.rendererData.animateSymbols.symbols = null
    }

    stopAnimations() {
        clearTimeout(this.showLinesTimeout)

        this.stopLineAnimations()
        this.stopTextAnimation()
        this.stopSubTextAnimation()
        this.stopFreeGamesTextAnimation()
        this.stopFreeGamesSubtextAnimation()
        this.stopSymbolAnimations()
    }

    getLastSpinWinningsAndFreeGames() {
        const lines = []
        const scatters = []

        const reels = this.bonusGame ? this.bonusReels : this.reels

        let totalWin = 0
        
        for (let rowIndex = 0; rowIndex < this.rows; rowIndex++)
            for (let reelIndex = 0; reelIndex < reels.length; reelIndex++) {
                let symbolPositionOnReel = this.lastSpin.stopPositions[reelIndex]

                for (let symbolOffset = 1; symbolOffset <= rowIndex; symbolOffset++) {
                    symbolPositionOnReel += 1

                    if (symbolPositionOnReel > reels[reelIndex].length - 1)
                        symbolPositionOnReel = 0
                }

                if (this.symbols[reels[reelIndex][symbolPositionOnReel]].name === 'scatter')
                    scatters.push({
                        rowIndex,
                        reelIndex
                    })
            }

        if (scatters.length > 2) {
            const scatter = this.symbols.filter(v => v.name === 'scatter')[0]
            const scatterPayout = scatter.payouts[scatters.length - 2] * (this.bonusGame ? 3 : 1) * this.betsPerLine[this.playingBet] * this.playingLines

            totalWin += scatterPayout

            lines.push({
                line: -1,
                scatter: true,
                payout: scatterPayout,
                count: scatters.length,
                symbol: this.symbols.indexOf(scatter),
                symbols: scatters
            })
        }

        for (let lineIndex = 0; lineIndex < this.playingLines; lineIndex++) {
            let inLineSymbolCount = 1

            for (let reelIndex = 0; reelIndex < reels.length; reelIndex++) {
                const firstSymbol = reels[0][(this.lastSpin.stopPositions[0] + this.lines[lineIndex].combination[0]) % reels[0].length]

                if (this.symbols[firstSymbol].name === 'scatter')
                    continue

                const currentSymbol = reels[reelIndex][(this.lastSpin.stopPositions[reelIndex] + this.lines[lineIndex].combination[reelIndex]) % reels[reelIndex].length]

                if (reelIndex > 0) {
                    if (currentSymbol === firstSymbol)
                        inLineSymbolCount++

                    if (currentSymbol !== firstSymbol || inLineSymbolCount === reels.length) {
                        if ((inLineSymbolCount - 2) >= 0 && this.symbols[firstSymbol].payouts[inLineSymbolCount - 2] > 0) {
                            const payout = this.symbols[firstSymbol].payouts[inLineSymbolCount - 2] * (this.bonusGame ? 3 : 1) * this.betsPerLine[this.playingBet] * this.lines.length

                            totalWin += payout

                            lines.push({
                                line: lineIndex,
                                count: inLineSymbolCount,
                                payout,
                                symbol: firstSymbol,
                                symbols: this.lines[lineIndex].combination.slice(0, inLineSymbolCount).map((v, k) => {
                                    return {
                                        reelIndex: k,
                                        rowIndex: v
                                    }
                                })
                            })
                        }

                        break
                    }
                }
            }
        }

        return {
            totalWin,
            scatters,
            lines
        }
    }

    getAlteredLastSpinWinningsAndFreeGames(minMultiplier, maxMultiplier) {
        let winnings = this.getLastSpinWinningsAndFreeGames()
        let lookups = 0

        const bet = (this.betsPerLine[this.playingBet] * this.playingLines)

        if (typeof(maxMultiplier) === 'number')
            while (lookups <= 250000 && (winnings.totalWin / bet) > maxMultiplier) {
                this.generateSpin(true)
                winnings = this.getLastSpinWinningsAndFreeGames()
                lookups++
            }
        else if (minMultiplier)
            while (lookups <= 250000 && (winnings.totalWin / bet) < minMultiplier) {
                this.generateSpin(true)
                winnings = this.getLastSpinWinningsAndFreeGames()
                lookups++
            }

        return winnings
    }

    getRendererBoxBoundaries(content, limit) {
        const length = stripAnsi(content).length
    
        if (length > limit)
            throw new Error('Box out of bounds.')
    
        const diff = limit - length
    
        return `${' '.repeat(Math.floor(diff / 2))}${content}${' '.repeat(Math.ceil(diff / 2))}`
    }

    getRendererText() {
        if (this.rendererData.showText.text !== null)
            return this.rendererData.showText.text

        return ''
    }

    getRendererSubText() {
        if (this.rendererData.showSubtext.text !== null)
            return this.rendererData.showSubtext.text

        return ''
    }

    getRendererFreeGamesText() {
        if (this.rendererData.showFreeGamesText.text !== null)
            return this.rendererData.showFreeGamesText.text
        else if (this.bonusGame)
            if (this.bonusGame.total !== this.bonusGame.left)
                return `Free Game ${this.bonusGame.current} / ${this.bonusGame.total}`

        return ''
    }

    getRendererFreeGamesSubtext() {
        if (this.rendererData.showFreeGamesSubtext.text !== null)
            return this.rendererData.showFreeGamesSubtext.text
        else if (this.bonusGame)
            if (this.bonusGame.total !== this.bonusGame.left)
                return `${this.bonusGame.win.toFixed(2)} € ${chalk.italic(chalk.hex('999')('Total Win'))}`

        return ''
    }

    getRendererLineSeparator(rowIndex, reelIndex, right) {
        if (this.rendererData.showLine.active !== null)
            if (this.lines[this.rendererData.showLine.active.line].combination[reelIndex] === rowIndex) {
                const lineSep = chalk.hex(`#${reelIndex < this.rendererData.showLine.active.count ? this.lines[this.rendererData.showLine.active.line].hex : '333'}`)('-')

                if (this.rendererData.animateSymbols.symbols)
                    for (let index = 0; index < this.rendererData.animateSymbols.symbols.length; index++)
                        if (rowIndex === this.rendererData.animateSymbols.symbols[index].rowIndex && reelIndex === this.rendererData.animateSymbols.symbols[index].reelIndex)
                            switch (this.rendererData.animateSymbols.frame.current) {
                                case 1:
                                case 3:
                                    return lineSep
        
                                case 2:
                                    return right ? lineSep.repeat(2) : ''
        
                                case 4:
                                    return right ? '' : lineSep.repeat(2)
                            }

                return lineSep
            }

        if (this.rendererData.animateSymbols.symbols)
            for (let index = 0; index < this.rendererData.animateSymbols.symbols.length; index++)
                if (rowIndex === this.rendererData.animateSymbols.symbols[index].rowIndex && reelIndex === this.rendererData.animateSymbols.symbols[index].reelIndex)
                    switch (this.rendererData.animateSymbols.frame.current) {
                        case 1:
                        case 3:
                            return ' '

                        case 2:
                            return right ? ' '.repeat(2) : ''

                        case 4:
                            return right ? '' : ' '.repeat(2)
                    }

        return ' '
    }

    render() {
        if (this.simulating)
            return

        const now = new Date()
        const ts = now.getTime()
        const reels = this.bonusGame ? this.bonusReels : this.reels

        if (this.rendererData.spin.pre.active)
            for (let index = 0; index < this.rendererData.spin.virtualStopPositions.length; index++) {
                if (this.rendererData.spin.pre.reels[index] && ((!this.rendererData.spin.pre.reels[index].lastAt) || (ts - this.rendererData.spin.pre.reels[index].lastAt > this.rendererData.spin.pre.reels[index].speedMs))) {
                    this.rendererData.spin.pre.reels[index].lastAt = ts

                    if (this.rendererData.spin.pre.reels[index].active) {
                        if (typeof(this.rendererData.spin.virtualReelSymbolPop[index]) === 'number') {
                            this.rendererData.spin.virtualReelSymbolPop[index]--
    
                            this.virtualReels[index].pop()
    
                            if (this.rendererData.spin.virtualReelSymbolPop[index] === 0)
                                this.rendererData.spin.virtualReelSymbolPop[index] = null
                        }

                        this.rendererData.spin.virtualStopPositions[index]--

                        if (this.rendererData.spin.virtualStopPositions[index] < 0)
                                this.rendererData.spin.virtualStopPositions[index] = reels[index].length - 1
                        
                        if (this.rendererData.spin.pre.reels[index].stopping > 0) {
                            this.rendererData.spin.pre.reels[index].stopping--

                            if (this.rendererData.spin.pre.reels[index].stopping <= 0)
                                this.rendererData.spin.pre.reels[index].active = false
                        }
                    }
                }
            }

        if ((!this.rendererData.animateSymbols.frame.lastAt) || (ts - this.rendererData.animateSymbols.frame.lastAt > this.rendererData.animateSymbols.speedMs)) {
            this.rendererData.animateSymbols.frame.lastAt = ts

            this.rendererData.animateSymbols.frame.current++

            if (this.rendererData.animateSymbols.frame.current > 4) {
                this.rendererData.animateSymbols.frame.current = 1
                this.rendererData.animateSymbols.frame.times++

                if (this.rendererData.animateSymbols.times && this.rendererData.animateSymbols.frame.times === this.rendererData.animateSymbols.times)
                    this.rendererData.animateSymbols.symbols = null
            }
        }

        const balanceDiff = this.balance - this.startBalance

        let view = ''

        view += `\n    ${' '.repeat(16)}${this.getRendererBoxBoundaries(this.consoleArt, 20)}\n\n`

        if (this.showingInfo) {
            view += `    ${this.getRendererBoxBoundaries(chalk.italic('Paytable & Information'), 50)}\n\n        `

            for (let i = 0; i < 4; i++) {
                view += `${this.getRendererBoxBoundaries(chalk.dim(` ${i + 2}`), 8)}     `
            }

            view += '\n'

            for (let index = 0; index < this.symbols.length; index++) {
                const symbol = this.symbols[index]

                view += `    ${symbol.emoji}  `

                for (let ii = 0; ii < symbol.payouts.length; ii++) {
                    view += `${this.getRendererBoxBoundaries((symbol.payouts[ii] * this.betsPerLine[this.playingBet] * this.playingLines).toFixed(2), 8)}€    `
                }

                view += '\n'
            }

            view += `\n    ${this.getRendererBoxBoundaries(chalk.bold(`${this.symbols.filter(v => v.name === 'scatter')[0].emoji.repeat(3)} or more`), 46)}\n`
            view += `    ${this.getRendererBoxBoundaries(chalk.bold('trigger 15 free spins'), 50)}\n`
            view += `    ${this.getRendererBoxBoundaries(chalk.bold('with x3 mulitplier'), 50)}`
        } else {
            view += `  ${' '.repeat(15)}┌${'─'.repeat(24)}┐\n`

            for (let rowIndex = 0; rowIndex < this.rows; rowIndex++) {
                for (let reelIndex = 0; reelIndex < this.virtualReels.length; reelIndex++) {
                    let symbolPositionOnReel = this.rendererData.spin.virtualStopPositions[reelIndex]
    
                    for (let symbolOffset = 1; symbolOffset <= rowIndex; symbolOffset++) {
                        symbolPositionOnReel += 1
    
                        if (symbolPositionOnReel > this.virtualReels[reelIndex].length - 1)
                            symbolPositionOnReel = 0
                    }
    
                    view += `${reelIndex === 0 ? `  ${' '.repeat(15)}│` : ''}${this.getRendererLineSeparator(rowIndex, reelIndex, false)}${this.symbols[this.virtualReels[reelIndex][symbolPositionOnReel]].emoji}${this.getRendererLineSeparator(rowIndex, reelIndex, true)}${(reelIndex === reels.length - 1) ? '' : '│'}`
                }
        
                view += '│'
    
                if (rowIndex !== (this.rows - 1))
                    view += '\n'
            }
    
            view += `\n  ${' '.repeat(15)}└${'─'.repeat(24)}┘`
            view += `\n${' '.repeat(15)}${this.getRendererBoxBoundaries(`${this.turboSpin ? '✅' : '❌'} ${chalk.italic(chalk.hex('999')('Turbo Spin'))}`, 15)}${this.getRendererBoxBoundaries(`${this.autoSpin ? '✅' : '❌'} ${chalk.italic(chalk.hex('999')('Auto Spin'))}`, 12)}\n`
            view += `\n${' '.repeat(15)}${this.getRendererBoxBoundaries(chalk.bold(`${this.balance.toFixed(2)} € ${chalk.hex('999')('💸')}`), 30)}`
            view += `\n${' '.repeat(15)}${this.getRendererBoxBoundaries(chalk.bold(`${(this.betsPerLine[this.playingBet] * this.playingLines).toFixed(2)} € ${chalk.italic(chalk.hex('999')('Bet'))}`), 15)}${this.getRendererBoxBoundaries(chalk.bold(`${this.playingLines} ${chalk.italic(chalk.hex('999')(`Line${this.playingLines === 1 ? '' : 's'}`))}`), 15)}\n\n`
            view += `${' '.repeat(15)}${this.getRendererBoxBoundaries(this.getRendererText(), 30)}\n`
            view += `${' '.repeat(15)}${this.getRendererBoxBoundaries(this.getRendererSubText(), 30)}\n`
            view += `${' '.repeat(15)}${this.getRendererBoxBoundaries(this.getRendererFreeGamesText(), 30)}\n`
            view += `${' '.repeat(15)}${this.getRendererBoxBoundaries(this.getRendererFreeGamesSubtext(), 30)}\n\n`
        }

        if (process.stdout.cursorTo)
            process.stdout.cursorTo(0, 0)

        process.stdout.write(view)
    }
}

export const Slot = new HotScatter()

export const MODES = {
    PLAY: 0,
    OPTIMIZE_RTP: 1,
    SIMULATE_SPINS: 2,
    SIMULATE_BUYS: 3
}
