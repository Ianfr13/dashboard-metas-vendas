import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface GoalCelebrationProps {
  show: boolean;
}

export default function GoalCelebration({ show }: GoalCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!show || !canvasRef.current) return;

    const myConfetti = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true,
    });

    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fogos da esquerda
      myConfetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });

      // Fogos da direita
      myConfetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => {
      clearInterval(interval);
      myConfetti.reset();
    };
  }, [show]);

  if (!show) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full z-[9998] pointer-events-none"
      />
      <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none px-4">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 blur-2xl opacity-60 animate-pulse" />
          
          {/* Banner principal */}
          <div className="relative bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 text-white px-6 py-4 md:px-16 md:py-10 rounded-3xl shadow-2xl border-4 border-white/30">
            <div className="flex flex-col items-center gap-2 md:gap-4">
              <div className="text-4xl md:text-6xl animate-bounce">
                🎉
              </div>
              <h1 className="text-3xl md:text-7xl font-black tracking-tight text-center leading-tight">
                META BATIDA!
              </h1>
              <div className="text-4xl md:text-6xl animate-bounce">
                🎉
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
