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

function ReviewField({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontFamily: F.ui, fontSize: 11, color: C.bone40, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontFamily: F.ui, fontSize: 12, color: C.bone, whiteSpace: 'pre-wrap' }}>
        {value}
      </div>
    </div>
  );
}

export default function FormStage4Review({ formData, onEdit }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const sections = [
    {
      title: 'Requirements',
      fields: [
        { label: 'Title', value: formData.title },
        { label: 'Deliverable', value: formData.output },
        { label: 'Deadline', value: formatDate(formData.deadline) },
        { label: 'Report To', value: formData.reportTo },
        { label: 'Priority Level', value: formData.priorityLevel },
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: F.display, fontSize: 18, color: C.bone, margin: 0, marginBottom: 8 }}>
          Review Your Work
        </h2>
        <p style={{ fontFamily: F.ui, fontSize: 12, color: C.bone40, margin: 0 }}>
          Everything looks good? AI will now create a plan based on this information
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sections.map((section) => (
          <div key={section.title}>
            <div
              style={{
                fontFamily: F.ui,
                fontSize: 11,
                fontWeight: 600,
                color: C.bone40,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              {section.title}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {section.fields.map((field) => (
                <ReviewField key={field.label} label={field.label} value={field.value} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onEdit()}
        style={{
          fontFamily: F.ui,
          fontSize: 12,
          color: C.bone40,
          background: 'transparent',
          border: `1px solid ${C.border2}`,
          borderRadius: 6,
          padding: '8px 12px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = C.ember;
          e.currentTarget.style.color = C.bone;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = C.border2;
          e.currentTarget.style.color = C.bone40;
        }}
      >
        ← Back to Edit
      </button>

      <div
        style={{
          fontFamily: F.ui,
          fontSize: 11,
          color: C.bone40,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 6,
          padding: 12,
        }}
      >
        ℹ️ Once you submit, AI will analyze this information and create a detailed plan with milestones, timeline, and resource recommendations. You'll have a chance to review and refine before it's locked in.
      </div>
    </div>
  );
}
