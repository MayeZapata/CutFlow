import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface BenchmarkChartProps {
  logN: number;
  quad: number;
}

export default function BenchmarkChart({ logN, quad }: BenchmarkChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['O(n log n)', 'O(n²)'],
        datasets: [
          {
            label: 'Tiempo de ejecución (ms)',
            data: [logN, quad],
            backgroundColor: ['rgba(74, 222, 128, 0.75)', 'rgba(248, 113, 113, 0.75)'],
            borderColor: ['#4ade80', '#f87171'],
            borderWidth: 1.5,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => ` ${item.parsed.y} ms`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#f4ece0', font: { family: 'Outfit, sans-serif', weight: 'bold' } },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#a99d8c' },
            grid: { color: 'rgba(46, 40, 32, 0.6)' },
          },
        },
      },
    });

    return () => {
      chart.destroy();
    };
  }, [logN, quad]);

  return (
    <div className="relative w-full h-full min-h-[200px] max-h-[280px]">
      <canvas ref={canvasRef} />
    </div>
  );
}
