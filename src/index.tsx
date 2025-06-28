import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Frame } from "./screens/Frame";
import "../tailwind.css";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <Frame />
  </StrictMode>,
);
