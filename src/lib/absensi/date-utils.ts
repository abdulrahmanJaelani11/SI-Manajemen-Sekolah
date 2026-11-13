export function getWibNow(): {
  dateStr: string
  timeStr: string
  minutesOfDay: number
} {
  const now = new Date()
  // Format in Asia/Jakarta timezone
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)

  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00'
  const year = getPart('year')
  const month = getPart('month')
  const day = getPart('day')
  let hour = getPart('hour')
  if (hour === '24') hour = '00'
  const minute = getPart('minute')

  const dateStr = `${year}-${month}-${day}`
  const timeStr = `${hour}:${minute}`
  const minutesOfDay = parseInt(hour, 10) * 60 + parseInt(minute, 10)

  return { dateStr, timeStr, minutesOfDay }
}

export function toDbDate(dateStr?: string | null): Date {
  const target = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : getWibNow().dateStr
  return new Date(`${target}T00:00:00.000Z`)
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = String(hhmm || '07:00').split(':').map((x) => parseInt(x, 10) || 0)
  return h * 60 + m
}

