"use client";

import { useRef, useState, useEffect } from "react";

import { Grid } from "@/interfaces/cez/grid";
import { Move } from "@/interfaces/cez/move";
import { Tile } from "@/interfaces/cez/tile";
import { drawCezBoard, drawLegalMoves, mouseToTile } from "@/services/cez_board";
import { ApiService } from "@/services/api";

interface Props {
  is_player_white: boolean;
  board_size?: number;
}

interface GameStats {
  isGameOver: boolean;
  winnerSide: "white" | "black" | "draw" | "none";
  isWhitesTurn: boolean;
  moveHistory: Move[];
}

const moveToNotation = (move: Move): string => {
  const from = String.fromCharCode(97 + move.from.x) + (8 - move.from.y);
  const to = String.fromCharCode(97 + move.to.x) + (8 - move.to.y);
  const move_type = (move.capture == null) ? '>' : 'x';
  if (move.to.x == move.from.x) {
    return `${from}${move_type}${8 - move.to.y}`
  }
  else if (move.to.y == move.from.y) {
    return `${from}${move_type}${String.fromCharCode(97 + move.to.x)}`
  } else {
    return '<invalid>'
  }
}

export const CezBoardAI: React.FC<Props> = ({ is_player_white, board_size = 720 }) => {
  // canvas variabels
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<Grid>(new Grid());
  let selectedPiece: Tile | null = null;
  const tile_size = board_size / 8;

  const [gameStats, setGameStats] = useState<GameStats>({
    isGameOver: false,
    winnerSide: 'none',
    isWhitesTurn: true,
    moveHistory: [],
  });
  const [difficulty, setDifficulty] = useState<number>(1);

  const restartGame = () => {
    setGrid(new Grid());
    setGameStats({
      isGameOver: false,
      winnerSide: 'none',
      isWhitesTurn: true,
      moveHistory: [],
    });
  }

  const drawBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    drawCezBoard(ctx, grid, board_size, tile_size);
    drawLegalMoves(ctx, grid, selectedPiece, tile_size);
  }

  const requestAIMove = async () => {
    if (gameStats.isGameOver || grid.isGameOver) return;
    try {
      const fen = grid.getFEN();
      const data = await ApiService.getCezAIMove(fen, difficulty);
      const from = { x: data.from_.column, y: data.from_.row };
      const to = { x: data.to.column, y: data.to.row };
      const capture = data.capture ? { x: data.capture.column, y: data.capture.row } : null;
      const move = { from, to, capture };
      handlePieceMove(move);
    }
    catch (error) {
      console.error("Error requesting AI move.");
    }

  }

  useEffect(() => {
    drawBoard();
    if (!is_player_white) {
      requestAIMove();
    }
  });

  const handlePieceMove = (move: Move) => {
    grid.movePiece(move);
    selectedPiece = null;
    if (grid.isGameOver) {
      setGameStats({
        isGameOver: true,
        winnerSide: grid.winnerSide,
        isWhitesTurn: grid.isWhitesTurn,
        moveHistory: grid.moveHistory,
      });
    }
    else {
      setGameStats({
        isGameOver: false,
        winnerSide: 'none',
        isWhitesTurn: grid.isWhitesTurn,
        moveHistory: grid.moveHistory,
      });
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (is_player_white && !grid.isWhitesTurn && grid.isGameOver) return;
    // get the square/tile the mouse is in
    const { x, y } = mouseToTile(e.nativeEvent.offsetX, e.nativeEvent.offsetY, tile_size);
    const hitTile = grid.grid[x][y];
    if (selectedPiece) {
      const move = grid.legalMoves.find((move: Move) => selectedPiece !== null && move.to.x === x && move.to.y === y && move.from.x === selectedPiece.x && move.from.y === selectedPiece.y);
      if (move) {
        handlePieceMove(move);
        requestAIMove();
      }
      else {
        selectedPiece = null;
      }
    }
    else {
      if (hitTile !== '') {
        if (grid.isWhitesTurn === (hitTile === hitTile.toUpperCase())) {
          selectedPiece = { x, y };
        }
      }
      else {
        selectedPiece = null;
      }
    }
    drawBoard();
  }

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center gap-4">
      {/* Game Visuals/Canvas */}
      <canvas 
        id="cez-board"
        width={board_size}
        height={board_size}
        ref={canvasRef}
        onMouseDown={handleMouseDown}
      />
      {/* Game Controls */}
      <div className="flex flex-col w-full h-auto lg:w-[24rem] lg:h-full items-start justify-start gap-4">
        {!gameStats.isGameOver ?
          <div className="w-full flex flex-col gap-y-2 items-start">
            {/* AI Min-Max Algorihm Difficulty */}
            <button className="w-24 text-zinc-300 px-4 py-2 border-2 border-zinc-700 rounded-xl hover:border-zinc-800 hover:text-zinc-400"
              onClick={() => setDifficulty(1)}
              style={{ borderColor: difficulty === 1 ? '#ffffff' : '#555' }}
            >
              Easy
            </button>
            <button className="w-24 text-zinc-300 px-4 py-2 border-2 border-zinc-700 rounded-xl hover:border-zinc-800 hover:text-zinc-400"
              onClick={() => setDifficulty(2)}
              style={{ borderColor: difficulty === 2 ? '#ffffff' : '#555' }}
            >
              Medium
            </button>
            <button className="w-24 text-zinc-300 px-4 py-2 border-2 border-zinc-700 rounded-xl hover:border-zinc-800 hover:text-zinc-400"
              onClick={() => setDifficulty(3)}
              style={{ borderColor: difficulty === 3 ? '#ffffff' : '#555' }}
            >
              Hard
            </button>
          </div>
          :
          <div className="w-full flex flex-col gap-y-2 items-start">
            {/* Restart Game */}
            <button className="w-24 text-zinc-300 px-4 py-2 border-2 border-zinc-700 rounded-xl hover:border-zinc-800 hover:text-zinc-400"
              onClick={restartGame}
            >
              Restart
            </button>
          </div>
        }
        {!gameStats.isGameOver &&
          <>
            <p className="text-start font-medium text-zinc-300">
              {`Turn: ${grid.isWhitesTurn ? 'White' : 'Black'}`}
            </p>
          </>
        }
        {gameStats.isGameOver && 
          <>
            <p className="text-start font-medium text-zinc-300">
              {`Game Over. Winner: ${gameStats.winnerSide}`}
            </p>
          </>
        }
        {/* Move History */}
        <div className="grid grid-cols-2 w-full lg:w-auto h-auto lg:h-[24rem] items-start justify-start gap-2 overflow-y-auto">
          {/* White moves */}
          <div className="flex flex-col items-start justify-start gap-2">
            <p className="text-start font-medium text-zinc-300">White Moves</p>
            {gameStats.moveHistory.map((move: Move, index: number) => {
              if (index % 2 === 0) {
                return (
                  <p className="text-start font-light text-zinc-300" key={index}>
                    {`${index / 2 + 1}. ${moveToNotation(move)}`}
                  </p>
                );
              }
              return null;
            })}
          </div>
            {/* Black moves */}
          <div className="flex flex-col items-start justify-start gap-2">
            <p className="text-start font-medium text-zinc-300">Black Moves</p>
            {gameStats.moveHistory.map((move: Move, index: number) => {
              if (index % 2 === 1) {
                return (
                  <p className="text-start font-light text-zinc-300" key={index}>
                    {`${moveToNotation(move)}`}
                  </p>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

