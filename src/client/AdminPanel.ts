import { assetUrl } from "../core/AssetUrls";
import { Transport } from "./Transport";
import { GameView } from "./view/GameView";

const PANEL_ID = "openfront-admin-panel";
const JUMPSCARE_ID = "openfront-admin-jumpscare";

/**
 * A local control surface that is mounted only after GameServer has declared
 * the connected account an administrator. Every action is still re-authorized
 * by the server; this component is only a convenience UI.
 */
export class AdminPanel {
  private readonly targetSelect = document.createElement("select");
  private readonly root = document.createElement("section");

  constructor(
    private readonly gameView: GameView,
    private readonly transport: Transport,
  ) {
    this.root.id = PANEL_ID;
    this.root.setAttribute("aria-label", "Administrator controls");
    this.root.style.cssText = [
      "position:fixed",
      "top:16px",
      "right:16px",
      "z-index:10001",
      "width:230px",
      "padding:12px",
      "border:1px solid rgba(250,204,21,.75)",
      "border-radius:10px",
      "background:rgba(15,23,42,.94)",
      "box-shadow:0 10px 30px rgba(0,0,0,.45)",
      "color:#f8fafc",
      "font:600 13px/1.35 system-ui,sans-serif",
    ].join(";");

    const title = document.createElement("strong");
    title.textContent = "ADMIN CONTROLS";
    title.style.cssText = "display:block;color:#fde047;letter-spacing:.08em";

    const description = document.createElement("p");
    description.textContent = "Server-authorized actions";
    description.style.cssText =
      "margin:4px 0 10px;color:#cbd5e1;font-weight:400";

    this.targetSelect.style.cssText =
      "width:100%;margin-bottom:8px;padding:7px;border-radius:6px;background:#1e293b;color:#f8fafc;border:1px solid #475569";

    const refill = this.button("Infinite resources", () => {
      const targetClientID = this.targetSelect.value;
      if (targetClientID)
        this.transport.sendAdminGrantResources(targetClientID);
    });
    const jumpscare = this.button("Jumpscare selected", () => {
      const targetClientID = this.targetSelect.value;
      if (targetClientID) this.transport.sendAdminJumpscare(targetClientID);
    });
    jumpscare.style.background = "#991b1b";

    this.root.append(title, description, this.targetSelect, refill, jumpscare);
    document.body.appendChild(this.root);
    this.updateTargets();
  }

  updateTargets(): void {
    const current = this.targetSelect.value;
    this.targetSelect.replaceChildren();

    for (const player of this.gameView.players()) {
      const clientID = player.clientID();
      if (clientID === null || !player.isAlive()) continue;
      const option = document.createElement("option");
      option.value = clientID;
      option.textContent = player.name();
      this.targetSelect.appendChild(option);
    }

    if (
      current &&
      Array.from(this.targetSelect.options).some((o) => o.value === current)
    ) {
      this.targetSelect.value = current;
    }
  }

  dispose(): void {
    this.root.remove();
  }

  private button(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.style.cssText = [
      "display:block",
      "width:100%",
      "margin-top:7px",
      "padding:8px",
      "border:0",
      "border-radius:6px",
      "background:#b45309",
      "color:#fff",
      "font:700 12px system-ui,sans-serif",
      "cursor:pointer",
    ].join(";");
    button.addEventListener("click", onClick);
    return button;
  }
}

/** Display a short, non-persistent full-screen visual effect to one recipient. */
export function showAdminJumpscare(): void {
  document.getElementById(JUMPSCARE_ID)?.remove();

  const overlay = document.createElement("div");
  overlay.id = JUMPSCARE_ID;
  overlay.setAttribute("role", "presentation");
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:20000",
    "display:grid",
    "place-items:center",
    "background:rgba(0,0,0,.96)",
    "opacity:0",
    "transition:opacity 80ms ease-out",
    "pointer-events:none",
  ].join(";");

  const image = document.createElement("img");
  image.src = assetUrl("images/admin/jumpscare.webp");
  image.alt = "";
  image.style.cssText = [
    "width:min(92vw,92vh)",
    "height:min(92vw,92vh)",
    "object-fit:cover",
    "filter:contrast(1.2)",
    "transform:scale(.85)",
    "animation:openfront-admin-jumpscare 1.2s ease-out",
  ].join(";");

  if (!document.getElementById("openfront-admin-jumpscare-style")) {
    const style = document.createElement("style");
    style.id = "openfront-admin-jumpscare-style";
    style.textContent =
      "@keyframes openfront-admin-jumpscare { 0% { transform: scale(.55); } 12% { transform: scale(1.08); } 100% { transform: scale(1); } }";
    document.head.appendChild(style);
  }

  overlay.appendChild(image);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
  });
  window.setTimeout(() => overlay.remove(), 1200);
}
