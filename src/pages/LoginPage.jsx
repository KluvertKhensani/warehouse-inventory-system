import { useState } from "react";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Warehouse,
} from "lucide-react";
import { supabase } from "../lib/supabase";

function LoginPage({ profileError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage("Enter your email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Enter your password.");
      return;
    }

    setSubmitting(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

    if (error) {
      setErrorMessage(error.message);
      setSubmitting(false);
      return;
    }

    setPassword("");
    setSubmitting(false);
  }

  const displayedError =
    errorMessage || profileError;

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-content">
          <div className="login-brand">
            <span className="login-brand-icon">
              <Warehouse size={30} />
            </span>

            <div>
              <strong>WMS</strong>
              <span>Warehouse Inventory Control</span>
            </div>
          </div>

          <div className="login-introduction">
            <p className="login-eyebrow">
              Johannesburg Central Warehouse
            </p>

            <h1>
              Controlled inventory from receiving to
              dispatch.
            </h1>

            <p>
              Securely access warehouse products,
              locations, receipts, movements, transfers,
              stock counts and audit records.
            </p>
          </div>

          <div className="login-control-list">
            <div>
              <span>01</span>
              <p>Role-controlled warehouse access</p>
            </div>

            <div>
              <span>02</span>
              <p>Traceable inventory transactions</p>
            </div>

            <div>
              <span>03</span>
              <p>Operational and audit visibility</p>
            </div>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <div className="login-card-icon">
            <LockKeyhole size={25} />
          </div>

          <h2>Sign in</h2>

          <p className="login-card-description">
            Use your authorised warehouse account to
            continue.
          </p>

          {displayedError && (
            <div
              className="login-error"
              role="alert"
            >
              {displayedError}
            </div>
          )}

          <form
            className="login-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="login-field">
              <label htmlFor="loginEmail">
                Email address
              </label>

              <div className="login-input">
                <Mail size={18} />

                <input
                  id="loginEmail"
                  type="email"
                  value={email}
                  placeholder="name@example.com"
                  autoComplete="email"
                  disabled={submitting}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="loginPassword">
                Password
              </label>

              <div className="login-input">
                <LockKeyhole size={18} />

                <input
                  id="loginPassword"
                  type={
                    showPassword ? "text" : "password"
                  }
                  value={password}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={submitting}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                />

                <button
                  type="button"
                  className="password-visibility-button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="primary-button login-submit-button"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    className="login-spinner"
                    size={19}
                  />
                  Signing in
                </>
              ) : (
                <>
                  <LockKeyhole size={19} />
                  Sign in securely
                </>
              )}
            </button>
          </form>

          <div className="login-security-notice">
            Access is restricted to authorised warehouse
            personnel. User activity may be recorded for
            operational and audit purposes.
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;