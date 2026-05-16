"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { TimeLapse } from "@/lib/supabase";

export default function TimeLapses() {
  const [videos, setVideos] = useState<TimeLapse[]>([]);

  useEffect(() => {
    supabase.from("time_lapses").select("*").eq("visible", true).order("sort_order")
      .then(({ data }) => { if (data) setVideos(data); });
  }, []);

  return (
    <section id="timelapses" className="pb-24">
      {videos.length === 0 ? (
        <div className="relative border border-orange-500/10 bg-orange-500/[0.02] py-28 flex flex-col items-center gap-4">
          <div className="absolute top-0 left-0 w-6 h-6 corner-tl" />
          <div className="absolute top-0 right-0 w-6 h-6 corner-tr" />
          <div className="absolute bottom-0 left-0 w-6 h-6 corner-bl" />
          <div className="absolute bottom-0 right-0 w-6 h-6 corner-br" />
          <p className="text-orange-400/30 text-4xl font-black tracking-widest">[ ]</p>
          <p className="text-white/20 text-xs font-mono tracking-widest">// NO RECORDINGS YET — CHECK BACK SOON</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <div key={v.id}
              className="relative border border-white/8 bg-white/[0.02] hover:border-orange-500/30 transition-all group overflow-hidden"
              style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}>
              <div className="absolute top-0 right-0 w-3.5 h-3.5 border-b border-l border-orange-500/30 group-hover:border-orange-500/60 transition-colors z-10" />
              <div className="aspect-video w-full bg-black">
                {v.video_url.includes("youtube") || v.video_url.includes("youtu.be") ? (
                  <iframe src={toEmbed(v.video_url)} allow="autoplay; encrypted-media"
                    allowFullScreen className="w-full h-full" />
                ) : (
                  <video src={v.video_url} muted loop playsInline className="w-full h-full object-cover"
                    onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                    onMouseLeave={(e) => (e.currentTarget as HTMLVideoElement).pause()} />
                )}
              </div>
              <div className="p-4 border-t border-white/5">
                <p className="text-white/80 font-mono text-sm font-bold mb-1">{v.title}</p>
                {v.caption && <p className="text-white/35 text-xs">{v.caption}</p>}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {v.material_tag && (
                    <span className="text-xs px-2 py-0.5 border border-white/10 text-white/40 font-mono">{v.material_tag}</span>
                  )}
                  {v.color_tag && (
                    <span className="text-xs px-2 py-0.5 border border-orange-500/20 text-orange-400/60 font-mono">{v.color_tag}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function toEmbed(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=0` : url;
}
