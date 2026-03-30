function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

export function toIsoDateTime(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value.includes('T')) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  const normalized = value.replace(' ', 'T');
  const parsed = new Date(`${normalized}Z`);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return `${value.split(' ')[0]}T00:00:00.000Z`;
}
