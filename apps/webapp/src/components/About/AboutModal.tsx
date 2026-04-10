import React from "react";
import { CircleHelp, Github, Linkedin, Mail, X } from "lucide-react";

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
            <Github size={14} />
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/notNilton"
            target="_blank"
            rel="noopener noreferrer"
            style={btnBase}
          >
            <Linkedin size={14} />
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
