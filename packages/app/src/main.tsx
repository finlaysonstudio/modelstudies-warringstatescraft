import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { RunReplay } from "./pages/RunReplay";
import { RunsIndex } from "./pages/RunsIndex";
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
          </Routes>
        </AppShell>
      </BrowserRouter>
    </StrictMode>,
  );
}
