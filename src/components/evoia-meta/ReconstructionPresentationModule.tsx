import { useEffect, useMemo, useState } from 'react';
import EvoiaMetaVisualWorkspace from './EvoiaMetaVisualWorkspace';
import type { HorizonTimelineStep } from './HorizonTimeline';
import type { EvoiaMetaProject } from '@/lib/evoia-meta/schema';

type ReconstructionPresentationModuleProps = {
  projects: EvoiaMetaProject[];
};

type PresentationStep = {
  step: HorizonTimelineStep;
  label: string;
  title: string;
};

const presentationSteps: PresentationStep[] = [
  { step: 'table', label: '1', title: 'Audit table' },
  { step: 'bars', label: '2', title: 'Published horizon bars' },
  { step: 'today-line', label: '3', title: 'Today marker' },
  { step: 'status-color', label: '4', title: 'Status coloring' },
  { step: 'funding-split', label: '5', title: 'Funding split' }
];

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tagName = target.tagName;
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target.isContentEditable;
}

export default function ReconstructionPresentationModule({ projects }: ReconstructionPresentationModuleProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const activeStep = presentationSteps[stepIndex];
  const progressText = useMemo(() => `${stepIndex + 1} / ${presentationSteps.length}`, [stepIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableElement(event.target)) {
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        setStepIndex((current) => Math.min(presentationSteps.length - 1, current + 1));
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        setStepIndex((current) => Math.max(0, current - 1));
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        setStepIndex(0);
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        setStepIndex(presentationSteps.length - 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <section
      aria-label="Evia reconstruction presentation module"
      style={{
        border: '1px solid var(--color-rule)',
        background: 'var(--color-surface)',
        padding: '1rem',
        aspectRatio: '16 / 9',
        minHeight: '42rem',
        maxHeight: '90vh',
        display: 'grid',
        gridTemplateRows: 'auto auto 1fr',
        gap: '0.9rem'
      }}
    >
      <header
        style={{
          borderBottom: '1px solid var(--color-rule)',
          paddingBottom: '0.7rem',
          display: 'grid',
          gap: '0.2rem'
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '0.78rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-muted)'
          }}
        >
          Presentation mode
        </p>
        <h1 style={{ margin: 0, fontSize: '2rem', lineHeight: 1.1 }}>{activeStep.title}</h1>
        <p style={{ margin: 0, fontSize: '1rem', color: 'var(--color-muted)' }}>
          Step {progressText}. Use arrow keys or buttons to navigate.
        </p>
      </header>

      <nav
        aria-label="Presentation controls"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.9rem'
        }}
      >
        <button
          type="button"
          onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
          disabled={stepIndex === 0}
          style={{
            border: '1px solid var(--color-rule)',
            background: stepIndex === 0 ? '#f7f4ee' : '#ece7de',
            color: 'var(--color-text)',
            padding: '0.45rem 0.75rem',
            font: 'inherit',
            fontSize: '0.95rem',
            cursor: stepIndex === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          Previous
        </button>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {presentationSteps.map((step, index) => {
            const isActive = index === stepIndex;

            return (
              <button
                key={step.step}
                type="button"
                aria-label={`Go to step ${step.label}: ${step.title}`}
                onClick={() => setStepIndex(index)}
                style={{
                  border: '1px solid var(--color-rule)',
                  background: isActive ? '#ece7de' : 'var(--color-surface)',
                  color: isActive ? 'var(--color-text)' : 'var(--color-muted)',
                  minWidth: '2.1rem',
                  padding: '0.35rem 0.45rem',
                  font: 'inherit',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {step.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setStepIndex((current) => Math.min(presentationSteps.length - 1, current + 1))}
          disabled={stepIndex === presentationSteps.length - 1}
          style={{
            border: '1px solid var(--color-rule)',
            background: stepIndex === presentationSteps.length - 1 ? '#f7f4ee' : '#ece7de',
            color: 'var(--color-text)',
            padding: '0.45rem 0.75rem',
            font: 'inherit',
            fontSize: '0.95rem',
            cursor: stepIndex === presentationSteps.length - 1 ? 'not-allowed' : 'pointer'
          }}
        >
          Next
        </button>
      </nav>

      <div style={{ minHeight: 0, overflow: 'auto' }}>
        <EvoiaMetaVisualWorkspace projects={projects} step={activeStep.step} presentationMode />
      </div>
    </section>
  );
}
