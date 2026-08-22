import ModulePlaceholder from '../components/ModulePlaceholder.jsx';

// INTAKE MODULE - public application form.
export default function Apply() {
  return (
    <ModulePlaceholder
      title="Apply for an internship"
      ticket="APPLY-FORM"
      todos={[
        'Build the multi-step form: personal details, education, track, CV upload',
        'Validate on the client before POST /api/applications (multipart/form-data)',
        'Show the returned status link so the applicant can check progress later',
        'Handle the 5MB / PDF-or-Word limit the API enforces on the CV field',
      ]}
    />
  );
}
