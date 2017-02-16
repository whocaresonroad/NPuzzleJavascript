'use strict';

/*
 * Class for managing the state of the board. Used in the search tree.
 */
class Board {

  constructor(theParent, theValues, theDirection) {
	  	// Parent of the board in the search tree
	    this.parent = theParent;
	    // Values representing the state of the board
	    this.values = theValues.slice(0);
	    // Numerical id of the board based on it's current state as string. Used
		// to check if the boards are same
	    this.numId = this.countId();
	    // Manhattan heuristic distance from this state to solved state
	    this.estimatedDistance = this.countEstimatedDistance();
	    // Direction the "0" moved from the parent board
	    this.direction = theDirection;
	    // Depth in the search tree
	    this.depth = this.countDepth();
  }

  /*
	 * Count and return the string representing the state
	 */
  countId() {
    let value = "";
    for (let i = 0; i < this.values.length; i++) {
      value = value + this.values[i];
    }
    return value;
  }

  /*
	 * Return the side count of the board. Board size is side count * side
	 * count.
	 */
  sideCount() {
    return Math.floor(Math.sqrt(this.values.length));
  }

  /*
	 * Count the Manhattan heuristic distance from this state to solved state
	 * and return it.
	 */
  countEstimatedDistance() {
    let estimated = 0;
    let x = 0;
    let y = 0;
    let sideCount = this.sideCount();

    for (let i = 0; i < this.values.length; i++) {
      if (this.values[i] !== 0) {
        x = Math.abs((this.values[i] % sideCount) - (i % sideCount));
        y = Math.abs((Math.floor(this.values[i] / sideCount)) - (Math.floor(i / sideCount)));

        estimated = estimated + x + y;
      }
    }

    return estimated;
  }

  /*
	 * Return a copy of the state.
	 */
  getValues() {
    return this.values.slice(0);
  }

  /*
	 * Return the id string representing the state of the board.
	 */
  getNumId() {
    return this.numId;
  }

  /*
	 * Return the Manhattan heuristic distance from this state to solved state.
	 */
  getEstimatedDistance() {
    return this.estimatedDistance;
  }

  /*
	 * Count and return the depth in the search tree.
	 */
  countDepth() {
    if (this.parent !== null) {
      return this.parent.depth + 1;
    } else {
      return 0;
    }
  }

  /*
	 * Return the estimated total cost from this state to solved state.
	 */
  getTotalCost() {
    return this.depth + this.estimatedDistance;
  }

  /*
	 * Return the index to the "0"
	 */
  zeroPosition() {
    let zeroPos = 0;

    for (let i = 0; i < this.values.length; i++) {
      if (this.values[i] === 0) {
        zeroPos = i;
        break;
      }
    }
    return zeroPos;
  }

  /*
	 * Swap the positions of zero and the given position and count some the
	 * values to represent the new state.
	 */
  swapPositions(swapPos) {
    let zeroPos = this.zeroPosition();

    this.values[zeroPos] = this.values[swapPos];
    this.values[swapPos] = 0;
    this.numId = this.countId();
    this.estimatedDistance = this.countEstimatedDistance();
  }

  /*
	 * Moves the "0" to different directions and by doing so shuffles the board.
	 */
  shuffle(shuffleCount) {
    let i = 0;
    let previousZeroPos = -1;
    let x = 0;
    let y = 0;
    let sValue = 0;
    let sideCount = this.sideCount();

    do {
      let zeroPos = this.zeroPosition();

      x = Math.floor(zeroPos % sideCount);
      y = Math.floor(zeroPos / sideCount);
      sValue = Math.floor(Math.random() * 4);

      if (sValue === 0) {
        x = x - 1;
      }
      else if (sValue == 1) {
        x = x + 1;
      }
      else if (sValue == 2) {
        y = y - 1;
      }
      else {
        y = y + 1;
      }

      if ((y >= 0) && (y < sideCount) && (x >= 0) && (x < sideCount)) {
        let swapPos = y * sideCount + x;
        if (swapPos != previousZeroPos) {
          this.swapPositions(swapPos);
          previousZeroPos = zeroPos;
          i++;
        }
      }
    } while (i < shuffleCount);
  }

  /*
	 * Return true if the board state is the solved position, false otherwise.
	 */
  isEndPosition() {
    for (let i = 0; i < this.values.length; i++) {
      if (i != this.values[i]) {
        return false;
      }
    }

    return true;
  }
}


/*
 * Helper class for holding board and the estimate. Used for adding boards to be
 * checked to priority queue.
 */
class FrontierElement {
  constructor( board, estimate) {
	  this.board = board;
	  this.estimate = estimate;
  }
}


/*
 * Class for saving and managing the puzzle solving state.
 */
class Solver {
  constructor() {
    this.frontier = [];
    this.checked = [];
    this.solving = false;
  }

  /*
	 * Adds the given board to the list of already checked boards. Uses the
	 * board id as identifier.
	 */
  addChecked(theBoard) {
    this.checked.push(theBoard.getNumId());
  }

  /*
	 * Return true if the given board has been already checked.
	 */
  alreadyChecked(theBoard) {
    return (this.checked.indexOf(theBoard.getNumId()) != -1);
  }

  /*
	 * Returns the number of unique board positions already checked.
	 */
  getCheckedLength() {
    return this.checked.length;
  }

  /*
	 * Returns the number of unique board positions waiting to be checked.
	 */
  getFrontierLength() {
    return this.frontier.length;
  }

  /*
	 * Return true if the solving is going on.
	 */
  isSolving() {
    return this.solving;
  }

  /*
	 * Starts the solving from the given board position.
	 */
  startSolving(theBoard) {
    this.frontier.push( new FrontierElement(theBoard, theBoard.getEstimatedDistance()) );
    this.solving = true;
  }

  /*
	 * Stops solving.
	 */
  stopSolving() {
    this.frontier = [];
    this.checked = [];
    this.solving = false;
  }

  /*
	 * Finds from the given array (which contains FrontierElements) a position
	 * where the estimated cost is bigger than the given cost. If not found,
	 * returns -1. The array is sorted by the estimated cost, lowest values
	 * first.
	 */
  findFrontierElementIndex(arr, estimatedCost) {
    for (let i = 0; i < arr.length; i++ ) {
      if (arr[i].estimate > estimatedCost) {
        return i;
      }
    }

    return -1;
  }

  /*
	 * Checks one board which has the lowest estimated cost. If that is not the
	 * solution, then expands it by moving the "0" and adding the new boards to
	 * the frontier.
	 */
  checkOneBoard() {
    let currentBoard = null;

    // Do we have something to check
    if (this.frontier.length > 0) {
    	// Get the first board and add it to the list of checked boards
      currentBoard = this.frontier.shift().board;
      this.addChecked(currentBoard);

      // Is it the end position
      if (currentBoard.isEndPosition()) {
    	  // Return the board containing the solution and tell we are done here.
        return { finished: true, board:currentBoard };
      }

      // Create new frontier from the board (moving "0" to up, down, left and right)
      let newFrontier = this.getNewFrontier(currentBoard);
      let totalCost = 0;
      let index = 0;
      let newBoard = null;

      while (newFrontier.length > 0) {
        newBoard = newFrontier.shift();
        if (!this.alreadyChecked(newBoard)) {
        	// The board is not already checked, add it to the correct place in the frontier based it''s estimated cost
          totalCost = newBoard.getTotalCost();
          index = this.findFrontierElementIndex(this.frontier, newBoard.getTotalCost());
          if (index == -1) {
        	  // Position not found, ad it to the last element
            this.frontier.push( new FrontierElement(newBoard, newBoard.getTotalCost()) );
          } else {
        	  // Position found, add it there
            this.frontier.splice(index, 0, new FrontierElement(newBoard, newBoard.getTotalCost()) );
          }
        }
      }
    }

    // Return the checked board and tell we need more checks
    return { finished: false, board:currentBoard };
  }

  /*
   * Return a list of new frontier boards by moving the "0" to up, down, left and right and checking they are valid moves.
   */
  getNewFrontier(currentBoard) {
    let newFrontier = [];
    let zeroPos = currentBoard.zeroPosition();
    let newBoard = null;
    let position = 0;

    // Check up
    position = zeroPos - currentBoard.sideCount();
    if (position >= 0) {
      newBoard = new Board(currentBoard, currentBoard.getValues(), "Up");
      newBoard.swapPositions(position);
      newFrontier.push(newBoard);
    }

    // Check down
    position = zeroPos + currentBoard.sideCount();
    if (position < currentBoard.sideCount() * currentBoard.sideCount()) {
      newBoard = new Board(currentBoard, currentBoard.getValues(), "Down");
      newBoard.swapPositions(position);
      newFrontier.push(newBoard);
    }

    // Check left
    position = zeroPos - 1;
    if (position >= 0) {	// ParseInt eats the -0 away
      if (Math.floor(position / currentBoard.sideCount()) == Math.floor(zeroPos / currentBoard.sideCount())) {
        newBoard = new Board(currentBoard, currentBoard.getValues(), "Left");
        newBoard.swapPositions(position);
        newFrontier.push(newBoard);
      }
    }

    // Check right
    position = zeroPos + 1;
    if (Math.floor(position / currentBoard.sideCount()) == Math.floor(zeroPos / currentBoard.sideCount())) {
      newBoard = new Board(currentBoard, currentBoard.getValues(), "Right");
      newBoard.swapPositions(position);
      newFrontier.push(newBoard);
    }

    return newFrontier;
  }
}


/*
 * The puzzle controller class global.
 */
var npuzzle = null;


/*
 * The puzzle controller class, sets everything up.
 * Handles the user actions and keeps UI up to date with the NPuzzleView.
 * Uses the Solver to solve the puzzle.
 * Uses the Board to manage the current state of the puzzle.
 */
class NPuzzle {

	/*
	 * Create everything and show the board
	 */
  constructor(boardSize) {
    this.boardSize = boardSize;
    this.defaultValues = this.createValues(boardSize);
    this.board = new Board(null, this.defaultValues, "");
    this.solver = new Solver();
    this.view = new NPuzzleView(this, this.board);
    this.solvingSpeedInMs = NPuzzle.solvingSpeed();
    this.solutionAnimator = new SolutionAnimator(this.board, this.board, this.view);
    this.solvingTimer = -1;

    this.view.setBoard(this.board);
}

  /*
   * The default solving speed.
   */
  static solvingSpeed() {
	  return 800;
  }

  /*
   * Create the values which represent solved puzzle.
   */
  createValues(boardSize) {
    let values = new Array(boardSize);
    for (let i = 0; i < boardSize; i++){
      values[i] = i;
    }

    return values;
  }

  /*
   * General change event for UI to respond.
   */
  fireChangeEvent(cause, estimatedDistance, solution) {
    document.dispatchEvent(
      new CustomEvent("board.change",
        {
          'detail': {
            reason: cause,
            counter: this.solver.getCheckedLength(),
            frontier: this.solver.getFrontierLength(),
            distance: estimatedDistance,
            solution: solution
          }
        }));

  }

  /*
   * Reset everything back to the startup state.
   */
  reset() {
	  this.board = new Board(null, this.defaultValues, "");
	  this.view.setBoard(this.board);
	  this.cancelSolvingTimer();
	  this.solver.stopSolving();
	  this.solutionAnimator.stopAnimating();
	  this.solutionAnimator = new SolutionAnimator(this.board, this.board, this.view);
	  this.fireChangeEvent("reset", 0, "");
	  this.solvingSpeedInMs = NPuzzle.solvingSpeed();
  }
	 
  /*
   * Respond to the key event by moving the "0" to the direction pointed by the arrow key.
   * Check that the move is possible and updates the board.
   */
  readKey(e) {
    e = e || window.event;

    let isArrowKey = false;
    let zeroPos= this.board.zeroPosition();

    let x= Math.floor(zeroPos % this.board.sideCount());
    let y= Math.floor(zeroPos / this.board.sideCount());

    if (e.keyCode == '38') {
      // Up arrow
      y = y - 1;
      isArrowKey = true;
    } else if (e.keyCode == '40') {
      // Down arrow
      y = y + 1;
      isArrowKey = true;
    } else if (e.keyCode == '37') {
      // Left arrow
      x = x - 1;
      isArrowKey = true;
    } else if (e.keyCode == '39') {
      // Right arrow
      x = x + 1;
      isArrowKey = true;
    }

    if (isArrowKey) {
        // Is the move possible?
        if ((y < 0) || (y >= this.board.sideCount()) || (x < 0) || (x >= this.board.sideCount())) {
          return;
        }

        // Swap the positions and update the UI
        this.board.swapPositions(y * this.board.sideCount() + x);

        this.view.setBoard(this.board);
    }
  }

  /*
   * Starts Solver.
   */
  solve() {
	  this.solutionAnimator.stopAnimating();
	  this.solver.startSolving(this.board);
	  this.solvingTimer = setTimeout(this.oneCheck.bind(this), 1);
  }

  /*
   * Speeds up the Solver.
   */
  faster() {
    if (!this.solver.isSolving()) {
      this.solve();
    }
    this.solvingSpeedInMs = 4 + Math.floor(this.solvingSpeedInMs * 0.8);
  }

  /*
   * Slows down the Solver.
   */
  slower() {
    if (!this.solver.isSolving()) {
      this.solve();
    }
    this.solvingSpeedInMs = 4 + Math.floor(this.solvingSpeedInMs / 0.8);
  }

  /*
   * Stops Solver and shuffles the board by moving the "0" 10 times.
   */
  shuffle() {
	  this.solutionAnimator.stopAnimating();
	  this.solutionAnimator = new SolutionAnimator(this.board, this.board, this.view);
	  this.cancelSolvingTimer();
	  this.solver.stopSolving();
	  this.fireChangeEvent("reset", 0, "");
	  this.board.shuffle(10);
	  this.view.setBoard(this.board);
  }

  /*
   * Cancel the solving timer.
   */
  cancelSolvingTimer() {
	  clearTimeout(this.solvingTimer);
  }

  animateSolution() {
	  // Start animating if there is a solution
	  if (this.solutionAnimator.animateSolution()) {
		  this.cancelSolvingTimer();
		  this.solver.stopSolving();
	  }
  }

  /*
   * Callback called by the timer, ask Solver to check 1 board and then either shows the solution
   * asks the timer to call us again.
   */
  oneCheck() {
	  // If we are solving
    if (this.solver.isSolving()) {
    	// Ask Solver to check one board
      let result = this.solver.checkOneBoard();
      let currentBoard= result.board;

      // Did we find the solution
      if (result.finished) {
    	  // Yes, save the start board and the solution board so we can animate the solution
    	  this.solutionAnimator = new SolutionAnimator(this.board, currentBoard, this.view);
    	  this.board = new Board(null, this.defaultValues, "");

        // Inform UI that we are finished and stop the Solver
        this.fireChangeEvent("finished", 0, this.solutionAnimator.getSolutionString());
        this.view.setBoard(this.board);
        this.solver.stopSolving();
      } else if (this.solver.getFrontierLength() > 0) {
    	  // We didn't find the solution and there are still positions to check
    	  // Update UI and reset the timer
        this.view.setBoard(currentBoard);
        this.fireChangeEvent("changed", currentBoard.getTotalCost(), "");
        this.solvingTimer = setTimeout(this.oneCheck.bind(this), this.solvingSpeedInMs);
      }
    }
  }

  /*
   * User selected new size of board, new show default board
   */
  boardSizeChanged(theSize) {
    this.solver.stopSolving();
    this.cancelSolvingTimer();
    this.boardSize = theSize;
    this.defaultValues = this.createValues(theSize);
    this.board = new Board(null, this.defaultValues, "");
	this.solutionAnimator.stopAnimating();
	this.solutionAnimator = new SolutionAnimator(this.board, this.board, this.view);

    // UI needs to be updated completely
    this.view.buildContent(this.board);
    this.view.setBoard(this.board);
    this.view.resetState();
  }
}


/*
 * Class for animating the solution
 */
class SolutionAnimator {

    constructor(solutionStart, solutionSolved, view) {
    	this.view = view;
    	this.board = null;
        this.lastSolvedStart = solutionStart;
        this.lastSolvedSolution = solutionSolved;
        this.solutionSteps = [];
        this.animateTimer = -1;
        this.solutionString = "";
        this.animating = false;

        // Create a string representing the solution ("Up", "Up", "Left", etc.)
        this.solutionString = solutionSolved.direction;
        let currentBoard = solutionSolved.parent;

        while (currentBoard !== null && currentBoard.parent !== null) {
        	this.solutionString = currentBoard.direction + ", " + this.solutionString;
          currentBoard = currentBoard.parent;
        }
    }

    /*
     * Return the solution as string ("Up", "Up", "Left", etc.).
     */
    getSolutionString() {
    	return this.solutionString;
    }

    /*
     * Stop the animation.
     */
    stopAnimating() {
    	this.animating = false;
    	clearTimeout(this.animateTimer);
    }
    
  /*
   * Start animating the solution.
   */
  animateSolution() {
	// Set the start position
	this.board = this.lastSolvedStart;

	// Add last step to the solution steps
	this.solutionSteps = [];
	this.solutionSteps.push(this.lastSolvedSolution);

	let currentBoard = this.lastSolvedSolution.parent;

	// Iterate through parents and add steps, the first step will be last on the list
	while (currentBoard !== null && currentBoard.parent !== null) {
	  this.solutionSteps.push(currentBoard);
	  currentBoard = currentBoard.parent;
	}

	// Is there is a solution to show
	if (this.solutionSteps.length > 1) {
		// Set timeout to animate and show board
		this.animateTimer = setTimeout(this.animateOneStep.bind(this), 800);
		this.view.setBoard(this.board);
		this.animating = true;
		return true;
	}

	return false;
  }

  /*
   * Show one solutions step and reset the timer
   */
  animateOneStep() {
	  if (this.animating) {
		    let solutionStep = null;

		    // Do we have more steps
		    if (this.solutionSteps.length > 0) {
		    	// Yes, show it and reset timer
		      solutionStep = this.solutionSteps.pop();
		      this.view.setBoard(solutionStep);
		      this.animateTimer = setTimeout(this.animateOneStep.bind(this), 800);
		    } else {
		    	this.animating = false;
		    }
	  }
  }
}


/*
 * All loaded, create controller and set all things up
 */
window.onload = function() {
  npuzzle = new NPuzzle(9);
};


/*
 * Helper function to handle the board change user action.
 * Inform controller about the size change.
 */
function BoardSizeSelection() {
  let size= document.getElementById("boardSizeSelection").value;
  if (size == "3 * 3") {
    npuzzle.boardSizeChanged(9);
  } else if (size == "4 * 4") {
    npuzzle.boardSizeChanged(16);
  } else if (size == "5 * 5"){
    npuzzle.boardSizeChanged(25);
  }
  // Change focus so the arrow keys work
  document.getElementById("solve").focus();
}


/*
 * The the puzzle UI class
 */
class NPuzzleView {

	/*
	 * Remember the controller, build UI for the correct board size and add listeners
	 */
  constructor(thePuzzle, theBoard) {
    this.puzzle = thePuzzle;
    this.buildContent(theBoard);

    document.getElementById("shuffle").addEventListener('click', this, false);
    document.getElementById("reset").addEventListener('click', this, false);
    document.getElementById("solve").addEventListener('click', this, false);
    document.getElementById("slower").addEventListener('click', this, false);
    document.getElementById("faster").addEventListener('click', this, false);
    document.getElementById("solution").addEventListener('click', this, false);
    document.addEventListener("keydown", this, false);
    document.addEventListener("board.change", this, false);
  }

  /*
   * Event handler
   */
  handleEvent(event) {
    let target = event.target;

    switch (event.type) {
    
    	// Button handlers
      case "click":
        if (target.id == "shuffle") {
          this.puzzle.shuffle();
        } else if (target.id == "reset") {
          this.puzzle.reset();
        } else if (target.id == "solve") {
          this.puzzle.solve();
        } else if (target.id == "slower") {
          this.puzzle.slower();
        } else if (target.id == "faster") {
          this.puzzle.faster();
        } else if (target.id == "solution") {
          this.puzzle.animateSolution();
        }
        break;

        // Key handlers
      case "keydown":
        this.puzzle.readKey(event);
        break;

        // Puzzle handlers
      case "board.change":
        let detail = event.detail;

        if (detail.reason == "reset"){
          this.resetState();
        } else if (detail.reason == "finished") {
          this.updateFinished(detail.counter, detail.frontier, detail.solution);
        } else if (detail.reason == "changed") {
          this.updateCounter(detail.counter, detail.frontier, detail.distance);
        }
        break;

      default:
        break;
    }
  }

  /*
   * Solving has been finished, show result
   */
  updateFinished(theCheckedLength, theFrontierLength, theSolution) {
    document.getElementById("counter").innerHTML =
      "Solved by searching " + theCheckedLength + "/" + (theCheckedLength + theFrontierLength) + " boards";
    document.getElementById("distance").innerHTML = theSolution;
  }

  /*
   * One board checked, update the counts
   */
  updateCounter(theCheckedLength, theFrontierLength, theDistance) {
    document.getElementById("counter").innerHTML =
      "Searching/waiting to be searched: " + theCheckedLength + "/" + (theCheckedLength + theFrontierLength);
    let extra = "";
    if (theDistance < 10) {
      extra = " ";
    }
    document.getElementById("distance").innerHTML = "A* search algorithm heuristic (using Manhattan distance) " + extra + theDistance;
  }

  /*
   * Clear counters
   */
  resetState() {
    document.getElementById("counter").innerHTML = "";
    document.getElementById("distance").innerHTML = "";
  }

  /*
   * Build board content based on the given board size
   */
  buildContent(theBoard) {
    let sideCount = theBoard.sideCount();
    let content = "";

    for (let y = 0; y < sideCount; y++) {
      content = content + "<tr>";
      for (let x = 0; x < sideCount; x++) {
        content = content + '<td id="t' + x + y +'">x</td>';
      }
      content = content + "</tr>";
    }
    document.getElementById("board").innerHTML = content;
  }

  /*
   * Update the board
   */
  setBoard(theBoard) {
    let values = theBoard.getValues();
    let sideCount = theBoard.sideCount();
    let tId = "";

    // Is this solved board
    let isEnd = theBoard.isEndPosition();

    let x = 0;
    let y = 0;

    for (let i = 0; i < values.length; i++) {
      x = Math.floor(i % sideCount);
      y = Math.floor(i / sideCount);

      tId = "t" + x + y;
      document.getElementById(tId).innerHTML = values[i].toString();

      if (isEnd) {
    	  // Change elements background color when showing solved board
        document.getElementById(tId).style.backgroundColor = "gold";
      } else {
    	  // Unsolved board, set background color, "0" position a bit daker than the rest
        if (values[i] === 0) {
          document.getElementById(tId).style.backgroundColor = "#396D86";
        } else {
          document.getElementById(tId).style.backgroundColor = "#699DB6";
        }
      }
    }
  }
}
