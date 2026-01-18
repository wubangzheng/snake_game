
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Difficulty, Direction, Point, GameSettings } from './types';
import { GRID_SIZE, OBSTACLES, BASE_SPEEDS } from './constants';
import { getGameFeedback } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [settings, setSettings] = useState<GameSettings>({
    difficulty: Difficulty.EASY,
    initialSpeed: 3
  });
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(Direction.RIGHT);
  const [currentInterval, setCurrentInterval] = useState<number>(200);
  const [feedback, setFeedback] = useState<string>("");
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  // UseRef for direction to handle rapid key presses
  const directionRef = useRef<Direction>(Direction.RIGHT);
  const gameLoopRef = useRef<number | null>(null);

  const generateFood = useCallback((currentSnake: Point[], obstacles: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const onSnake = currentSnake.some(p => p.x === newFood.x && p.y === newFood.y);
      const onObstacle = obstacles.some(p => p.x === newFood.x && p.y === newFood.y);
      if (!onSnake && !onObstacle) break;
    }
    return newFood;
  }, []);

  const startGame = () => {
    const startX = 5;
    const startY = 10;
    const initialSnake = [{ x: startX, y: startY }, { x: startX - 1, y: startY }];
    const obstacles = OBSTACLES[settings.difficulty];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake, obstacles));
    setDirection(Direction.RIGHT);
    directionRef.current = Direction.RIGHT;
    setScore(0);
    const initialInterval = BASE_SPEEDS[settings.initialSpeed - 1];
    setCurrentInterval(initialInterval);
    setGameState(GameState.PLAYING);
    setFeedback("");
  };

  const gameOver = async (finalScore: number) => {
    setGameState(GameState.GAME_OVER);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    
    setIsLoadingFeedback(true);
    const msg = await getGameFeedback(finalScore, settings.difficulty);
    setFeedback(msg);
    setIsLoadingFeedback(false);
  };

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (directionRef.current) {
        case Direction.UP: newHead.y -= 1; break;
        case Direction.DOWN: newHead.y += 1; break;
        case Direction.LEFT: newHead.x -= 1; break;
        case Direction.RIGHT: newHead.x += 1; break;
      }

      // Check collisions
      const obstacles = OBSTACLES[settings.difficulty];
      const hitWall = newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE;
      const hitSelf = prevSnake.some(p => p.x === newHead.x && p.y === newHead.y);
      const hitObstacle = obstacles.some(p => p.x === newHead.x && p.y === newHead.y);

      if (hitWall || hitSelf || hitObstacle) {
        gameOver(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Eat food
      if (newHead.x === food.x && newHead.y === food.y) {
        const newScore = score + 1;
        setScore(newScore);
        setFood(generateFood(newSnake, obstacles));

        // Speed logic: Every 20 points, speed increases by 4 (meaning interval decreases)
        // Let's interpret "increase by 4" as a 4*4=16ms reduction or similar.
        // The prompt says "速度提升4", in snake games this usually means a significant bump.
        if (newScore > 0 && newScore % 20 === 0) {
          setCurrentInterval(prev => Math.max(40, prev - 20)); // -20ms every 20 points
        }
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, score, settings.difficulty, generateFood]);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      gameLoopRef.current = window.setInterval(moveSnake, currentInterval);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, currentInterval, moveSnake]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== GameState.PLAYING) return;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (directionRef.current !== Direction.DOWN) directionRef.current = Direction.UP;
          break;
        case 'ArrowDown':
        case 's':
          if (directionRef.current !== Direction.UP) directionRef.current = Direction.DOWN;
          break;
        case 'ArrowLeft':
        case 'a':
          if (directionRef.current !== Direction.RIGHT) directionRef.current = Direction.LEFT;
          break;
        case 'ArrowRight':
        case 'd':
          if (directionRef.current !== Direction.LEFT) directionRef.current = Direction.RIGHT;
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-white selection:bg-cyan-500">
      {gameState === GameState.MENU && (
        <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl animate-in fade-in zoom-in duration-300">
          <h1 className="text-4xl font-orbitron font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            NEON SNAKE
          </h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-3 text-slate-400">选择难度 (Difficulty)</label>
              <div className="grid grid-cols-3 gap-2">
                {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSettings(s => ({ ...s, difficulty: d }))}
                    className={`py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 ${
                      settings.difficulty === d 
                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {d === Difficulty.EASY ? '初级' : d === Difficulty.MEDIUM ? '中级' : '高级'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3 text-slate-400">初始速度 (Speed: 1-5)</label>
              <div className="flex justify-between items-center gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    onClick={() => setSettings(s => ({ ...s, initialSpeed: v }))}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      settings.initialSpeed === v 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-110 ring-2 ring-blue-400' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={startGame}
              className="w-full py-4 mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-orbitron font-bold text-lg hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-95 shadow-xl shadow-cyan-500/20"
            >
              开始游戏
            </button>
          </div>
        </div>
      )}

      {gameState === GameState.PLAYING && (
        <div className="flex flex-col items-center animate-in fade-in duration-500">
          <div className="flex justify-between w-full max-w-[500px] mb-4 px-2">
            <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Score</span>
              <span className="text-2xl font-orbitron text-cyan-400">{score}</span>
            </div>
            <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Speed Level</span>
              <span className="text-2xl font-orbitron text-blue-400">{(BASE_SPEEDS[settings.initialSpeed-1] - currentInterval) / 20 + settings.initialSpeed}</span>
            </div>
          </div>

          <div 
            className="relative bg-slate-900 rounded-lg border-4 border-slate-800 shadow-2xl overflow-hidden"
            style={{ width: GRID_SIZE * 20, height: GRID_SIZE * 20 }}
          >
            {/* Obstacles */}
            {OBSTACLES[settings.difficulty].map((obs, i) => (
              <div 
                key={`obs-${i}`}
                className="absolute bg-slate-700 rounded-sm"
                style={{ 
                  left: obs.x * 20, 
                  top: obs.y * 20, 
                  width: 20, 
                  height: 20 
                }}
              />
            ))}

            {/* Food */}
            <div 
              className="absolute bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse"
              style={{ 
                left: food.x * 20 + 2, 
                top: food.y * 20 + 2, 
                width: 16, 
                height: 16 
              }}
            />

            {/* Snake */}
            {snake.map((segment, i) => (
              <div 
                key={`snake-${i}`}
                className={`absolute rounded-sm transition-all duration-150 ${i === 0 ? 'bg-cyan-400 z-10' : 'bg-cyan-600/80'}`}
                style={{ 
                  left: segment.x * 20 + 1, 
                  top: segment.y * 20 + 1, 
                  width: 18, 
                  height: 18,
                  boxShadow: i === 0 ? '0 0 15px rgba(34,211,238,0.6)' : 'none'
                }}
              />
            ))}
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2 md:hidden">
            <div />
            <button onClick={() => { if(directionRef.current !== Direction.DOWN) directionRef.current = Direction.UP }} className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-2xl">↑</button>
            <div />
            <button onClick={() => { if(directionRef.current !== Direction.RIGHT) directionRef.current = Direction.LEFT }} className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-2xl">←</button>
            <button onClick={() => { if(directionRef.current !== Direction.UP) directionRef.current = Direction.DOWN }} className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-2xl">↓</button>
            <button onClick={() => { if(directionRef.current !== Direction.LEFT) directionRef.current = Direction.RIGHT }} className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-2xl">→</button>
          </div>
          <p className="mt-4 text-slate-500 text-sm hidden md:block">Use Arrow Keys or WASD to move</p>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border-2 border-rose-500/30 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 flex flex-col items-center">
          <h2 className="text-4xl font-orbitron font-bold text-rose-500 mb-2">GAME OVER</h2>
          <p className="text-slate-400 mb-6">最终得分: {score}</p>

          <div className="w-full bg-slate-800/50 p-4 rounded-2xl mb-8 min-h-[80px] flex items-center justify-center italic text-center text-cyan-200">
            {isLoadingFeedback ? (
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            ) : (
              `“${feedback}”`
            )}
          </div>

          <div className="flex flex-col w-full gap-3">
            <button 
              onClick={startGame}
              className="w-full py-4 bg-cyan-600 rounded-2xl font-bold hover:bg-cyan-500 transition-all shadow-lg"
            >
              重新开始
            </button>
            <button 
              onClick={() => setGameState(GameState.MENU)}
              className="w-full py-4 bg-slate-800 rounded-2xl font-bold hover:bg-slate-700 transition-all"
            >
              返回主菜单
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
