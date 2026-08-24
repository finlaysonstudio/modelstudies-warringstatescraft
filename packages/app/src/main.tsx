import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AwryHome } from "./pages/awry/AwryHome";
import { Chapter } from "./pages/craft/Chapter";
import { CraftHome } from "./pages/craft/CraftHome";
import { Home } from "./pages/Home";
import { MatrixView } from "./pages/MatrixView";
import { RunReplay } from "./pages/RunReplay";
import { StudyView } from "./pages/StudyView";
import { ValuesIndex } from "./pages/ValuesIndex";
import "./globals.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/craft" element={<CraftHome />} />
            <Route path="/craft/chapters/:id" element={<Chapter />} />
            <Route path="/craft/studies/:id" element={<StudyView />} />
            <Route path="/craft/survey" element={<ValuesIndex />} />
            <Route path="/craft/replays/:id" element={<RunReplay />} />
            <Route path="/craft/replays/:id/matrix" element={<MatrixView />} />
            <Route path="/awry" element={<AwryHome />} />
            <Route path="/awry/studies/:id" element={<StudyView />} />
            <Route path="/awry/replays/:id" element={<RunReplay />} />
            <Route path="*" element={<Home notFound />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </StrictMode>,
  );
}
