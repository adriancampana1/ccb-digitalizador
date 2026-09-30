import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/lexend-deca/latin-400.css";
import "@fontsource/lexend-deca/latin-500.css";
import "@fontsource/lexend-deca/latin-600.css";
import "../src/shared/theme/globals.css";
import App from "./app/App";
import { restoreSession } from "./features/auth/sessionStore";
async function bootstrap() {
  if (import.meta.env.VITE_DEMO === "true") {
    const { startDemo } = await import("./demo/start");
    startDemo();
  }
  restoreSession();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
void bootstrap();
