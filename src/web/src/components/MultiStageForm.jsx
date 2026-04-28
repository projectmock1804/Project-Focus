import { useState } from 'react';
import FormStage2Requirements from './FormStage2Requirements';
import FormStage4Review from './FormStage4Review';

const C = {
  ink: '#0E0E0C',
  graphite: '#1C1C19',
  surface: '#252520',
  bone: '#F2F0EB',
  bone40: '#F2F0EB40',
  bone10: '#F2F0EB10',
  ember: '#E86B3A',
  moss: '#6B8E5A',
  border: '#3A3933',
  border2: '#4A4943',
};

const F = {
  display: '"Fraunces", serif',
  ui: '"Inter", sans-serif',
  mono: '"JetBrains Mono", monospace',
};

export default function MultiStageForm({ onSubmit, onCancel, userId }) {
  const [stage, setStage] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    output: '',
    deadline: '',
    reportTo: '',
    priorityLevel: 'High',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stages = [
    { title: 'Requirements', component: FormStage2Requirements },
    { title: 'Review', component: FormStage4Review },
  ];

  const validateStage = (stageNum) => {
    const newErrors = {};

    if (stageNum === 0) {
      if (!formData.title) newErrors.title = 'Title is required';
      if (!formData.output) newErrors.output = 'Deliverable is required';
      if (!formData.deadline) newErrors.deadline = 'Deadline is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStage(stage)) {
      setStage(stage + 1);
      setErrors({});
    }
  };

  const handlePrevious = () => {
    setStage(stage - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStage(stage)) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData, userId);
    } catch (err) {
      console.error('Form submission error:', err);
      setErrors({ submit: err.message || 'Failed to submit form' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStage = stages[stage].component;
  const isLastStage = stage === stages.length - 1;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: C.ink,
        color: C.bone,
      }}
    >
      {/* Progress Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '16px 20px',
          borderBottom: `1px solid ${C.border}`,
          background: C.graphite,
        }}
      >
        {stages.map((s, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: idx < stage ? C.moss : idx === stage ? C.ember : C.surface,
                border: `1px solid ${idx <= stage ? 'transparent' : C.border2}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: F.ui,
                fontSize: 11,
                fontWeight: 600,
                color: idx <= stage ? C.ink : C.bone40,
              }}
            >
              {idx < stage ? '✓' : idx + 1}
            </div>
            <span
              style={{
                fontFamily: F.ui,
                fontSize: 11,
                color: idx <= stage ? C.bone : C.bone40,
                fontWeight: idx === stage ? 600 : 400,
              }}
            >
              {s.title}
            </span>
            {idx < stages.length - 1 && (
              <div style={{ width: 12, height: 1, background: C.border2, margin: '0 4px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px 32px',
        }}
      >
        {stage === 0 && (
          <FormStage2Requirements formData={formData} onChange={setFormData} errors={errors} />
        )}
        {stage === 1 && <FormStage4Review formData={formData} onEdit={() => setStage(0)} />}
      </div>

      {/* Error Message */}
      {errors.submit && (
        <div
          style={{
            padding: '12px 20px',
            background: C.ember + '10',
            border: `1px solid ${C.ember}40`,
            color: C.ember,
            fontFamily: F.ui,
            fontSize: 12,
          }}
        >
          {errors.submit}
        </div>
      )}

      {/* Footer Buttons */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: '16px 20px',
          borderTop: `1px solid ${C.border}`,
          background: C.graphite,
        }}
      >
        <button
          onClick={onCancel}
          style={{
            fontFamily: F.ui,
            fontSize: 12,
            fontWeight: 500,
            color: C.bone40,
            background: 'transparent',
            border: `1px solid ${C.border2}`,
            borderRadius: 6,
            padding: '10px 16px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.bone40;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border2;
          }}
        >
          Cancel
        </button>

        {stage > 0 && (
          <button
            onClick={handlePrevious}
            style={{
              fontFamily: F.ui,
              fontSize: 12,
              fontWeight: 500,
              color: C.bone,
              background: C.surface,
              border: `1px solid ${C.border2}`,
              borderRadius: 6,
              padding: '10px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.bone;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border2;
            }}
          >
            ← Previous
          </button>
        )}

        {!isLastStage ? (
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            style={{
              marginLeft: 'auto',
              fontFamily: F.ui,
              fontSize: 12,
              fontWeight: 600,
              color: C.ink,
              background: C.ember,
              border: 'none',
              borderRadius: 6,
              padding: '10px 20px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: isSubmitting ? 0.6 : 1,
            }}
            onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.opacity = '1')}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              marginLeft: 'auto',
              fontFamily: F.ui,
              fontSize: 12,
              fontWeight: 600,
              color: C.ink,
              background: C.moss,
              border: 'none',
              borderRadius: 6,
              padding: '10px 24px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {isSubmitting ? 'Creating...' : '✓ Create Plan'}
          </button>
        )}
      </div>
    </div>
  );
}
