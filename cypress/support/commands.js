// use this to select a random option
const getRandNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  

// we select the input everytime to play, so this helps shorten that query  
Cypress.Commands.add('getEmptyInput', () => {
    cy.get('input[placeholder*="Enter a number"]').as('emptyInput');
    return cy.get('@emptyInput');
})

// takes in all possible plays, and generates an array of random plays for the players to pick from 
Cypress.Commands.add('playRandomSquares', (totalSquares, userInput) => {
    const allPlayableSquares = Array.from({ length: totalSquares }, (_, i) => i);
    // here we used "movesToPlay" to limit the plays to a number too few to win or tie
    const movesToPlay = (userInput -1) *2;
    const allPickedSquares = [];
       
    // Add all possible plays to playableSquares array, and track turns taken in another
    for (let i = 0; i < movesToPlay; i++) {
        const pickedSquareIndex = getRandNum(0, allPlayableSquares.length - 1);
        const turnTaken = allPlayableSquares.splice(pickedSquareIndex, 1)[0];
        allPickedSquares.push(turnTaken);
    }

    cy.wrap(allPickedSquares).as('allPickedSquares');
    cy.wrap(allPlayableSquares).as('allPlayableSquares');  
});
    
// an algorithm to generate a starting square and path to victory for player X
Cypress.Commands.add('playWinStrategy', (totalSquares, userInput) => {
    const allLosingSquares = Array.from({ length: totalSquares }, (_, i) => i);
    // here we used "movesToWin" to allow enough for a win
    const movesToWin = (userInput * 2) - 1;
     // objects containing starting indexes, victory paths, and functions to pick further indexes to win
    const winStrats = [
        {
            startCorner: 'topLeft',
            startIndex: 0,
            winPath: {
                winHorizontal: i => i,
                winVertical: i => userInput * i,
                winDiagonal: i => userInput * i + i,
            }
        },
        {
            startCorner: 'topRight',
            startIndex: userInput - 1,
            winPath: {
                winHorizontal: i => userInput - 1 - i,
                winVertical: i => userInput * i + (userInput - 1),
                winDiagonal: i => userInput * i + (userInput - 1 - i),
            }
        },
        {
            startCorner: 'bottomLeft',
            startIndex: (userInput * (userInput - 1)),
            winPath: {
                winHorizontal: i => userInput * (userInput - 1) + i,
                winVertical: i => userInput * (userInput - 1 - i),
                winDiagonal: i => userInput * ((userInput - 1) - i) + i,
            }
        },
        {
            startCorner: 'bottomRight',
            startIndex: userInput * userInput - 1,
            winPath: {
                winHorizontal: i => userInput * userInput - 1 - i,
                winVertical: i => userInput * (userInput - 1 - i) + (userInput - 1),
                winDiagonal: i => userInput * (userInput - 1 - i) + (userInput - 1 - i),
            }
        }
    ];

    // picks a random strategy and initilizes an array for winning moves
    const strategy = winStrats[Math.floor(Math.random() * winStrats.length)];
    const pathArray = ["winHorizontal", "winVertical", "winDiagonal"];
    const randomPath = pathArray[Math.floor(Math.random() * pathArray.length)];
    const path = strategy.winPath[randomPath];
    const winningMoves = [];

    // Add all possible plays other than the chosen win plays to allLosingSquares array
    for (let i = 0; i < userInput; i++) {
        const move = path(i);
        allLosingSquares.splice(allLosingSquares.indexOf(move), 1);
        winningMoves.push(move);
    }

    // we set a turn count for player X, so player O stops playing after the winning play
    let winningTurnCount = 0;  

    // how we loop through our move counts based on the board size, making moves as we go
    for (let roundCount = 0; roundCount < movesToWin; roundCount++) {

        // we choose from our winning and losing options for each player
        const winningMove = winningMoves[roundCount];
        const losingMove = allLosingSquares[roundCount];

        // we alternate turns between player X, choosing winning moves, and player O, picking the rest.
        cy.get(`td[id="${winningMove}"]`).click();
        winningTurnCount++
       
        // if player X has taken enough moves to win, we end the loop
        if (winningTurnCount == userInput) {
            return
        } else {
            // but if player X has not exhausted enough moves to win, we continue.
            // player O has no strategy, so will pick from the first indexes available.
            cy.get(`td[id="${losingMove}"]`).click();
            
        }
    }    
})