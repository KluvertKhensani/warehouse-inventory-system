import { createElement } from "react";
import { LoaderCircle } from "lucide-react";
import saaLogo from "../assets/saa-logo.png";

function AuthLoadingScreen() {
  return (
    <main
      className="auth-loading-screen"
      aria-live="polite"
      aria-busy="true"
    >
      {createElement("img", {
        className: "auth-loading-logo",
        src: saaLogo,
        alt: "South African Airways",
      })}

      <LoaderCircle
        className="auth-loading-spinner"
        size={24}
        aria-hidden="true"
      />

      <span className="screen-reader-only">
        Restoring your secure session
      </span>
    </main>
  );
}

export default AuthLoadingScreen;