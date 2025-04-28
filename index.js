import {Slot, MODES} from './hot-scatter.js'

const mode = MODES.PLAY // PLAY or OPTIMIZE_RTP or SIMULATE_SPINS or SIMULATE_BUYS

//  Keybinds
// 
//      i = Show Information
//      t = Toggle Turbo Spin
//      a = Toggle Auto Spin
//      arrow up = Increase Bet
//      arrow down = Decrease Bet
//      arrow right = Increase Lines
//      arrow left = Decrease Lines
//      spacebar = Start Spin / Stop Spin
// 
//      Cheats
//          r = Reset Balance (500.00 €)
//          c = Clear Balance (0.00 €)
//          b = Minimum Bonus Spin
//          m = Minimum Win Spin
//          n = No Win Spin

switch (mode) {
    case MODES.PLAY:
        // To play the game.
        Slot.play({
            minimumPreSpinTimeMs: 500,                  // The minimum pre-spin (visual) time in milliseconds.
            minimumPreSpinTimeTeaseMs: 2500,            // The minimum pre-spin (visual) time for bonus tease in milliseconds.
            minimumWinKeyMultiplier: 50,                // The minimum win to look for when pressing the minimum win spin key.
            minimumBonusKeyAmount: 3,                  // The minimum amount of scatter symbols to look for when pressing the minimum bonus spin key.
            simulatedServerResponseMs: [50, 100],       // The simulated server response time in milliseconds.
            alwaysSpin: []                              // An array of stop positions to always spin to, useful to see a specific spin out of a simulation.
        })
        
        break

    case MODES.OPTIMIZE_RTP:
        // To attempt and optimize the reels either way.
        Slot.optimizeRtp({
            targetMin: 58.0,                        // The minimum target RTP to aim for.
            targetMax: 60.0,                        // The maximum target RTP to aim for.
            maxIterations: 50,                      // The maximum iterations of attempts to perform.
            runsPerIteration: 1000000,              // The spin runs per iteration, to gather the RTP in real time.
            type: 'base',                           // Whether we are optimizing base game or bonus game, 'base' or 'bonus'.
            cryptoRNG: false,                       // Whether to use cryptographically secure random generation to for the spins.
            ignoreMaxOptimizations: true,           // Whether to ignore max optimizations reach (same reels).
            maintainStackedSymbols: false,          // Whether to maintain stacked symbols in reels.

            minimumSymbolsPerReel: [                // The minimum number of symbols per reel.
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1]
            ],

            skipSymbols: [7]                        // The symbols to skip (never change).
        })

        break

    case MODES.SIMULATE_SPINS:
        // To simulate game spins.
        Slot.simulateSpins(1000000, {
                                // ^ The amount of spins to simulate.
            cryptoRNG: false,           // Whether to use cryptographically secure random generation to for the spins.
        
            highWinMultipliers: [       // The spin x multipliers to log as "high wins".
                100,
                250,
                500,
                1000,
                1500
            ]
        })

        break

    case MODES.SIMULATE_BUYS:
        // To simulate bonus buys.
        Slot.simulateBonusBuys(100000, 85, {
            //                                ^ The cost of the buy calculate the RTP based off it.
            //                        ^ The amount of buys to simulate.
            cryptoRNG: false,           // Whether to use cryptographically secure random generation to for the spins.
        
            highReturnMultipliers: [    // The buy x multipliers to log as "high return", based on final x, not buy x.
                100,
                250,
                500,
                1000,
                1500
            ],
        })

        break

    default:
        throw new Error('Unknown mode.')
}
