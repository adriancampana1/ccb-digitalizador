import { useState } from "react";
import { FileText } from "lucide-react";
import { safeExternalUrl } from "./documentApi";
export function Thumbnail({ url }: { url: string | null }) {
  const [failed, setFailed] = useState<string | null>(null);
  const safe = safeExternalUrl(url);
  return (
    <div className="file-icon">
      {safe && failed !== safe ? (
        <img
          src={safe}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(safe)}
        />
      ) : (
        <FileText size={22} aria-label="Miniatura indisponível" />
      )}
    </div>
  );
}
