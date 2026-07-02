export const money = (value = 0) => `MNT ${Number(value || 0).toLocaleString('en-US')}`

export const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})
