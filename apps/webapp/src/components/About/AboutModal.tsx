import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AiOutlineClose, AiOutlineMail } from "react-icons/ai";
import { FaInfoCircle } from "react-icons/fa";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import "./AboutModal.scss";

interface AboutModalProps {
  showAbout: boolean;
  toggleAboutPopup: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({
  showAbout,
  toggleAboutPopup,
}) => {
  return (
    <Dialog.Root open={showAbout} onOpenChange={toggleAboutPopup}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <div className="dialog-header">
            <FaInfoCircle className="header-icon" />
            <Dialog.Title className="dialog-title">Sobre</Dialog.Title>
            <Dialog.Close className="close-button">
              <AiOutlineClose />
            </Dialog.Close>
          </div>
          <div className="about-content">
            <p>
              A ferramenta <strong>RADARE</strong> (Reconciliation and Data
              Analysis in a Responsive Environment) foi criada por Nilton Aguiar
              dos Santos, com auxilio do Prof. Dr. João Pena como parte de um
              projeto de inovação científica para o curso de Engenharia de
              Computação na Universidade Federal de Mato Grosso, Campus Várzea
              Grande. Este projeto visa facilitar a análise e reconciliação de
              dados, oferecendo uma solução avançada e intuitiva para lidar com
              grandes volumes de informações.
            </p>
            <p>
              <strong>RADARE</strong> utiliza TypeScript e React para garantir
              responsividade e agilidade no processo de desenvolvimento, e
              integra o ReactFlow para uma visualização dinâmica e interativa
              dos nós. No backend, a aplicação é sustentada por Go (Golang),
              proporcionando uma arquitetura robusta e escalável para o
              processamento e gerenciamento dos dados.
            </p>

            <div className="contact-section">
              <h3>Contatos</h3>
              <div className="contact-links">
                <a
                  href="https://github.com/notNilton"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaGithub className="contact-icon" />
                  GitHub
                </a>
                <a
                  href="https://linkedin.com/in/notNilton"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaLinkedin className="contact-icon" />
                  LinkedIn
                </a>
                <a href="mailto:nilton.naab@gmail.com">
                  <AiOutlineMail className="contact-icon" />
                  Email
                </a>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AboutModal;
