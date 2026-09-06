import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Cloud,
  LoaderCircle,
  XCircle,
} from "lucide-react";
import { testSupabaseConnection } from "../lib/testSupabaseConnection";

function SupabaseStatus() {
  const [status, setStatus] = useState({
    loading: true,
    connected: false,
    message: "Checking Supabase connection...",
  });

  useEffect(() => {
    let componentIsMounted = true;

    async function checkConnection() {
      const result = await testSupabaseConnection();

      if (!componentIsMounted) {
        return;
      }

      setStatus({
        loading: false,
        connected: result.connected,
        message: result.message,
      });
    }

    checkConnection();

    return () => {
      componentIsMounted = false;
    };
  }, []);

  if (status.loading) {
    return (
      <div
        className="supabase-status supabase-status-loading"
        title={status.message}
      >
        <LoaderCircle
          className="supabase-status-spinner"
          size={16}
        />

        <span>Checking connection</span>
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div
        className="supabase-status supabase-status-error"
        title={status.message}
      >
        <XCircle size={16} />
        <span>Supabase unavailable</span>
      </div>
    );
  }

  return (
    <div
      className="supabase-status supabase-status-connected"
      title={status.message}
    >
      <CheckCircle2 size={16} />

      <span>
        <Cloud size={14} />
        Supabase connected
      </span>
    </div>
  );
}

export default SupabaseStatus;