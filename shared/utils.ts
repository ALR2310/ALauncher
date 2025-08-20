export function uniqueId() {
  const timestamp = Date.now().toString(16);
  const randomPart = Math.random().toString(16).slice(2, 16);
  return (timestamp + randomPart).slice(0, 24);
}

export function formatToSlug(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
