import {
  LoaderCircle,
  Warehouse,
} from "lucide-react";

function AuthLoadingScreen() {
  return (
    <main className="auth-loading-screen">
      <div className="auth-loading-logo">
        <Warehouse size={31} />
      </div>

      <h1>NaraWMS</h1>
      <p>Restoring your secure session</p>

      <LoaderCircle
        className="auth-loading-spinner"
        size={24}
      />
    </main>
  );
}

export default AuthLoadingScreen;