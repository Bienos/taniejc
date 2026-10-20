'use client';

import {useEffect, useRef, useState, type FormEvent} from 'react';

export function BarcodeScanner({onCode, onClose}: {onCode: (code: string) => void; onClose: () => void}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [manual, setManual] = useState('');
  const [message, setMessage] = useState('Ustaw kod kreskowy w ramce.');
  const [cameraUnavailable, setCameraUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    let stream: MediaStream | undefined;
    let frame = 0;
    let detector: any;
    const start = async () => {
      try {
        const w = window as any;
        if (!w.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) throw new Error('Skanowanie nie jest obsługiwane w tej przeglądarce.');
        const formats = await w.BarcodeDetector.getSupportedFormats();
        const allowed = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf'].filter((format) => formats.includes(format));
        if (!allowed.length) throw new Error('Ta przeglądarka nie obsługuje formatów kodów spożywczych.');
        detector = new w.BarcodeDetector({ formats: allowed });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (!active) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        const scan = async () => {
          if (!active || !videoRef.current) return;
          try {
            const results = await detector.detect(videoRef.current);
            const code = results?.[0]?.rawValue;
            if (code && /^\d{8,14}$/.test(code)) { active = false; onCode(code); return; }
          } catch { /* A frame may be undecodable; keep scanning. */ }
          frame = requestAnimationFrame(scan);
        };
        frame = requestAnimationFrame(scan);
      } catch (error) {
        if (!active) return;
        setCameraUnavailable(true);
        setMessage(error instanceof Error ? error.message : 'Nie można uruchomić aparatu. Wpisz kod ręcznie.');
      }
    };
    void start();
    return () => { active = false; cancelAnimationFrame(frame); stream?.getTracks().forEach((track) => track.stop()); };
  }, [onCode]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const code = manual.replace(/\s/g, '');
    if (!/^\d{8,14}$/.test(code)) { setMessage('Kod powinien zawierać od 8 do 14 cyfr.'); return; }
    onCode(code);
  }

  return <div className="receipt-backdrop barcode-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="barcode-modal" role="dialog" aria-modal="true" aria-labelledby="barcode-title"><div className="receipt-modal-head"><div><span className="eyebrow muted">KATALOG PRODUKTÓW</span><h2 id="barcode-title">Skanuj kod produktu</h2></div><button className="receipt-close" type="button" onClick={onClose} aria-label="Zamknij">×</button></div><div className="barcode-view">{cameraUnavailable?<div className="barcode-unavailable">Aparat niedostępny</div>:<video ref={videoRef} playsInline muted aria-label="Podgląd aparatu do skanowania kodu"/>}<span className="barcode-guide"/></div><p className="receipt-help">{message} Kamera działa tylko w obsługiwanych przeglądarkach i po udzieleniu zgody.</p><form className="barcode-manual" onSubmit={submit}><label htmlFor="manual-barcode">Albo wpisz kod kreskowy</label><div><input id="manual-barcode" inputMode="numeric" autoComplete="off" value={manual} onChange={(event) => setManual(event.target.value)} placeholder="np. 5901234123457" maxLength={14}/><button className="button-accent" type="submit">Sprawdź</button></div></form><button className="receipt-secondary barcode-cancel" type="button" onClick={onClose}>Anuluj</button></section></div>;
}
