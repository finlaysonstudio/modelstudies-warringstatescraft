import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { MatrixView } from "./pages/MatrixView";
import { PlayConsole, PlaySetup } from "./pages/Play";
import { RunReplay } from "./pages/RunReplay";
import { RunsIndex } from "./pages/RunsIndex";
import { ScenarioMaterialsPage } from "./pages/ScenarioMaterials";
import { StudiesIndex } from "./pages/StudiesIndex";
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
            <Route path="/" element={<RunsIndex />} />
            <Route path="/runs/:id" element={<RunReplay />} />
            <Route path="/runs/:id/matrix" element={<MatrixView />} />
            <Route path="/studies" element={<StudiesIndex />} />
            <Route path="/studies/:id" element={<StudyView />} />
            <Route path="/values" element={<ValuesIndex />} />
            <Route path="/scenarios" element={<ScenarioMaterialsPage />} />
            <Route path="/scenarios/:id" element={<ScenarioMaterialsPage />} />
            <Route path="/play" element={<PlaySetup />} />
            <Route path="/play/:id" element={<PlayConsole />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </StrictMode>,
  );
}
