import ModulePlaceholder from '../components/ModulePlaceholder.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// DASHBOARD MODULE - one page, three role-specific views.
export default function Dashboard() {
  const { user } = useAuth();

  return (
    <ModulePlaceholder
      title={`Dashboard (${user?.role})`}
      ticket="DASH-ADMIN"
      todos={[
        'Call GET /api/dashboard/{admin|mentor|intern} based on the logged-in role',
        'Admin: application funnel, cohort counts, activity in the last 7 days',
        'Mentor: my interns, their open tasks, missing check-ins',
        'Intern: my open tasks, hours logged this week, onboarding progress',
        'Charts - agree on one library with the squad before adding a dependency',
      ]}
    />
  );
}
