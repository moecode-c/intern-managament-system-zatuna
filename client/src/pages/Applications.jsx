import ModulePlaceholder from '../components/ModulePlaceholder.jsx';

// ATS MODULE - staff-facing applicant pipeline.
export default function Applications() {
  return (
    <ModulePlaceholder
      title="Applications"
      ticket="ATS-BOARD"
      todos={[
        'Fetch GET /api/applications - it is already implemented, use it as your example',
        'Table view with stage / track filters and a search box',
        'Kanban view: drag a card to call PATCH /api/applications/:id/stage',
        'Detail drawer with reviewer notes and a 1-5 score form',
      ]}
    />
  );
}
