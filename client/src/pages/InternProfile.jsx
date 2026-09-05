import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"
import api from "../api/client";
import formatTrack from "./Interns.jsx";

export default function InternProfile() {

    const { id } = useParams();
    const [intern, setIntern] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [checklistError, setChecklistError] = useState(false);
    const [updatingItemId, setUpdatingItemId] = useState(null);
    const checklist = intern?.onboardingChecklist ?? [];

    const completedCount = checklist.filter((item) => item.done).length;
    const totalCount = checklist.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    useEffect(() => {
        api
            .get(`/interns/${id}`)
            .then((res) => {
                setIntern(res.data.data);
            })
            .catch((error) => setError(true))
            .finally(() => setLoading(false));
    }, [id])

    function handleChecklistChange(itemId, newDoneValue) {
        setUpdatingItemId(itemId);
        setChecklistError(false)

        api.patch(`/interns/${id}/checklist/${itemId}`, {
            done: newDoneValue
        })
            .then((res) => {
                setIntern(res.data.data);
            })
            .catch((error) => setChecklistError(true))
            .finally(() => setUpdatingItemId(null));
    }

    return (
    <>
        {loading ? (
            <div className="loader-container">
                <div className="loader"></div>
            </div>
        ) : error ? (
            <h3 className="message">Failed to load intern</h3>
        ) : (
        <div className="intern-profile">
            <div className="profile-header">
                <div>
                    <h1>{intern.user.name}</h1>
                    <p>{intern.user.email}</p>
                </div>

                <span className={`badge ${intern.status}`}>{intern.status}</span>
            </div>

            <div className="profile-info">
                <div className="info-card">
                    <span className="info-label">Track</span>
                    <strong>{formatTrack(intern.track)}</strong>
                </div>

                <div className="info-card">
                    <span className="info-label">Cohort</span>
                    <strong>{intern.cohort}</strong>
                </div>

                <div className="info-card">
                    <span className="info-label">Mentor</span>
                    <strong>{intern.mentor?.name || "Not assigned"}</strong>
                </div>

                <div className="info-card">
                    <span className="info-label">Start Date</span>
                    <strong>{new Date(intern.startDate).toLocaleDateString()}</strong>
                </div>

                <div className="info-card">
                    <span className="info-label">End Date</span>
                    <strong>{intern.endDate
                        ? new Date(intern.endDate).toLocaleDateString()
                        : "—"}</strong>
                </div>
            </div>

            <div className="profile-section">
                <h2>Onboarding Checklist</h2>

                <div className="checklist-progress">
                    <div className="progress-header">
                        <span>Progress</span>
                        <strong>{completedCount} of {totalCount} completed</strong>
                    </div>

                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <div className="checklist-items">
                    {intern.onboardingChecklist.map((checklist) => 
                        <label className={`checklist-item ${checklist.done ? `completed` : ''}`} key={checklist._id}>
                            <input type="checkbox"
                                    checked={checklist.done} 
                                    onChange={() => handleChecklistChange(checklist._id, !checklist.done)}
                                    disabled={updatingItemId !== null} 
                            />
                            <span className="checkmark"></span>
                            <span className="checklist-label">{checklist.label}</span>
                        </label>
                    )}
                </div>

                {checklistError && <div className="checklist-error">⚠ Failed to update checklist item. Please try again.</div>}
            </div>
        </div>
        )}
    </>
    );
}