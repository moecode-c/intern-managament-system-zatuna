import ModulePlaceholder from '../components/ModulePlaceholder.jsx';

// INTERN RECORDS MODULE.
export default function Interns() {
  return (
    <ModulePlaceholder
      title="Interns"
      ticket="INTERN-LIST"
      todos={[
        'List interns grouped by cohort with status badges',
        'Profile page: mentor, track, dates, onboarding checklist',
        'Tick checklist items via PATCH /api/interns/:id/checklist/:itemId',
        'Admin action: convert an accepted applicant into an intern',
      ]}
    />
  );
}
