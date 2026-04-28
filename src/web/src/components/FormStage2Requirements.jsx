import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useState } from 'react';

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

export default function FormStage2Requirements({ formData, onChange, errors }) {
  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  const renderInput = (label, field, type = 'text', required = false) => {
    const value = formData[field] || '';
    const error = errors?.[field];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: C.bone }}>
          {label} {required && <span style={{ color: C.ember }}>*</span>}
        </label>
        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
            style={{
              fontFamily: F.ui,
              fontSize: 12,
              color: C.bone,
              background: C.bone10,
              border: `1px solid ${error ? C.ember : C.border2}`,
              borderRadius: 6,
              padding: '10px 12px',
              outline: 'none',
              minHeight: 80,
              resize: 'vertical',
              transition: 'border-color 0.2s',
            }}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        ) : type === 'date' ? (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
            style={{
              fontFamily: F.ui,
              fontSize: 12,
              color: C.bone,
              background: C.bone10,
              border: `1px solid ${error ? C.ember : C.border2}`,
              borderRadius: 6,
              padding: '10px 12px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
            style={{
              fontFamily: F.ui,
              fontSize: 12,
              color: C.bone,
              background: C.bone10,
              border: `1px solid ${error ? C.ember : C.border2}`,
              borderRadius: 6,
              padding: '10px 12px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        )}
        {error && (
          <span style={{ fontFamily: F.ui, fontSize: 11, color: C.ember }}>
            {error}
          </span>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: F.display, fontSize: 18, color: C.bone, margin: 0, marginBottom: 8 }}>
          Project Basics
        </h2>
        <p style={{ fontFamily: F.ui, fontSize: 12, color: C.bone40, margin: 0 }}>
          Tell us about the core requirements
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {renderInput('Title or Description', 'title', 'text', true)}
        {renderInput('Expected Deliverable / Output', 'output', 'textarea', true)}

        {/* Deadline with DatePicker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: C.bone }}>
            Deadline <span style={{ color: C.ember }}>*</span>
          </label>
          <style>{`
            .deadline-picker {
              font-family: ${F.ui} !important;
              color: ${C.bone} !important;
            }
            .deadline-picker * {
              color: ${C.bone} !important;
            }
            .deadline-picker .react-datepicker-popper {
              background: ${C.surface} !important;
              border: 1px solid ${C.border} !important;
              border-radius: 6px !important;
            }
            .deadline-picker .react-datepicker {
              background: ${C.surface} !important;
              border: none !important;
            }
            .deadline-picker .react-datepicker__header {
              background: ${C.graphite} !important;
              border-bottom: 1px solid ${C.border} !important;
              border-radius: 6px 6px 0 0 !important;
            }
            .deadline-picker .react-datepicker__current-month {
              font-family: ${F.ui} !important;
              font-size: 13px !important;
              color: ${C.bone} !important;
              font-style: normal !important;
              font-weight: 500 !important;
            }
            .deadline-picker .react-datepicker__navigation {
              top: 10px !important;
            }
            .deadline-picker .react-datepicker__navigation-icon::before {
              border-color: ${C.bone40} !important;
            }
            .deadline-picker .react-datepicker__day-names {
              background: ${C.surface} !important;
              border-color: ${C.border2} !important;
            }
            .deadline-picker .react-datepicker__day-name {
              color: ${C.bone40} !important;
              font-family: ${F.ui} !important;
              font-size: 11px !important;
              font-weight: 600 !important;
            }
            .deadline-picker .react-datepicker__week {
              background: ${C.surface} !important;
            }
            .deadline-picker .react-datepicker__day {
              color: ${C.bone} !important;
              background: ${C.surface} !important;
              font-family: ${F.ui} !important;
              font-size: 12px !important;
              border-radius: 4px !important;
              margin: 2px !important;
            }
            .deadline-picker .react-datepicker__day:hover {
              background: ${C.graphite} !important;
            }
            .deadline-picker .react-datepicker__day--selected,
            .deadline-picker .react-datepicker__day--in-selecting-range,
            .deadline-picker .react-datepicker__day--in-range {
              background: ${C.ember} !important;
              color: ${C.bone} !important;
              font-weight: 600 !important;
            }
            .deadline-picker .react-datepicker__day--keyboard-selected {
              background: ${C.ember} !important;
              color: ${C.bone} !important;
            }
            .deadline-picker .react-datepicker__day--outside-month {
              color: ${C.bone40} !important;
              opacity: 0.5 !important;
            }
            .deadline-picker .react-datepicker__time-container {
              border-left: 1px solid ${C.border} !important;
              background: ${C.graphite} !important;
            }
            .deadline-picker .react-datepicker__time {
              background: ${C.graphite} !important;
            }
            .deadline-picker .react-datepicker__time-list {
              background: ${C.graphite} !important;
              color: ${C.bone} !important;
            }
            .deadline-picker .react-datepicker__time-list * {
              color: ${C.bone} !important;
            }
            .deadline-picker .react-datepicker__time-list__item {
              color: ${C.bone} !important;
              font-family: ${F.ui} !important;
              font-size: 13px !important;
              font-weight: 500 !important;
              padding: 12px 16px !important;
              text-color: ${C.bone} !important;
            }
            .deadline-picker .react-datepicker__time-list__item:hover {
              background: ${C.ember}20 !important;
              color: ${C.bone} !important;
            }
            .deadline-picker .react-datepicker__time-list__item--selected {
              background: ${C.ember} !important;
              color: ${C.bone} !important;
              font-weight: 700 !important;
              border-radius: 4px !important;
            }
            .deadline-picker .react-datepicker__time-list__item span {
              color: ${C.bone} !important;
            }
            .deadline-picker .react-datepicker__time-header {
              color: ${C.bone} !important;
              font-weight: 600 !important;
              text-color: ${C.bone} !important;
              background: ${C.graphite} !important;
            }
            .deadline-picker .react-datepicker__header {
              color: ${C.bone} !important;
            }
            .deadline-picker .react-datepicker__time-header div {
              color: ${C.bone} !important;
            }
            .deadline-picker .react-datepicker__time-header span {
              color: ${C.bone} !important;
            }
            .react-datepicker__time-header {
              color: ${C.bone} !important;
            }
            .react-datepicker__time-header * {
              color: ${C.bone} !important;
            }
            .deadline-picker .react-datepicker__input-time-container input {
              color: ${C.bone} !important;
              font-size: 13px !important;
              font-weight: 500 !important;
              background: ${C.graphite} !important;
            }
            .deadline-picker .react-datepicker__input-time-container input::placeholder {
              color: ${C.bone40} !important;
            }
            .deadline-picker .react-datepicker__time-container .react-datepicker__time input {
              color: ${C.bone} !important;
              background: ${C.graphite} !important;
              font-weight: 500 !important;
            }
            .deadline-picker .react-datepicker__month {
              margin: 8px !important;
              background: ${C.surface} !important;
            }
          `}</style>
          <DatePicker
            selected={formData.deadline ? new Date(formData.deadline) : null}
            onChange={(date) => {
              if (date) {
                handleChange('deadline', date.toISOString());
              }
            }}
            onChangeRaw={(e) => {
              // Allow manual text input (e.g., "2026-05-10 14:30")
              const val = e.target.value;
              if (val) {
                try {
                  const parsed = new Date(val);
                  if (!isNaN(parsed.getTime())) {
                    handleChange('deadline', parsed.toISOString());
                  }
                } catch (err) {
                  // Invalid input, ignore
                }
              }
            }}
            showTimeSelect
            timeIntervals={30}
            dateFormat="MMM d, yyyy h:mm aa"
            minDate={new Date()}
            placeholderText="Click to select or type date..."
            className="deadline-picker"
            popperClassName="deadline-picker"
            filterDate={(date) => date >= new Date()}
            customInput={
              <input
                style={{
                  fontFamily: F.ui,
                  fontSize: 13,
                  fontWeight: 500,
                  color: C.bone,
                  background: C.bone10,
                  border: `1px solid ${errors?.deadline ? C.ember : C.border2}`,
                  borderRadius: 6,
                  padding: '12px 14px',
                  outline: 'none',
                  transition: 'border-color 0.2s, background 0.2s',
                  cursor: 'pointer',
                }}
              />
            }
          />
          {errors?.deadline && (
            <span style={{ fontFamily: F.ui, fontSize: 11, color: C.ember }}>
              {errors.deadline}
            </span>
          )}
        </div>

        {renderInput('Report To / Stakeholder', 'reportTo', 'text', false)}

        {/* Priority Level */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: C.bone }}>
            Priority Level
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {['Low', 'Medium', 'High', 'Critical'].map((level) => (
              <button
                key={level}
                onClick={() => handleChange('priorityLevel', level)}
                style={{
                  padding: '10px 12px',
                  fontFamily: F.ui,
                  fontSize: 12,
                  fontWeight: 500,
                  background: formData.priorityLevel === level ? C.ember : C.bone10,
                  color: formData.priorityLevel === level ? C.bone : C.bone40,
                  border: `1px solid ${formData.priorityLevel === level ? C.ember : C.border2}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (formData.priorityLevel !== level) {
                    e.currentTarget.style.borderColor = C.ember;
                    e.currentTarget.style.color = C.bone;
                  }
                }}
                onMouseLeave={(e) => {
                  if (formData.priorityLevel !== level) {
                    e.currentTarget.style.borderColor = C.border2;
                    e.currentTarget.style.color = C.bone40;
                  }
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
