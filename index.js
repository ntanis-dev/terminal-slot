import HotScatter from './hot-scatter.js'

HotScatter.play({
    minimumPreSpinTimeMs: 500,
    minimumPreSpinTimeTeaseMs: 2500,
    minimumWinKeyMultiplier: 50,
    simulatedServerResponseMs: [50, 100],
    alwaysSpin: []
})

// HotScatter.optimizeRtp({
//     targetMin: 80.0,
//     targetMax: 82.0,
//     maxIterations: 50,
//     runsPerIteration: 1000000,
//     type: 'base',
//     cryptoRNG: true,
//     ignoreMaxOptimizations: true,
//     maintainStackedSymbols: false,

//     minimumSymbolsPerReel: [
//         [1, 1, 1, 1, 1, 1, 1, 1],
//         [1, 1, 1, 1, 1, 1, 1, 1],
//         [1, 1, 1, 1, 1, 1, 1, 1],
//         [1, 1, 1, 1, 1, 1, 1, 1],
//         [1, 1, 1, 1, 1, 1, 1, 1]
//     ],

//     skipSymbols: [7]
// })

// HotScatter.simulateSpins(10000000, {
//     bet: 0,
//     lines: 10,

//     highWinMultipliers: [
//         100,
//         250,
//         500,
//         1000,
//         1500
//     ],

//     cryptoRNG: false
// })

// HotScatter.simulateBonusBuys(100000, 85, {
//     randomLinesAndBet: false,
//     cryptoRNG: true,
//     bet: 5,
//     lines: 10,

//     highBuyMultipliers: [
//         100,
//         250,
//         500,
//         1000,
//         1500
//     ],
// })
