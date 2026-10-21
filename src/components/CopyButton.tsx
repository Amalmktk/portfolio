import { useEffect, useRef, useState } from 'react';
import { LuCheck, LuCopy } from 'react-icons/lu';

interface CopyButtonProps {
  text: string;
  // What is being copied, for the screen-reader label ("Copy email address")
  label: string;
  className?: string;
}

const COPIED_RESET_MS = 2000;

const CopyButton = ({ text, label, className = '' }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    },
    []
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(
      () => setCopied(false),
      COPIED_RESET_MS
    );
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      className={`shrink-0 cursor-pointer text-zinc-500 transition-colors duration-300 hover:text-cyan-300 focus:outline-none focus-visible:text-cyan-300 ${className}`}
    >
      {copied ? (
        <LuCheck className="h-4 w-4 text-cyan-300" />
      ) : (
        <LuCopy className="h-4 w-4" />
      )}
    </button>
  );
};

export default CopyButton;
