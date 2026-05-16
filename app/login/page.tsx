"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Mode = "signin" | "signup";

const lerp  = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const BL = { lf: 0.04,  tf: 0.14, wf: 0.225, hf: 0.72 };
const BC = { lf: 0.355, tf: 0.09, wf: 0.29,  hf: 0.82 };
const BR = { lf: 0.715, tf: 0.14, wf: 0.225, hf: 0.72 };

const PRINT_DURATION = 3.0;
const SWEEP_HZ       = 5;
const NOZZLE_H       = 52;

export default function LoginPage() {
  const router = useRouter();
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const animRef      = useRef<number>(0);
  const startRef     = useRef<number | null>(null);
  const allDone      = useRef(false);
  const trailRef     = useRef<{ x: number; y: number }[]>([]);

  const leftDivRef   = useRef<HTMLDivElement>(null);
  const centerDivRef = useRef<HTMLDivElement>(null);
  const rightDivRef  = useRef<HTMLDivElement>(null);

  const [showReplay, setShowReplay] = useState(false);
  const [mode,  setMode]  = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [name,  setName]  = useState("");
  const [err,   setErr]   = useState("");
  const [ok,    setOk]    = useState("");
  const [busy,  setBusy]  = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  function replay() {
    allDone.current  = false;
    trailRef.current = [];
    setShowReplay(false);
    startRef.current = null;
    // Reset clip-paths so panels are hidden again
    for (const r of [leftDivRef, centerDivRef, rightDivRef]) {
      if (!r.current) continue;
      r.current.style.clipPath      = "inset(100% 0px 0px 0px)";
      r.current.style.pointerEvents = "none";
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    type P = { x: number; y: number; vx: number; vy: number; life: number; max: number };
    const vapors: P[] = [], sparks: P[] = [];

    // ── Printer frame ──────────────────────────────────────────────────────────
    function drawFrame(W: number, H: number, alpha: number, ts: number) {
      if (alpha <= 0) return;
      ctx.save(); ctx.globalAlpha = alpha;
      const RW = 20;
      const rail = (x: number, flip: boolean) => {
        const g = ctx.createLinearGradient(x, 0, x + RW, 0);
        if (!flip) { g.addColorStop(0,"#0c0c1a"); g.addColorStop(0.6,"#1e1e30"); g.addColorStop(1,"#0a0a14"); }
        else       { g.addColorStop(0,"#0a0a14"); g.addColorStop(0.4,"#1e1e30"); g.addColorStop(1,"#0c0c1a"); }
        ctx.fillStyle = g; ctx.fillRect(x, 0, RW, H);
        ctx.strokeStyle = "rgba(251,120,40,0.6)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(flip?x:x+RW, 0); ctx.lineTo(flip?x:x+RW, H); ctx.stroke();
        for (let y = 50; y < H-40; y += 88) {
          ctx.fillStyle = "rgba(251,100,30,0.16)"; ctx.fillRect(x-5, y, RW+10, 4);
          ctx.beginPath(); ctx.arc(x+RW/2, y+2, 3.5, 0, Math.PI*2);
          ctx.fillStyle = "#0a0a14"; ctx.fill();
          ctx.strokeStyle = "rgba(251,100,30,0.35)"; ctx.lineWidth = 0.8; ctx.stroke();
        }
        ctx.save(); ctx.translate(x+RW/2, H/2); ctx.rotate(flip ? Math.PI/2 : -Math.PI/2);
        ctx.font = "7px monospace"; ctx.fillStyle = "rgba(251,120,40,0.22)"; ctx.textAlign = "center";
        ctx.fillText("Z-AXIS  ▸  STARSCRAFT", 0, 3); ctx.restore();
      };
      rail(0, false); rail(W-RW, true);
      { const g = ctx.createLinearGradient(0,0,0,24); g.addColorStop(0,"#1e1e30"); g.addColorStop(1,"#0c0c1a");
        ctx.fillStyle=g; ctx.fillRect(20,0,W-40,24);
        ctx.strokeStyle="rgba(251,120,40,0.4)"; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(20,24); ctx.lineTo(W-20,24); ctx.stroke();
        ctx.font="bold 8px monospace"; ctx.fillStyle="rgba(251,130,40,0.5)"; ctx.textAlign="center";
        ctx.fillText("STARSCRAFT 3D  ◈  FDM PRINTING  ◈  PLA / PETG  ◈  0.2mm LAYER HEIGHT", W/2, 15);
        ctx.textAlign="left"; }
      { const bedY=H-26;
        const g=ctx.createLinearGradient(0,bedY,0,H); g.addColorStop(0,"#1e1e30"); g.addColorStop(1,"#080810");
        ctx.fillStyle=g; ctx.fillRect(20,bedY,W-40,26);
        const gL=24, gR=W-24;
        ctx.strokeStyle="rgba(251,100,30,0.1)"; ctx.lineWidth=0.5;
        for (let i=0;i<=32;i++){const gx=gL+(i/32)*(gR-gL); ctx.beginPath(); ctx.moveTo(gx,bedY); ctx.lineTo(gx,H); ctx.stroke();}
        for (let i=0;i<7;i++){
          const lx=gL+(i/6)*(gR-gL), pulse=0.5+0.5*Math.sin(ts*0.002+i*0.9);
          const g2=ctx.createRadialGradient(lx,bedY+13,0,lx,bedY+13,6);
          g2.addColorStop(0,`rgba(255,${100+Math.round(80*pulse)},20,${0.7+0.3*pulse})`); g2.addColorStop(1,"rgba(0,0,0,0)");
          ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(lx,bedY+13,6,0,Math.PI*2); ctx.fill();
        }
        ctx.font="7px monospace"; ctx.fillStyle="rgba(251,120,40,0.4)"; ctx.textAlign="right";
        ctx.fillText("BED 60°C  ●  HEATING", W-24, H-8); ctx.textAlign="left"; }
      ctx.restore();
    }

    // ── Gantry ────────────────────────────────────────────────────────────────
    function drawGantry(W: number, ganY: number, nozX: number, alpha: number) {
      if (alpha<=0) return;
      ctx.save(); ctx.globalAlpha=alpha;
      const g=ctx.createLinearGradient(0,ganY-7,0,ganY+7);
      g.addColorStop(0,"#28283c"); g.addColorStop(0.5,"#18182a"); g.addColorStop(1,"#0e0e1c");
      ctx.fillStyle=g; ctx.fillRect(20,ganY-7,W-40,14);
      ctx.strokeStyle="rgba(251,130,40,0.38)"; ctx.lineWidth=0.8;
      ctx.beginPath(); ctx.moveTo(20,ganY-7); ctx.lineTo(W-20,ganY-7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(20,ganY+7); ctx.lineTo(W-20,ganY+7); ctx.stroke();
      const cW=28,cH=16,cx=nozX-cW/2,cy=ganY-cH/2;
      const cg=ctx.createLinearGradient(cx,cy,cx+cW,cy+cH);
      cg.addColorStop(0,"#2e2e42"); cg.addColorStop(1,"#1a1a28");
      ctx.fillStyle=cg; ctx.fillRect(cx,cy,cW,cH);
      ctx.strokeStyle="rgba(251,120,40,0.45)"; ctx.lineWidth=1; ctx.strokeRect(cx,cy,cW,cH);
      ctx.restore();
    }

    // ── Nozzle ────────────────────────────────────────────────────────────────
    function drawNozzle(nozX: number, nozY: number, ganY: number, ext: boolean, ts: number) {
      ctx.save();
      const hsY=ganY+14, hsW=16, hsH=14, hsx=nozX-hsW/2;
      for (let fi=0;fi<3;fi++){
        ctx.fillStyle=fi%2===0?"#1c1c2e":"#141420";
        ctx.fillRect(hsx-(fi%2===0?2:0), hsY+fi*(hsH/3), hsW+(fi%2===0?4:0), hsH/3);
      }
      const hbY=hsY+hsH, hbW=12, hbH=10, hbx=nozX-hbW/2, intensity=ext?0.8:0.3;
      const hbg=ctx.createLinearGradient(hbx,hbY,hbx+hbW,hbY+hbH);
      hbg.addColorStop(0,`rgba(190,55,12,${intensity})`); hbg.addColorStop(1,`rgba(90,22,5,${intensity})`);
      ctx.fillStyle=hbg; ctx.fillRect(hbx,hbY,hbW,hbH);
      ctx.strokeStyle="rgba(251,80,20,0.5)"; ctx.lineWidth=0.9; ctx.strokeRect(hbx,hbY,hbW,hbH);
      if (ext){
        const hg=ctx.createRadialGradient(nozX,hbY+hbH/2,0,nozX,hbY+hbH/2,22);
        hg.addColorStop(0,"rgba(200,80,20,0.15)"); hg.addColorStop(1,"rgba(0,0,0,0)");
        ctx.fillStyle=hg; ctx.fillRect(nozX-26,hbY-6,52,24);
      }
      const ncY=hbY+hbH, ncH=10;
      ctx.beginPath();
      ctx.moveTo(nozX-6,ncY); ctx.lineTo(nozX+6,ncY);
      ctx.lineTo(nozX+1.5,ncY+ncH); ctx.lineTo(nozX-1.5,ncY+ncH); ctx.closePath();
      const ncg=ctx.createLinearGradient(0,ncY,0,ncY+ncH); ncg.addColorStop(0,"#1c1c2c"); ncg.addColorStop(1,"#0c0c16");
      ctx.fillStyle=ncg; ctx.fill(); ctx.strokeStyle="rgba(251,100,30,0.5)"; ctx.lineWidth=0.9; ctx.stroke();
      if (ext){
        const pulse=0.82+0.18*Math.sin(ts*0.022);
        const ng=ctx.createRadialGradient(nozX,nozY,0,nozX,nozY,16*pulse);
        ng.addColorStop(0,"rgba(255,235,120,1)"); ng.addColorStop(0.22,"rgba(255,145,30,0.8)");
        ng.addColorStop(0.7,"rgba(255,60,0,0.2)"); ng.addColorStop(1,"rgba(0,0,0,0)");
        ctx.fillStyle=ng; ctx.beginPath(); ctx.arc(nozX,nozY,16*pulse,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(nozX,nozY,2.5,0,Math.PI*2); ctx.fillStyle="rgba(255,255,200,1)"; ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(nozX,nozY,2,0,Math.PI*2); ctx.fillStyle="rgba(190,90,30,0.5)"; ctx.fill();
      }
      ctx.restore();
    }

    // ── Box revealed BOTTOM-UP ─────────────────────────────────────────────────
    function drawPrintedBox(bx: number, by: number, bw: number, bh: number, scanY: number, layerH: number) {
      const revealed = clamp((by + bh) - scanY, 0, bh);
      if (revealed <= 0) return;
      const clipTop = by + bh - revealed;
      ctx.save();
      ctx.beginPath(); ctx.rect(bx, clipTop, bw, revealed); ctx.clip();
      // Infill stripes
      ctx.strokeStyle = "rgba(251,100,30,0.07)"; ctx.lineWidth = 0.6;
      for (let ly = by + bh; ly >= clipTop; ly -= layerH) {
        ctx.beginPath(); ctx.moveTo(bx+1, ly); ctx.lineTo(bx+bw-1, ly); ctx.stroke();
      }
      // Border
      ctx.shadowColor = "rgba(251,140,40,0.55)"; ctx.shadowBlur = 9;
      ctx.strokeStyle = "rgba(255,165,55,0.88)"; ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.shadowBlur = 0;
      // Corner brackets
      const SZ = 9;
      const corners: [number,number][] = [[bx,by],[bx+bw,by],[bx+bw,by+bh],[bx,by+bh]];
      const dirs: [number,number][][] = [[[1,0],[0,1]],[[-1,0],[0,1]],[[-1,0],[0,-1]],[[1,0],[0,-1]]];
      corners.forEach(([cx2,cy2], i) => {
        if (revealed < (i < 2 ? bh - 4 : 4)) return;
        ctx.strokeStyle = "rgba(255,200,80,0.75)"; ctx.lineWidth = 1.5;
        for (const [dx,dy] of dirs[i]) {
          ctx.beginPath(); ctx.moveTo(cx2,cy2); ctx.lineTo(cx2+dx*SZ, cy2+dy*SZ); ctx.stroke();
        }
      });
      ctx.restore();
    }

    // ── Main loop ──────────────────────────────────────────────────────────────
    const draw = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const t = (ts - startRef.current) / 1000;

      const W = canvas.width, H = canvas.height;
      if (!W || !H) { animRef.current = requestAnimationFrame(draw); return; }

      const LX=W*BL.lf, LY=H*BL.tf, LW=W*BL.wf, LH=H*BL.hf;
      const CX=W*BC.lf, CY=H*BC.tf, CW=W*BC.wf, CH=H*BC.hf;
      const RX=W*BR.lf, RY=H*BR.tf, RW=W*BR.wf, RH=H*BR.hf;

      const topY    = Math.min(LY, CY, RY);
      const bottomY = Math.max(LY+LH, CY+CH, RY+RH);
      const totalH  = bottomY - topY;

      const printT   = Math.max(0, t - 0.3);
      const progress = clamp(printT / PRINT_DURATION, 0, 1);
      // scanY moves from BOTTOM up to TOP
      const scanY   = bottomY - progress * totalH;
      const layerH  = totalH / (PRINT_DURATION * SWEEP_HZ);

      // Nozzle X — sweeps while printing, parks when done
      const xLeft = 28, xRight = W - 28;
      let nozX: number;
      if (progress >= 1) {
        nozX = xLeft;
      } else {
        const sweeps = printT * SWEEP_HZ * 2;
        const sFrac  = sweeps - Math.floor(sweeps);
        nozX = Math.floor(sweeps) % 2 === 0
          ? lerp(xLeft, xRight, sFrac)
          : lerp(xRight, xLeft, sFrac);
      }

      const ext = progress < 1 && (
        (nozX>=LX && nozX<=LX+LW && scanY>=LY && scanY<=LY+LH) ||
        (nozX>=CX && nozX<=CX+CW && scanY>=CY && scanY<=CY+CH) ||
        (nozX>=RX && nozX<=RX+RW && scanY>=RY && scanY<=RY+RH)
      );

      if (progress >= 1 && !allDone.current) { allDone.current = true; setShowReplay(true); }

      // ── DOM: clip-path synced to scanY — entire panel reveals as one object ─
      // clip-path inset(top% 0 0 0): top% = how much to clip from the top
      // When scanY is at box bottom → clip 100% (nothing shown)
      // When scanY is at box top   → clip 0%  (fully shown)
      const syncClip = (div: HTMLDivElement | null, ty: number, th: number) => {
        if (!div) return;
        const revealed   = clamp((ty + th - scanY) / th, 0, 1); // 0→1 bottom-up
        const topClipPct = ((1 - revealed) * 100).toFixed(2);
        div.style.clipPath      = `inset(${topClipPct}% 0px 0px 0px)`;
        div.style.pointerEvents = revealed >= 0.9 ? "auto" : "none";
      };
      syncClip(leftDivRef.current,   LY, LH);
      syncClip(centerDivRef.current, CY, CH);
      syncClip(rightDivRef.current,  RY, RH);

      // ── Draw ──────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#020209"; ctx.fillRect(0, 0, W, H);
      const bg = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.65);
      bg.addColorStop(0,"rgba(251,100,30,0.04)"); bg.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

      drawFrame(W, H, clamp(t/0.3,0,1), ts);

      drawPrintedBox(LX, LY, LW, LH, scanY, layerH);
      drawPrintedBox(CX, CY, CW, CH, scanY, layerH);
      drawPrintedBox(RX, RY, RW, RH, scanY, layerH);

      // Scan-line glow at print frontier
      if (progress < 1) {
        for (const [bx2,by2,bw2,bh2] of [[LX,LY,LW,LH],[CX,CY,CW,CH],[RX,RY,RW,RH]] as [number,number,number,number][]) {
          if (scanY < by2 || scanY > by2+bh2) continue;
          const sg = ctx.createLinearGradient(0, scanY-4, 0, scanY+16);
          sg.addColorStop(0,"rgba(255,160,50,0.14)");
          sg.addColorStop(0.4,"rgba(255,100,30,0.07)");
          sg.addColorStop(1,"rgba(0,0,0,0)");
          ctx.fillStyle=sg; ctx.fillRect(bx2, scanY-4, bw2, 20);
        }
      }

      const ganY     = scanY - NOZZLE_H;
      const nozAlpha = clamp((t-0.15)/0.2, 0, 1);

      // Trail
      const trail = trailRef.current;
      if (progress < 1) {
        trail.push({ x: nozX, y: scanY });
        if (trail.length > 18) trail.shift();
      } else {
        if (trail.length > 0) trail.shift();
      }
      trail.forEach((pt, i) => {
        const a = (i/trail.length)*0.3;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 1.2+(i/trail.length)*2, 0, Math.PI*2);
        ctx.fillStyle=`rgba(255,155,45,${a})`; ctx.fill();
      });

      drawGantry(W, ganY, nozX, nozAlpha);
      if (nozAlpha > 0) {
        ctx.save(); ctx.globalAlpha=nozAlpha;
        drawNozzle(nozX, scanY, ganY, ext, ts);
        ctx.restore();
      }

      // Particles
      if (ext && nozAlpha > 0.5) {
        if (Math.random()<0.18) sparks.push({x:nozX,y:scanY,vx:(Math.random()-0.5)*2.5,vy:-(Math.random()*1.8),life:0,max:12+Math.random()*20});
        if (Math.random()<0.22) vapors.push({x:nozX+(Math.random()-0.5)*4,y:scanY-2,vx:(Math.random()-0.5)*0.3,vy:-(0.3+Math.random()*0.5),life:0,max:28+Math.random()*24});
      }
      for (let i=sparks.length-1;i>=0;i--){
        const s=sparks[i]; s.x+=s.vx;s.y+=s.vy;s.vy+=0.1;s.life++;
        if(s.life>=s.max){sparks.splice(i,1);continue;}
        ctx.beginPath();ctx.arc(s.x,s.y,1.5,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,${Math.round(140+110*(1-s.life/s.max))},40,${(1-s.life/s.max)*0.9})`;ctx.fill();
      }
      for (let i=vapors.length-1;i>=0;i--){
        const v=vapors[i]; v.x+=v.vx;v.y+=v.vy;v.vx+=(Math.random()-0.5)*0.04;v.life++;
        if(v.life>=v.max){vapors.splice(i,1);continue;}
        ctx.beginPath();ctx.arc(v.x,v.y,1+v.life*0.04,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,160,80,${(1-v.life/v.max)*0.18})`;ctx.fill();
      }

      // HUD
      if (t > 0.3) {
        ctx.save(); ctx.globalAlpha=clamp((t-0.3)/0.3,0,1);
        const pct=Math.round(progress*100), nozTemp=210+Math.round(Math.sin(ts*0.002)*3);
        ctx.font="7px monospace";
        ctx.fillStyle="rgba(251,140,40,0.5)";
        ctx.fillText(`◈ ${progress<1?`PRINTING  ${pct}%`:"PRINT COMPLETE  ✓"}`, 28, H-30);
        ctx.fillStyle="rgba(251,120,40,0.32)";
        ctx.fillText(`NOZZLE ${nozTemp}°C   LAYER ${Math.round(layerH)}px   X:${Math.round(nozX)}  Y:${Math.round(scanY)}`, 28, H-19);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setOk(""); setBusy(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) { setErr(error.message); setBusy(false); return; }
      router.replace("/");
    } else {
      const { error } = await supabase.auth.signUp({ email, password: pass, options: { data: { full_name: name } } });
      if (error) { setErr(error.message); setBusy(false); return; }
      setOk("Account created — check your email, then sign in."); setMode("signin");
    }
    setBusy(false);
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020209]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* ─── Left panel ───────────────────────────────────────────────────────
          clip-path is controlled by the canvas loop — all content reveals
          as one object, perfectly synced with the orange box border.        */}
      <div ref={leftDivRef} className="absolute hidden lg:flex flex-col"
        style={{ left:`${BL.lf*100}vw`, top:`${BL.tf*100}vh`, width:`${BL.wf*100}vw`, height:`${BL.hf*100}vh`,
          padding:"clamp(16px,2vw,28px)",
          clipPath:"inset(100% 0px 0px 0px)", pointerEvents:"none" }}>

        {/* Label */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse flex-shrink-0"/>
          <span className="font-mono tracking-widest uppercase text-orange-400 font-semibold text-[11px]">What Is Starscraft?</span>
        </div>

        {/* Headline */}
        <h2 className="text-white font-black leading-tight mb-3 text-xl">
          Custom 3D Printing,<br/><span className="text-orange-400">Simplified.</span>
        </h2>

        {/* Sub */}
        <p className="text-white/70 leading-relaxed mb-5 text-sm">
          Bring your ideas to life — upload a model, choose your specs, and we handle the rest.
        </p>

        {/* Divider */}
        <div className="w-8 h-px bg-orange-500/40 mb-4"/>

        {/* Feature list */}
        <div className="flex flex-col gap-3">
          {[
            ["📁", "Upload any STL file"],
            ["🎨", "Pick color & material"],
            ["📦", "Order 1 to 1,000+ units"],
            ["📡", "Optional NFC chip embed"],
            ["🚀", "Fast, tracked delivery"],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 text-base">
                {icon}
              </div>
              <span className="text-white/80 font-medium text-sm">{text}</span>
            </div>
          ))}
        </div>

        {/* Bottom tag */}
        <div className="mt-auto pt-4 border-t border-white/10">
          <p className="text-orange-400/60 font-mono text-[10px] tracking-widest">
            HOBBYIST · ENGINEER · ENTREPRENEUR
          </p>
        </div>
      </div>

      {/* ─── Center login card ────────────────────────────────────────────────── */}
      <div ref={centerDivRef} className="absolute flex flex-col justify-start"
        style={{ left:`${BC.lf*100}vw`, top:`${BC.tf*100}vh`, width:`${BC.wf*100}vw`, height:`${BC.hf*100}vh`,
          padding:"clamp(16px,2.2vw,28px)", paddingTop:"clamp(18px,2.5vw,32px)",
          clipPath:"inset(100% 0px 0px 0px)", pointerEvents:"none" }}>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded border border-orange-500/60 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-sm"/>
          </div>
          <span className="text-xs font-black tracking-[0.2em] uppercase text-orange-400">Starscraft</span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
            <span className="text-[9px] font-mono text-white/25 tracking-widest">ONLINE</span>
          </div>
        </div>

        <h1 className="font-bold text-white mb-1" style={{fontSize:"clamp(15px,1.6vw,24px)"}}>
          {mode==="signin"?"Welcome back":"Create account"}
        </h1>
        <p className="text-white/30 mb-5" style={{fontSize:"clamp(9px,0.78vw,12px)"}}>
          {mode==="signin"?"Sign in to submit quotes and track your orders.":"Join Starscraft to get custom 3D prints made."}
        </p>

        <div className="flex rounded-lg overflow-hidden border border-white/[0.07] mb-4 bg-white/[0.02]">
          {(["signin","signup"] as Mode[]).map(m=>(
            <button key={m} onClick={()=>{setMode(m);setErr("");setOk("");}}
              className={`flex-1 py-2 font-mono tracking-widest uppercase transition-all ${mode===m?"bg-orange-500/20 text-orange-400":"text-white/20 hover:text-white/40"}`}
              style={{fontSize:"clamp(8px,0.72vw,11px)"}}>
              {m==="signin"?"Sign In":"Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode==="signup"&&(
            <input type="text" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-orange-400/50 transition-colors placeholder:text-white/20"/>
          )}
          <input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-orange-400/50 transition-colors placeholder:text-white/20"/>
          <input type="password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} required
            autoComplete={mode==="signin"?"current-password":"new-password"}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-orange-400/50 transition-colors placeholder:text-white/20"/>
          {err&&<p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">⚠ {err}</p>}
          {ok &&<p className="text-green-400 text-xs bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">✓ {ok}</p>}
          <button type="submit" disabled={busy}
            className="relative w-full py-2.5 font-bold tracking-widest uppercase text-white rounded-lg overflow-hidden transition-all disabled:opacity-50 group"
            style={{fontSize:"clamp(9px,0.78vw,12px)",background:"linear-gradient(135deg,#f97316,#c2410c)",boxShadow:"0 0 40px rgba(249,115,22,0.3)"}}>
            <span className="relative z-10">{busy?"Processing…":mode==="signin"?"Sign In":"Create Account"}</span>
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"/>
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-white/[0.05] text-center">
          <p style={{fontSize:"clamp(8px,0.72vw,11px)"}} className="text-white/20">
            {mode==="signin"
              ?<><span>No account? </span><button onClick={()=>{setMode("signup");setErr("");}} className="text-orange-400/60 hover:text-orange-400 transition-colors">Register free</button></>
              :<><span>Have an account? </span><button onClick={()=>{setMode("signin");setErr("");}} className="text-orange-400/60 hover:text-orange-400 transition-colors">Sign in</button></>}
          </p>
        </div>
      </div>

      {/* ─── Right panel ──────────────────────────────────────────────────────── */}
      <div ref={rightDivRef} className="absolute hidden lg:flex flex-col"
        style={{ left:`${BR.lf*100}vw`, top:`${BR.tf*100}vh`, width:`${BR.wf*100}vw`, height:`${BR.hf*100}vh`,
          padding:"clamp(16px,2vw,28px)",
          clipPath:"inset(100% 0px 0px 0px)", pointerEvents:"none" }}>

        {/* Label */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse flex-shrink-0"/>
          <span className="font-mono tracking-widest uppercase text-orange-400 font-semibold text-[11px]">How It Works</span>
        </div>

        {/* Headline */}
        <h2 className="text-white font-black leading-tight mb-3 text-xl">
          File to Front Door.<br/><span className="text-orange-400">5 Simple Steps.</span>
        </h2>

        {/* Sub */}
        <p className="text-white/70 leading-relaxed mb-5 text-sm">
          From quote to delivery — transparent, trackable, and built for quality.
        </p>

        {/* Divider */}
        <div className="w-8 h-px bg-orange-500/40 mb-4"/>

        {/* Steps */}
        <div className="flex flex-col gap-3.5">
          {[
            ["01", "Submit your STL + quote request"],
            ["02", "We review, price & approve"],
            ["03", "Watch live time-lapses as we print"],
            ["04", "Quality check before it ships"],
            ["05", "Full tracking, fast delivery"],
          ].map(([n, text]) => (
            <div key={n} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center">
                <span className="font-black text-orange-400 text-xs">{n}</span>
              </div>
              <span className="text-white/80 font-medium text-sm leading-snug">{text}</span>
            </div>
          ))}
        </div>

        {/* Bottom tag */}
        <div className="mt-auto pt-4 border-t border-white/10">
          <p className="text-orange-400/60 font-mono text-[10px] tracking-widest">
            PRECISION FDM · LAYER BY LAYER · EVERY TIME
          </p>
        </div>
      </div>

      {/* ─── Replay ───────────────────────────────────────────────────────────── */}
      <button onClick={replay}
        className="absolute bottom-7 right-8 flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-400 font-mono tracking-widest hover:bg-orange-500/20 hover:border-orange-400 transition-all z-50"
        style={{ fontSize:"clamp(8px,0.72vw,11px)", opacity:showReplay?1:0, pointerEvents:showReplay?"auto":"none",
          transition:"opacity 0.8s ease, background 0.2s, border-color 0.2s" }}>
        <span style={{fontSize:"15px"}}>↺</span> REPLAY
      </button>
    </div>
  );
}
