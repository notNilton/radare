import React, { useState } from "react";
import SidebarComponent from "../components/Sidebar/SidebarComponent";
import GraphComponent from "../components/Graph/GraphComponent";
import NavbarComponent from "../components/Navbar/NavbarComponent";
import Node from "../components/Canva/Node";
import AboutModal from "../components/About/AboutModal";

const HomePage: React.FC = () => {
  const [showAbout, setShowAbout] = useState<boolean>(false);

  const toggleAboutPopup = () => {
    setShowAbout(!showAbout);
  };

  return (
    <div className="home">
      <div className="navbar-container">
        <NavbarComponent version={""} />
      </div>
      <div className="sidebar-container">
        <SidebarComponent nodes={[]} edges={[]} edgeNames={[]} />
      </div>
      <div className="graph-container">
        <GraphComponent />
      </div>
      <div className="node-container">
        <Node />
      </div>
      <div className="modal-container">
        <AboutModal showAbout={showAbout} toggleAboutPopup={toggleAboutPopup} />
      </div>
    </div>
  );
};

export default HomePage;
