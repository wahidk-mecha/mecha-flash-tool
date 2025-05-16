import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Upload from "./pages/Upload";
import Info from "./pages/Info";
import Flash from "./pages/Flash";

import "./App.css";

function App() {
  return (
    <Router>
      <main className="flex flex-col h-screen">
        <header className="flex items-center justify-between p-6 border-b-2 border-b-black">
          <div className="font-bold font-mono text-4xl bg-black text-white px-3 py-1 rounded-xl">mecha</div>
          <div className="font-bold text-2xl">Flash Tool</div>
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
