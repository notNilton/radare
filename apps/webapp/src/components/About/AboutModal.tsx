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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-slate-100 shadow-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
              <CircleHelp className="h-5 w-5" />
            </div>
            <div>
              <h2 id="about-modal-title" className="text-xl font-semibold">
                Sobre
              </h2>
              <p className="text-sm text-slate-400">
                Reconciliação de dados com foco operacional
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleAboutPopup}
            className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm leading-7 text-slate-300">
          <p>
            A ferramenta <strong>RADARE</strong> (Reconciliation and Data
            Analysis in a Responsive Environment) foi criada por Nilton Aguiar
            dos Santos, com auxílio do Prof. Dr. João Pena, como parte de um
            projeto de inovação científica para o curso de Engenharia de
            Computação na Universidade Federal de Mato Grosso, Campus Várzea
            Grande.
          </p>
          <p>
            O sistema combina TypeScript, React e React Flow no frontend com
            um backend em Go para apoiar modelagem de fluxos, reconciliação e
            análise operacional de dados técnicos.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="https://github.com/notNilton"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-100"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/notNilton"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-100"
          >
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </a>
          <a
            href="mailto:nilton.naab@gmail.com"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-100"
          >
            <Mail className="h-4 w-4" />
            Email
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
