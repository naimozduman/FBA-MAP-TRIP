"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
export default function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = panel.current;
    element?.querySelector<HTMLElement>("input,button,select,textarea")?.focus();
    return () => previous?.focus();
  }, []);
  return <div className="dialog-backdrop"><div className="dialog" role="dialog" aria-modal="true" aria-label={title} ref={panel} onKeyDown={e => {
    if (e.key === "Escape") onClose();
    if (e.key === "Tab") {
      const controls = Array.from(panel.current?.querySelectorAll<HTMLElement>("button:not(:disabled),a,input,select,textarea") || []);
      if (e.shiftKey && document.activeElement === controls[0]) { e.preventDefault(); controls.at(-1)?.focus(); }
      else if (!e.shiftKey && document.activeElement === controls.at(-1)) { e.preventDefault(); controls[0]?.focus(); }
    }
  }}><header><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20} /></button></header>{children}</div></div>;
}
