import {
  DateTimePickerAndroid,
  type AndroidNativeProps,
} from '@react-native-community/datetimepicker';

export function pickDateTime(current: number): Promise<number | null> {
  return new Promise<number | null>((resolve) => {
    const openTime = (date: Date) => {
      const props: AndroidNativeProps = {
        value: date,
        mode: 'time',
        is24Hour: true,
        onChange: (ev, picked) => {
          if (ev.type !== 'set' || !picked) {
            resolve(null);
            return;
          }
          resolve(picked.getTime());
        },
      };
      DateTimePickerAndroid.open(props);
    };

    const openDate: AndroidNativeProps = {
      value: new Date(current),
      mode: 'date',
      onChange: (ev, picked) => {
        if (ev.type !== 'set' || !picked) {
          resolve(null);
          return;
        }
        openTime(picked);
      },
    };
    DateTimePickerAndroid.open(openDate);
  });
}

export function formatDateTime(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function pickDate(current: number): Promise<number | null> {
  return new Promise<number | null>((resolve) => {
    DateTimePickerAndroid.open({
      value: new Date(current),
      mode: 'date',
      onChange: (ev, picked) => {
        if (ev.type !== 'set' || !picked) {
          resolve(null);
          return;
        }
        const d = new Date(picked);
        d.setHours(12, 0, 0, 0);
        resolve(d.getTime());
      },
    });
  });
}

export function startOfMonth(ms: number): number {
  const d = new Date(ms);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function formatMonthHeader(monthMs: number): string {
  return new Date(monthMs).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });
}

export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function formatDayHeader(dayMs: number): string {
  const d = new Date(dayMs);
  const today = startOfDay(Date.now());
  const yesterday = today - 86_400_000;
  if (dayMs === today) return 'Today';
  if (dayMs === yesterday) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
