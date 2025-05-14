import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Upload from "./Upload";
import Info from "./Info";
import Flash from "./Flash";

import "./App.css";

function App() {
  return (
    <Router>
      <main className="container">
        <header>
          <div className="logo">mecha</div>
          <div className="heading">Flash Tool</div>
        </header>
        <Routes>
          <Route path="/" element={<Upload />} />
          <Route path="/info" element={<Info />} />
          <Route path="/flash" element={<Flash />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
