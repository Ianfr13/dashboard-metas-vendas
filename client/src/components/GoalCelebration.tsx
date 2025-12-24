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
      <div className="fixed top-20 left-0 right-0 z-[9999] pointer-events-none flex justify-center px-4">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-full shadow-lg border border-white/20 animate-bounce">
          <p className="text-sm md:text-base font-bold flex items-center gap-2">
            <span>🎉</span>
            <span>META BATIDA!</span>
            <span>🎉</span>
          </p>
        </div>
      </div>
    </>
  );
}
