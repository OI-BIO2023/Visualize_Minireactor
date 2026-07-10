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
import { format } from 'date-fns';
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

const isMidnight = (value: string | number) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getHours() === 0;
};

const defaultXAxis: any = {
  x: {
    type: 'time',
    title: {
      display: true,
      text: 'Datum / Uhrzeit'
    },
    time: {
      unit: 'hour',
      tooltipFormat: 'dd.MM.yyyy HH:mm',
      displayFormats: {
        hour: 'HH'
      }
    },
    ticks: {
      autoSkip: false,
      maxRotation: 0,
      minRotation: 0,
      callback(value: string | number) {
        const date = new Date(String(value));
        if (Number.isNaN(date.getTime())) return '';
        const hour = date.getHours();
        if (hour === 0) return [format(date, 'dd.MM.yyyy'), '00 Uhr'];
        if (hour % 6 === 0) return `${hour.toString().padStart(2, '0')} Uhr`;
        return '';
      }
    },
    grid: {
      color(context: any) {
        const value = context.tick?.value;
        return isMidnight(String(value)) ? 'rgba(148, 163, 184, 0.45)' : 'rgba(148, 163, 184, 0.12)';
      },
      lineWidth(context: any) {
        const value = context.tick?.value;
        return isMidnight(String(value)) ? 1.6 : 0.7;
      }
    }
  },
  y: {
    beginAtZero: false
  }
} as any;

export function TimeSeriesChart({ title, data, options, compact = false }: Props) {
  const mergedScales = {
    ...defaultXAxis,
    ...options?.scales,
    x: {
      ...defaultXAxis.x,
      ...options?.scales?.x,
      time: {
        ...(defaultXAxis.x?.time ?? {}),
        ...(options?.scales?.x as any)?.time
      },
      ticks: {
        ...(defaultXAxis.x?.ticks ?? {}),
        ...(options?.scales?.x as any)?.ticks
      },
      grid: {
        ...(defaultXAxis.x?.grid ?? {}),
        ...(options?.scales?.x as any)?.grid
      },
      title: {
        ...(defaultXAxis.x?.title ?? {}),
        ...(options?.scales?.x as any)?.title
      }
    },
    y: {
      ...defaultXAxis.y,
      ...(options?.scales?.y as any)
    }
  } as ChartOptions<'line'>['scales'];

  const mergedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: false },
    ...(options ?? {}),
    plugins: {
      ...options?.plugins,
      legend: {
        ...options?.plugins?.legend,
        position: 'bottom',
        labels: {
          ...options?.plugins?.legend?.labels,
          usePointStyle: true,
          pointStyle: 'line',
          boxWidth: 28,
          boxHeight: 4,
          padding: 16
        }
      },
      zoom: {
        ...options?.plugins?.zoom,
        pan: { enabled: true, mode: 'x' },
        zoom: {
          ...options?.plugins?.zoom?.zoom,
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x'
        }
      }
    },
    scales: mergedScales
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
