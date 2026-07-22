import React from "react";
import { CircleHelp, Mail, X } from "lucide-react";

interface AboutModalProps {
  showAbout: boolean;
  toggleAboutPopup: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({
  showAbout,
  toggleAboutPopup,
}) => {
  if (!showAbout) {
    return null;
  }

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    fontSize: 11,
    fontWeight: 500,
    border: '1px solid var(--border-md)',
    borderRadius: 3,
    background: 'transparent',
    color: 'var(--tx-2)',
    cursor: 'pointer',
    textDecoration: 'none'
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      onClick={toggleAboutPopup}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: 'var(--surface)',
          border: '1px solid var(--border-md)',
          borderRadius: 6,
          padding: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          margin: '0 20px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div style={{ color: 'var(--accent)' }}>
              <CircleHelp size={24} />
            </div>
            <div>
              <h2 id="about-modal-title" style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx-1)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Sobre o Radare
              </h2>
              <p style={{ fontSize: 10, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
                Infraestrutura de Reconciliação de Dados
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleAboutPopup}
            style={{ background: 'none', border: 'none', color: 'var(--tx-3)', cursor: 'pointer' }}
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--tx-2)', fontFamily: 'monospace' }} className="space-y-6">
          <p>
            O <strong style={{ color: 'var(--tx-1)' }}>RADARE</strong> (Reconciliation and Data
            Analysis in a Responsive Environment) é um projeto acadêmico focado em integridade de dados operacionais.
          </p>
          <p>
            Desenvolvido por Nilton Aguiar dos Santos sob orientação do Prof. Dr. João Pena na UFMT, o sistema emprega Go e React Flow para modelagem de balanços de massa e consistência estatística.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          <a
            href="https://github.com/notNilton"
            target="_blank"
            rel="noopener noreferrer"
            style={btnBase}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/notNilton"
            target="_blank"
            rel="noopener noreferrer"
            style={btnBase}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
            LinkedIn
          </a>
          <a
            href="mailto:nilton.naab@gmail.com"
            style={btnBase}
          >
            <Mail size={14} />
            Email
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
