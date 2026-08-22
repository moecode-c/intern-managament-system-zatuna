import ModulePlaceholder from '../components/ModulePlaceholder.jsx';

// TASK MODULE - assignment and review.
export default function Tasks() {
  return (
    <ModulePlaceholder
      title="Tasks"
      ticket="TASK-LIST"
      todos={[
        'Intern view: my tasks by status, submit a link for review',
        'Mentor view: assign a task, review submissions, approve or reject',
        'Overdue tasks highlighted against dueDate',
      ]}
    />
  );
}
