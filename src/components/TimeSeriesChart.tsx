import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Tooltip,
  type ChartData,
  type ChartOptions
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, TimeScale, Tooltip, Legend, zoomPlugin);

type Props = {
  title: string;
  data: ChartData<'line', Array<{ x: string; y: number | null }>>;
  options?: ChartOptions<'line'>;
  compact?: boolean;
};

export function TimeSeriesChart({ title, data, options, compact = false }: Props) {
  const mergedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: false },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'line',
          boxWidth: 28,
          boxHeight: 4,
          padding: 16
        }
      },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x'
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: { tooltipFormat: 'PPpp' }
      },
      y: {
        beginAtZero: false
      }
    },
    ...options
  } as ChartOptions<'line'>;

  return (
    <section className={`panel chart-panel${compact ? ' chart-panel-compact' : ''}`}>
      <div className="panel-header">
        <h3>{title}</h3>
      </div>
      <div className="chart-wrap">
        <Line data={data} options={mergedOptions} />
      </div>
    </section>
  );
}