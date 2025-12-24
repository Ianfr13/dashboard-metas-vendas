import { useEffect } from "react";
import confetti from "canvas-confetti";

interface GoalCelebrationProps {
  show: boolean;
}

export default function GoalCelebration({ show }: GoalCelebrationProps) {
  useEffect(() => {
    if (!show) return;

    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fogos da esquerda
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });

      // Fogos da direita
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9998] pointer-events-none">
      <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white px-12 py-8 rounded-2xl shadow-2xl animate-bounce">
        <h1 className="text-6xl font-bold tracking-tight drop-shadow-lg">
          🎉 META BATIDA! 🎉
        </h1>
      </div>
    </div>
  );
}
