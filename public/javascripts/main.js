// Establish a connection to the socket server
const socket = io();

// Create a new Chess game instance
const chess = new Chess();

// Select the chessboard element from the DOM
const boardElement = document.querySelector('.chessboard');

// Initialize variables to keep track of the dragged piece and its source square
let draggedPiece = null;
let sourceSquare = null;

// Initialize the player's role (black or white)
let playerRole = null;

// Function to render the chessboard
const renderBoard = () => {
  // Get the current state of the chessboard
  const board = chess.board();
  
  // Clear the existing chessboard element
  boardElement.innerHTML = "";

  // Loop through each row and column of the chessboard
  board.forEach((row, rowindex) => {
    row.forEach((square, squareindex) => {
      // Create a new square element
      const squareElement = document.createElement("div");

      // Add class for the square's color (light or dark)
      squareElement.classList.add("square", (rowindex + squareindex) % 2 === 0 ? "light" : "dark");

      // Set data attributes for the row and column indices
      squareElement.dataset.row = rowindex;
      squareElement.dataset.col = squareindex;

      // If there's a piece on the square, create a piece element
      if (square) {
        const pieceElement = document.createElement("div");

        // Add class for the piece's color (white or black)
        pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");

        // Set the Unicode character for the piece
        pieceElement.innerText = getPieceUnicode(square);

        // Make the piece draggable if it belongs to the player
        pieceElement.draggable = playerRole === square.color;

        // Add event listener for when dragging starts
        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            // Set the dragged piece and source square
            draggedPiece = pieceElement;
            sourceSquare = { row: rowindex, col: squareindex };

            // Necessary for drag-and-drop functionality
            e.dataTransfer.setData("text/plain", "");
          }
        });

        // Add event listener for when dragging ends
        pieceElement.addEventListener('dragend', () => {
          // Reset the dragged piece and source square
          draggedPiece = null;
          sourceSquare = null;
        });

        // Append the piece to the square element
        squareElement.appendChild(pieceElement);
      }

      // Add event listener to allow dropping on the square
      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      // Add event listener to handle the drop event
      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          // Determine the target square
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };

          // Handle the move
          handleMove(sourceSquare, targetSquare);
        }
      });

      // Append the square element to the board element
      boardElement.appendChild(squareElement);
    });
  });

  // Flip the board if the player is black
  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

// Function to handle a move from the source square to the target square
const handleMove = (source, target) => {
  // Convert the source and target squares to chess notation
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q", // Always promote to queen for simplicity
  };

  // Emit the move to the server
  socket.emit("move", move);
};

// Function to get the Unicode character for a piece
const getPieceUnicode = (piece) => {
  // Mapping of piece types to their Unicode characters
  const unicodePieces = {
    p: "♙", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
    P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
  };

  // Return the Unicode character for the piece type, or an empty string if not found
  return unicodePieces[piece.type] || "";
};

// Socket event listener for setting the player's role
socket.on("playerRole", function (role) {
  playerRole = role; // Update the player role
  renderBoard(); // Re-render the board
});

// Socket event listener for setting the spectator role
socket.on("spectatorRole", function () {
  playerRole = null; // Set player role to null for spectators
  renderBoard(); // Re-render the board
});

// Socket event listener for updating the board state
socket.on("boardState", function (fen) {
  chess.load(fen); // Load the new board state from the FEN string
  renderBoard(); // Re-render the board
});

// Socket event listener for processing a move
socket.on("move", function (move) {
  chess.move(move); // Update the game state with the new move
  renderBoard(); // Re-render the board
});

// Initial render of the chessboard
renderBoard();
