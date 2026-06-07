export interface PeekTask {
  id: number
  title: string
  deadline: string
  description: string
}

export const peekTasks: PeekTask[] = [
  {
    id: 1,
    title: 'Stoner',
    deadline: '2026-06-15',
    description: 'Stoner is a 1965 novel by the American writer John Williams.',
  },
  {
    id: 2,
    title: "Butcher's Crossing",
    deadline: '2026-06-22',
    description:
      "Butcher's Crossing is a 1960 novel by John Williams about a buffalo hunt in the 1870s American West.",
  },
  {
    id: 3,
    title: 'Augustus',
    deadline: '2026-07-01',
    description:
      'Augustus is a 1972 epistolary novel by John Williams about the first Roman emperor. It shared the National Book Award for Fiction in 1973.',
  },
  {
    id: 4,
    title: 'Nothing but the Night',
    deadline: '2026-07-10',
    description: "Nothing but the Night is John Williams's 1948 debut novel.",
  },
]
