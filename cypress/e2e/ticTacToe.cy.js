// helper functions

// use this to create a unique userInput each run
const getRandNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;


// use this to determine total number of squares on the board. helps get indexes, possible plays, etc.
const getTotalSquares = (userInput) => (userInput * userInput) -1;

// use this to select unique squares in sequence until all squares are selected.
const playInSequence = (allPickedSquares, index = 0 ) => {
  if (index < allPickedSquares.length) {
    cy.get(`td[id="${allPickedSquares[index]}"]`).click().then(() => {
      playInSequence(allPickedSquares, index + 1);
    });
  }
}

describe('Validate Tic Tac Toe Input Field and Play Button', () => {

  beforeEach(() => {
    cy.visit('http://127.0.0.1:8080/');
  });

  it('should not display a board if input is non-numerical', () => {
    const invalidInputs = ["hello", "@#$%", "abc123", " "];
  
    invalidInputs.forEach(userInput => {
      cy.getEmptyInput().clear().type(userInput);
      cy.get('button').contains("Play").click();
  
      // Ensure the board is not generated
      cy.get('#table').find('tr').should('not.exist');
    });
    // a pause for the test runner
    // cy.pause();
  });

  it('should not display a board if a negative number is inputed', () => {
    const userInput = -1;
    // custom command to target the input field each game
    cy.getEmptyInput().clear().type(userInput);
    cy.get('button').contains("Play").click();
    // the board is generated in a table. a non-valid board will have no rows
    cy.get('#table').find('tr').should('not.exist');
    // a pause for the test runner
    // cy.pause();
  });



  it('should display a board matching numerical input', () => {
    const userInput = getRandNum(3, 6);
    const totalSquares = getTotalSquares(userInput);
    cy.getEmptyInput().clear().type(userInput);
    cy.get('button').contains("Play").click();
    // checks if board generated within range to include a square of the highest index possible
    cy.get(`td[id="${totalSquares}"]`).should("exist")
    // checks to see that a square with a higher index than that is not generated
    cy.get(`td[id="${totalSquares + 1}"]`).should("not.exist");
    // pauses for the test runner
    // cy.pause();
  });

});

describe('Validate Tic Tac Toe Game Play Functionality', () => {

  beforeEach(() => {
    cy.visit('http://127.0.0.1:8080/')
  })

  it('should alternate unique X and O turns of an equal number', () => {
    const userInput = getRandNum(3, 6);
    const totalSquares = getTotalSquares(userInput);
    
    cy.getEmptyInput().clear().type(userInput);
    cy.get('button').contains("Play").click();

    // custom command to select squares at random with too few turns for either player to win or tie.
    cy.playRandomSquares(totalSquares, userInput).then(() => {
      cy.get('@allPickedSquares').then(allPickedSquares => {
        playInSequence(allPickedSquares);
        // verify if each play is recorded and turns alternates. X always goes first.
        cy.wrap(allPickedSquares).each((squareId, index) => {
          cy.get(`td[id="${squareId}"]`).invoke('text').should(text => {
            if (index % 2 === 0) {
              expect(text).to.equal('X');
            } else {
              expect(text).to.equal('O');
            }
          });
        });
      });  
    });

    // verifies that X and O recorded an equal number of turns.
    let countX = 0;
    let countO = 0;

    cy.get('td').each(($el) => {
      cy.wrap($el).invoke('text').then(text => {
        if (text === 'X') {
          countX++;
        } else if (text === 'O') {
          countO++;
        }
      });
    }).then(() => {
      expect(countX).to.equal(countO);
    });
    // pauses for the test runner
    // cy.pause();
  });

  it('should not allow turns to be taken in already played squares', () => {
    const userInput = getRandNum(3, 6);
    const totalSquares = getTotalSquares(userInput);

    cy.getEmptyInput().clear().type(userInput);
    cy.get('button').contains("Play").click();

    // plays a new game with too few moves to reach a win or tie state
    cy.playRandomSquares(totalSquares, userInput).then(() => {
      cy.get('@allPickedSquares').then(allPickedSquares => {
        playInSequence(allPickedSquares);
        // verifies a comparison of our record results when attempting to play the same square.
        cy.wrap(allPickedSquares).each((squareId, index) => {
          cy.get(`td[id="${squareId}"]`).then($square => {
            const mark = $square.text().trim();
            cy.get(`td[id="${squareId}"]`).click();
            cy.get(`td[id="${squareId}"]`).invoke('text').should(markAgain => {
              expect(markAgain.trim()).to.equal(mark);
            });
          }); 
        });
      });
    // pause for the test runner
      // cy.pause();
    });
  });
  it('should not record any moves in unplayed squares', () => {

    let userInput = getRandNum(3, 6);
    let totalSquares = getTotalSquares(userInput);
    
    cy.getEmptyInput().clear().type(userInput);
    cy.get('button').contains("Play").click();

    // play a new game with too few moves to reach a win or tie state
    cy.playRandomSquares(totalSquares, userInput).then(() => {
      cy.get('@allPickedSquares').then(allPickedSquares => {
        playInSequence(allPickedSquares);

        cy.wrap(allPickedSquares).each((squareId, index) => {
          cy.get(`td[id="${squareId}"]`).invoke('text').should(text => {
            if (index % 2 === 0) {
              expect(text).to.equal('X');
            } else {
              expect(text).to.equal('O');
            }
          });

          // Verify that all remaining squares are empty
          cy.get('@allPlayableSquares').then(allPlayableSquares => {
            cy.wrap(allPlayableSquares).each(squareId => {
              cy.get(`td[id="${squareId}"]`).should('not.contain', 'X').and('not.contain', 'O');
            });
          });
        }); 
      });
    });  
    // pause for the test runner
    // cy.pause();
  });
});

  describe('Validate Win Conditions', () => {

    beforeEach(() => {
      cy.visit('http://127.0.0.1:8080/')
    });
  
    it('should play using a random winning strategy for player X', () => {
      const userInput = getRandNum(3, 6);
      const totalSquares = getTotalSquares(userInput);
      
      cy.getEmptyInput().clear().type(userInput);
      cy.get('button').contains("Play").click();

      // custom command to plays a new game where player X picks a random starting square and path to win. 
      // Player O plays dumb.
      cy.playWinStrategy(totalSquares, userInput);
      
      // checks if the win message appears
      cy.get('#endgame').should("be.visible");

      // pause for the test runner
      // cy.pause();
    });

  });

  describe('Validate Game Reset', () => {

    beforeEach(() => {
      cy.visit('http://127.0.0.1:8080/');
    });
    
    it('should reset the game when the page is refreshed', () => {
      const userInput = getRandNum(3,6);
      const totalSquares = getTotalSquares(userInput);
  
      cy.getEmptyInput().clear().type(userInput);
      cy.get('button').contains("Play").click();

      // custom command to select squares at random with too few turns for either player to win or tie.
      cy.playRandomSquares(totalSquares, userInput).then(() => {
        cy.get('@allPickedSquares').then(allPickedSquares => {
          playInSequence(allPickedSquares);
        });
      });

      // refresh the page
      cy.reload();

      // input should be empty and board should not be generated
      cy.getEmptyInput().should('have.value', '');
      cy.get('#table').find('tr').should('have.length', 0);

      // pause for the test runner
      // cy.pause();
    });

  });