export const CATEGORIES = ['Software', 'Hardware', 'Network', 'Other'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const STATUSES = ['Open', 'In Progress', 'Resolved'];

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function roleLabel(role) {
  return role === 'it_officer' ? 'IT Officer' : 'Staff';
}

export function statusClass(status) {
  if (status === 'Open') return 'badge badge-open';
  if (status === 'In Progress') return 'badge badge-progress';
  if (status === 'Resolved') return 'badge badge-resolved';
  return 'badge';
}

export function priorityClass(priority) {
  if (priority === 'Critical') return 'badge badge-critical';
  if (priority === 'High') return 'badge badge-high';
  if (priority === 'Medium') return 'badge badge-medium';
  return 'badge badge-low';
}

export function nextStatuses(current) {
  if (current === 'Open') return ['In Progress'];
  if (current === 'In Progress') return ['Resolved'];
  return [];
}
