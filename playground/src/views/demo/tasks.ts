export interface Task {
  id: number
  title: string
  deadline: string
  description: string
  /** Ids of related tasks, linked from the task detail view. */
  related: number[]
}

export const tasks: Task[] = [
  {
    id: 1,
    title: 'Stoner',
    deadline: '2026-06-15',
    description: 'Stoner is a 1965 novel by the American writer John Williams.',
    related: [2, 3],
  },
  {
    id: 2,
    title: "Butcher's Crossing",
    deadline: '2026-06-22',
    description:
      "Butcher's Crossing is a 1960 novel by John Williams about a buffalo hunt in the 1870s American West.",
    related: [1, 4],
  },
  {
    id: 3,
    title: 'Augustus',
    deadline: '2026-07-01',
    description:
      'Augustus is a 1972 epistolary novel by John Williams about the first Roman emperor. It shared the National Book Award for Fiction in 1973.',
    related: [1, 4],
  },
  {
    id: 4,
    title: 'Nothing but the Night',
    deadline: '2026-07-10',
    description: "Nothing but the Night is John Williams's 1948 debut novel.",
    related: [2, 3],
  },
]
