import ModulePlaceholder from '../components/ModulePlaceholder.jsx';

// ACTIVITY MODULE - daily logs and attendance.
export default function Activities() {
  return (
    <ModulePlaceholder
      title="Activities"
      ticket="ACT-LIST"
      todos={[
        'Daily log form: hours, summary, blockers',
        'Timeline of past logs with a date-range filter',
        'Mentor view: which interns have not logged this week',
      ]}
    />
  );
}
