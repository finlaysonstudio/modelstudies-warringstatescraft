import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AnnalsHome } from "./pages/annals/AnnalsHome";
import { EpisodePage } from "./pages/annals/EpisodePage";
import { AwryHome } from "./pages/awry/AwryHome";
import { Chapter } from "./pages/craft/Chapter";
import { Interview } from "./pages/craft/Interview";
import { CraftHome } from "./pages/craft/CraftHome";
import { SITES } from "./stage/sites";
import { Play } from "./pages/craft/Play";
import { Watch } from "./pages/craft/Watch";
import { Home } from "./pages/Home";
import { MatrixView } from "./pages/MatrixView";
import { RunReplay } from "./pages/RunReplay";
import { StudyView } from "./pages/StudyView";
import { Survey } from "./pages/craft/Survey";
import { Overworld } from "./pages/world/Overworld";
import { Site } from "./pages/world/Site";
import { Tiles } from "./pages/world/Tiles";
import { WorldHome } from "./pages/world/WorldHome";
import "./globals.css";

// The map, the sites, and the tiles lived under /craft before the World was
// its own section; an old link keeps its query string and its hash.
const MOVED_TO_WORLD = ["map", ...SITES.map((site) => site.id), "tiles"];

function MovedToWorld() {
  const { pathname, search, hash } = useLocation();
  return (
    <Navigate
      replace
      to={{ pathname: pathname.replace(/^\/craft/, "/world"), search, hash }}
    />
  );
}

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
            {MOVED_TO_WORLD.map((segment) => (
              <Route
                key={segment}
                path={`/craft/${segment}`}
                element={<MovedToWorld />}
              />
            ))}
            <Route path="/craft/survey" element={<Survey />} />
            <Route path="/craft/survey/:interviewId" element={<Interview />} />
            <Route path="/craft/play" element={<Play />} />
            <Route path="/craft/play/:id" element={<Watch />} />
            <Route path="/craft/replays/:id" element={<RunReplay />} />
            <Route path="/craft/replays/:id/matrix" element={<MatrixView />} />
            <Route path="/world" element={<WorldHome />} />
            <Route path="/world/map" element={<Overworld />} />
            {SITES.map((site) => (
              <Route
                key={site.id}
                path={site.path}
                element={<Site site={site} />}
              />
            ))}
            <Route path="/world/tiles" element={<Tiles />} />
            <Route path="/awry" element={<AwryHome />} />
            <Route path="/awry/studies/:id" element={<StudyView />} />
            <Route path="/awry/replays/:id" element={<RunReplay />} />
            <Route path="/annals" element={<AnnalsHome />} />
            <Route path="/annals/:id" element={<EpisodePage />} />
            <Route path="*" element={<Home notFound />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </StrictMode>,
  );
}
