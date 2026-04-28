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

export default function FormStage3Context({ formData, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: F.display, fontSize: 18, color: C.bone, margin: 0, marginBottom: 8 }}>
          Context & Details
        </h2>
        <p style={{ fontFamily: F.ui, fontSize: 12, color: C.bone40, margin: 0 }}>
          Add more context to help AI understand the work better
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Priority */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: C.bone }}>
            Priority Level
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => handleChange('priority', p)}
                style={{
                  fontFamily: F.ui,
                  fontSize: 12,
                  fontWeight: formData.priority === p ? 600 : 500,
                  color: formData.priority === p ? C.bone : C.bone40,
                  background: formData.priority === p ? C.surface : C.graphite,
                  border: `1px solid ${formData.priority === p ? C.ember : C.border}`,
                  borderRadius: 6,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Success Criteria */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: C.bone }}>
            Success Criteria (What defines "done"?)
          </label>
          <textarea
            value={formData.successCriteria || ''}
            onChange={(e) => handleChange('successCriteria', e.target.value)}
            style={{
              fontFamily: F.ui,
              fontSize: 12,
              color: C.bone,
              background: C.bone10,
              border: `1px solid ${C.border2}`,
              borderRadius: 6,
              padding: '10px 12px',
              outline: 'none',
              minHeight: 80,
              resize: 'vertical',
              transition: 'border-color 0.2s',
            }}
            placeholder="E.g., 15 slides completed, approved by manager, deployed to production..."
          />
        </div>

        {/* Constraints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: C.bone }}>
            Constraints (time, budget, people, dependencies)
          </label>
          <textarea
            value={formData.constraints || ''}
            onChange={(e) => handleChange('constraints', e.target.value)}
            style={{
              fontFamily: F.ui,
              fontSize: 12,
              color: C.bone,
              background: C.bone10,
              border: `1px solid ${C.border2}`,
              borderRadius: 6,
              padding: '10px 12px',
              outline: 'none',
              minHeight: 80,
              resize: 'vertical',
              transition: 'border-color 0.2s',
            }}
            placeholder="E.g., Need design input from Sarah by Tuesday, limited budget, team of 2..."
          />
        </div>

        {/* Additional Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: C.bone }}>
            Additional Notes
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            style={{
              fontFamily: F.ui,
              fontSize: 12,
              color: C.bone,
              background: C.bone10,
              border: `1px solid ${C.border2}`,
              borderRadius: 6,
              padding: '10px 12px',
              outline: 'none',
              minHeight: 60,
              resize: 'vertical',
              transition: 'border-color 0.2s',
            }}
            placeholder="Any additional context or requirements..."
          />
        </div>
      </div>
    </div>
  );
}
