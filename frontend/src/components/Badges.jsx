const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

const CATEGORY_LABELS = {
  theft: 'Theft',
  harassment: 'Harassment',
  missing_person: 'Missing Person',
  traffic_incident: 'Traffic',
  noise_disturbance: 'Noise/Disturb.',
  cyber_crime: 'Cyber Crime',
  other: 'Other',
};

const CATEGORY_ICONS = {
  theft: '🔓',
  harassment: '⚠️',
  missing_person: '🔍',
  traffic_incident: '🚗',
  noise_disturbance: '📢',
  cyber_crime: '💻',
  other: '📋',
};

export function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function CategoryBadge({ category }) {
  return (
    <span className="category-badge">
      {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category] || category}
    </span>
  );
}

export { STATUS_LABELS, CATEGORY_LABELS };
