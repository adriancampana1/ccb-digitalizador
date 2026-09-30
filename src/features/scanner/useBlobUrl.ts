import { useEffect, useState } from "react";
export function useBlobUrl(blob: Blob | null) {
  const [value, setValue] = useState("");
  useEffect(() => {
    if (!blob) {
      setValue("");
      return;
    }
    const url = URL.createObjectURL(blob);
    setValue(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return value;
}
