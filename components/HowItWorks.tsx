const steps = [
  {
    number: "01",
    code: "NAVIGATE",
    title: "Go to MakerWorld",
    description: "Head to makerworld.com and browse thousands of free 3D models — toys, tools, décor, and more.",
    link: { label: "makerworld.com →", href: "https://makerworld.com" },
  },
  {
    number: "02",
    code: "SELECT",
    title: "Pick your model",
    description: "Find the item you want printed. Check the model page for size and detail previews.",
  },
  {
    number: "03",
    code: "COPY",
    title: "Copy the link",
    description: "Copy the full URL from your browser's address bar while on the model's page.",
  },
  {
    number: "04",
    code: "SUBMIT",
    title: "Submit your quote",
    description: "Paste the link into our form below. Choose your color, material, quantity, and any extras.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-28">
      {/* Header */}
      <div className="flex items-center gap-4 mb-16">
        <div className="neon-line flex-1" />
        <div className="flex flex-col items-center gap-1">
          <p className="text-orange-400/60 text-xs font-mono tracking-widest uppercase">Protocol</p>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">HOW IT WORKS</h2>
        </div>
        <div className="neon-line flex-1" />
      </div>

      {/* Steps */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, i) => (
          <div
            key={step.number}
            className="relative border border-white/8 bg-white/[0.02] hover:border-orange-500/30 hover:bg-orange-500/[0.03] transition-all duration-300 group p-6 flex flex-col gap-4"
            style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}
          >
            {/* Corner cut accent */}
            <div className="absolute top-0 right-0 w-3 h-3 border-b border-l border-orange-500/30 group-hover:border-orange-500/60 transition-colors" />

            {/* Step number */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-orange-400/40 tracking-widest">{step.code}</span>
              <span className="text-4xl font-black text-white/5 group-hover:text-orange-500/10 transition-colors leading-none">
                {step.number}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-4 w-4 h-px bg-orange-500/20 z-10" />
            )}

            <div className="w-6 h-px bg-orange-500/30 group-hover:w-10 transition-all duration-300" />

            <h3 className="text-base font-bold text-white/90 group-hover:text-white transition-colors">
              {step.title}
            </h3>
            <p className="text-white/40 text-sm leading-relaxed flex-1">{step.description}</p>
            {step.link && (
              <a
                href={step.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400/60 hover:text-orange-400 text-xs font-mono tracking-wide transition-colors mt-auto"
              >
                {step.link.label}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
