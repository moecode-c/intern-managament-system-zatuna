import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

const TRACKS = [
  { value: 'frontend',  label: 'Frontend Development' },
  { value: 'backend',   label: 'Backend Development' },
  { value: 'fullstack', label: 'Full-Stack Development' },
  { value: 'mobile',    label: 'Mobile Development' },
  { value: 'design',    label: 'UI/UX Design' },
  { value: 'qa',        label: 'Quality Assurance' },
  { value: 'data',      label: 'Data Science & Analytics' },
];

const STEPS = ['Personal Details', 'Education', 'Track & Portfolio', 'CV Upload'];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Apply() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    university: '',
    major: '',
    graduationYear: '',
    track: '',
    portfolioUrl: '',
    coverLetter: '',
  });
  const [cvFile, setCvFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(null); // { publicToken }

  const onChange = useCallback((e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  }, []);

  // --- Step validation ---
  const validateStep = useCallback((currentStep) => {
    const e = {};

    if (currentStep === 0) {
      if (!form.fullName.trim()) e.fullName = 'Full name is required';
      if (!form.email.trim()) e.email = 'Email is required';
      else if (!isValidEmail(form.email)) e.email = 'Please enter a valid email address';
    }

    if (currentStep === 1) {
      // Education fields are optional but if graduationYear is provided, validate it
      if (form.graduationYear && (isNaN(form.graduationYear) || form.graduationYear < 1990 || form.graduationYear > 2035)) {
        e.graduationYear = 'Enter a valid year (1990–2035)';
      }
    }

    if (currentStep === 2) {
      if (!form.track) e.track = 'Please select a track';
    }

    if (currentStep === 3) {
      if (!cvFile) e.cv = 'CV file is required';
      else {
        if (!ALLOWED_TYPES.includes(cvFile.type)) {
          e.cv = 'CV must be a PDF or Word document (.pdf, .doc, .docx)';
        }
        if (cvFile.size > MAX_FILE_SIZE) {
          e.cv = `File is too large (${(cvFile.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`;
        }
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form, cvFile]);

  const nextStep = useCallback(() => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  }, [step, validateStep]);

  const prevStep = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0] || null;
    setCvFile(file);
    setErrors((prev) => ({ ...prev, cv: '' }));

    // Instant validation feedback for file
    if (file) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setErrors((prev) => ({ ...prev, cv: 'CV must be a PDF or Word document (.pdf, .doc, .docx)' }));
      } else if (file.size > MAX_FILE_SIZE) {
        setErrors((prev) => ({ ...prev, cv: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.` }));
      }
    }
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Validate all steps before submitting
    let allValid = true;
    for (let i = 0; i <= 3; i++) {
      if (!validateStep(i)) {
        setStep(i);
        allValid = false;
        break;
      }
    }
    if (!allValid) return;

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('fullName', form.fullName.trim());
      formData.append('email', form.email.trim());
      formData.append('phone', form.phone.trim());
      formData.append('university', form.university.trim());
      formData.append('major', form.major.trim());
      if (form.graduationYear) formData.append('graduationYear', form.graduationYear);
      formData.append('track', form.track);
      formData.append('portfolioUrl', form.portfolioUrl.trim());
      formData.append('coverLetter', form.coverLetter.trim());
      formData.append('cv', cvFile);

      // Let axios set Content-Type with boundary automatically
      const res = await api.post('/applications', formData);
      setSuccess(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setServerError(msg);
    } finally {
      setBusy(false);
    }
  };

  // --- Success state ---
  if (success) {
    return (
      <section className="card apply-card apply-success">
        <div className="success-icon">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l2.5 2.5L16 9" />
          </svg>
        </div>
        <h1>Application Submitted!</h1>
        <p>Thank you, <strong>{success.fullName}</strong>. Your application for the <strong>{success.track}</strong> track has been received.</p>

        <div className="token-box">
          <label className="token-label">Your status link</label>
          <p className="muted" style={{ margin: '0.25rem 0 0.5rem' }}>
            Save this link — you'll need it to check your application progress.
          </p>
          <div className="token-link-row">
            <code className="token-code">{window.location.origin}/status/{success.publicToken}</code>
            <button
              type="button"
              className="btn-copy"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/status/${success.publicToken}`);
              }}
            >
              Copy
            </button>
          </div>
        </div>

        <div className="row" style={{ marginTop: '1.5rem', justifyContent: 'center', gap: '1rem' }}>
          <Link className="btn" to={`/status/${success.publicToken}`}>Check Status</Link>
          <Link className="btn btn-secondary" to="/">Back to Home</Link>
        </div>
      </section>
    );
  }

  // --- Form steps ---
  return (
    <section className="card apply-card">
      <h1>Apply for an Internship</h1>
      <p className="muted" style={{ marginTop: '-0.5rem' }}>
        Join the El Zatuna programme. Fill in your details below.
      </p>

      {/* Stepper */}
      <div className="stepper" role="navigation" aria-label="Form steps">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`stepper-step ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}
          >
            <div className="stepper-circle">
              {i < step ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4L19 7" /></svg>
              ) : (
                i + 1
              )}
            </div>
            <span className="stepper-label">{label}</span>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} noValidate>
        {/* Step 0 - Personal Details */}
        {step === 0 && (
          <div className="step-content" key="step-0">
            <h2 className="step-title">Personal Details</h2>

            <div>
              <label htmlFor="apply-fullName">Full name *</label>
              <input
                id="apply-fullName"
                name="fullName"
                value={form.fullName}
                onChange={onChange}
                placeholder="e.g. Ahmad Al-Hassan"
                required
                autoFocus
              />
              {errors.fullName && <p className="error">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="apply-email">Email *</label>
              <input
                id="apply-email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="you@example.com"
                required
              />
              {errors.email && <p className="error">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="apply-phone">Phone number</label>
              <input
                id="apply-phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={onChange}
                placeholder="+962 7XX XXX XXX"
              />
            </div>
          </div>
        )}

        {/* Step 1 - Education */}
        {step === 1 && (
          <div className="step-content" key="step-1">
            <h2 className="step-title">Education</h2>

            <div>
              <label htmlFor="apply-university">University</label>
              <input
                id="apply-university"
                name="university"
                value={form.university}
                onChange={onChange}
                placeholder="e.g. University of Jordan"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="apply-major">Major / Field of study</label>
              <input
                id="apply-major"
                name="major"
                value={form.major}
                onChange={onChange}
                placeholder="e.g. Computer Science"
              />
            </div>

            <div>
              <label htmlFor="apply-graduationYear">Expected graduation year</label>
              <input
                id="apply-graduationYear"
                name="graduationYear"
                type="number"
                min="1990"
                max="2035"
                value={form.graduationYear}
                onChange={onChange}
                placeholder="e.g. 2026"
              />
              {errors.graduationYear && <p className="error">{errors.graduationYear}</p>}
            </div>
          </div>
        )}

        {/* Step 2 - Track & Portfolio */}
        {step === 2 && (
          <div className="step-content" key="step-2">
            <h2 className="step-title">Track &amp; Portfolio</h2>

            <div>
              <label htmlFor="apply-track">Internship track *</label>
              <select
                id="apply-track"
                name="track"
                value={form.track}
                onChange={onChange}
                required
              >
                <option value="">— Select a track —</option>
                {TRACKS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {errors.track && <p className="error">{errors.track}</p>}
            </div>

            <div>
              <label htmlFor="apply-portfolioUrl">Portfolio / GitHub URL</label>
              <input
                id="apply-portfolioUrl"
                name="portfolioUrl"
                type="url"
                value={form.portfolioUrl}
                onChange={onChange}
                placeholder="https://github.com/you"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="apply-coverLetter">Cover letter / motivation</label>
              <textarea
                id="apply-coverLetter"
                name="coverLetter"
                value={form.coverLetter}
                onChange={onChange}
                rows={4}
                placeholder="Tell us why you want to join El Zatuna..."
              />
            </div>
          </div>
        )}

        {/* Step 3 - CV Upload */}
        {step === 3 && (
          <div className="step-content" key="step-3">
            <h2 className="step-title">Upload Your CV</h2>

            <div className={`file-drop-zone ${cvFile && !errors.cv ? 'has-file' : ''} ${errors.cv ? 'has-error' : ''}`}>
              <input
                id="apply-cv"
                name="cv"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="file-input-hidden"
              />
              <label htmlFor="apply-cv" className="file-drop-label">
                {cvFile ? (
                  <>
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke={errors.cv ? 'var(--error)' : 'var(--accent)'} strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><polyline points="14,2 14,8 20,8"/></svg>
                    <span className="file-name">{cvFile.name}</span>
                    <span className="file-size">{(cvFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--muted)" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span>Click or drag to upload your CV</span>
                    <span className="muted" style={{ fontSize: '0.8rem' }}>PDF or Word document, max 5 MB</span>
                  </>
                )}
              </label>
            </div>
            {errors.cv && <p className="error">{errors.cv}</p>}
          </div>
        )}

        {/* Server error */}
        {serverError && <p className="error server-error">{serverError}</p>}

        {/* Navigation buttons */}
        <div className="step-nav">
          {step > 0 && (
            <button type="button" className="btn btn-secondary" onClick={prevStep}>
              ← Back
            </button>
          )}
          <div className="step-nav-spacer" />
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={nextStep}>
              Next →
            </button>
          ) : (
            <button type="submit" disabled={busy}>
              {busy ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
