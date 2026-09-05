import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";

// INTERN RECORDS MODULE.

function getUniqueCohorts(interns) {
  return Array.from(new Set(interns.map((intern) => intern.cohort)));
}

function getUniqueMentors(interns) {
  const mentorsMap = new Map();

  interns.forEach((intern) => {
    const mentor = intern.mentor;

    if (mentor) {
      mentorsMap.set(mentor._id, mentor);
    }
  });

  return Array.from(mentorsMap.values());
}

function filterInterns(interns, statusFilter, cohortFilter, mentorFilter) {
  return interns.filter((intern) => {
    const matchesStatus =
      statusFilter === "all" || intern.status === statusFilter;

    const matchesCohort =
      cohortFilter === "all" || intern.cohort === cohortFilter;

    const matchesMentor =
      mentorFilter === "all" || intern.mentor?._id === mentorFilter;

    return matchesStatus && matchesCohort && matchesMentor;
  });
}

function groupInternsByCohort(interns) {
  const grouped = {};

  interns.forEach((intern) => {
    const cohort = intern.cohort;

    if (Object.hasOwn(grouped, cohort)) {
      grouped[cohort].push(intern);
    } else {
      grouped[cohort] = [intern];
    }
  });

  return grouped;
}

export function formatTrack(track) {
  return track.charAt(0).toUpperCase() + track.slice(1);
}

export default function Interns() {
  const navigate = useNavigate();

  // Data
  const [interns, setInterns] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [cohortFilter, setCohortFilter] = useState("all");
  const [mentorFilter, setMentorFilter] = useState("all");

  // Request state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch interns
  useEffect(() => {
    api
      .get("/interns")
      .then((res) => {
        setInterns(res.data.data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Derived data
  const cohorts = getUniqueCohorts(interns);
  const mentors = getUniqueMentors(interns);

  const filteredInterns = filterInterns(
    interns,
    statusFilter,
    cohortFilter,
    mentorFilter,
  );

  const groupedInterns = groupInternsByCohort(filteredInterns);

  return (
    <>
      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      ) : error ? (
        <h3 className="message">Failed to load interns</h3>
      ) : interns.length === 0 ? (
        <h3 className="message">No interns found</h3>
      ) : (
        <>
          <div className="filters">
            {/* Status */}
            <label className="filter-group">
              <span>Status</span>

              <select
                className="status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="onboarding">Onboarding</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="dropped">Dropped</option>
              </select>
            </label>

            {/* Cohort */}
            <label className="filter-group">
              <span>Cohort</span>

              <select
                className="status-filter"
                value={cohortFilter}
                onChange={(event) => setCohortFilter(event.target.value)}
              >
                <option value="all">All cohorts</option>

                {cohorts.map((cohort) => (
                  <option value={cohort} key={cohort}>
                    {cohort}
                  </option>
                ))}
              </select>
            </label>

            {/* Mentor */}
            <label className="filter-group">
              <span>Mentor</span>

              <select
                className="status-filter"
                value={mentorFilter}
                onChange={(event) => setMentorFilter(event.target.value)}
              >
                <option value="all">All mentors</option>

                {mentors.map((mentor) => (
                  <option value={mentor._id} key={mentor._id}>
                    {mentor.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Filtered results */}
          {filteredInterns.length === 0 ? (
            <h3 className="message">No interns match the selected filters</h3>
          ) : (
            Object.entries(groupedInterns).map(([cohort, cohortInterns]) => (
              <section className="cohort-section" key={cohort}>
                <h2>{cohort}</h2>

                <div className="table-wrapper">
                  <table className="interns-table">
                    <thead>
                      <tr>
                        <th>Intern</th>
                        <th>Email</th>
                        <th>Track</th>
                        <th>Mentor</th>
                        <th>Status</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {cohortInterns.map((intern) => (
                        <tr
                          key={intern._id}
                          onClick={() => navigate(`/interns/${intern._id}`)}
                        >
                          <td>{intern.user.name}</td>

                          <td>{intern.user.email}</td>

                          <td>{formatTrack(intern.track)}</td>

                          <td>{intern.mentor?.name || "Not assigned"}</td>

                          <td>
                            <span className={`badge ${intern.status}`}>
                              {intern.status}
                            </span>
                          </td>

                          <td>
                            {new Date(intern.startDate).toLocaleDateString()}
                          </td>

                          <td>
                            {intern.endDate
                              ? new Date(intern.endDate).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))
          )}
        </>
      )}
    </>
  );
}
