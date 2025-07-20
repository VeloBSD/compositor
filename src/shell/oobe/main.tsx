import { createRoot } from "react-dom/client";
import Oobe  from "./App";
function start() {
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <>
      <Oobe />
    </>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
