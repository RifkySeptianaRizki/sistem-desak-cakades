export default function EsportsTitle() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 px-4">
      <div className="relative flex flex-col items-center text-center select-none">

        {/* Warm Backlight Aura (static soft warm glow behind text) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[600px] md:w-[800px] h-[160px] sm:h-[260px] bg-gradient-to-r from-amber-900/20 via-amber-700/25 to-amber-900/20 rounded-full -z-10 blur-3xl opacity-60" />

        {/* Main Title Block */}
        <div className="relative">

          {/* Stacked Title: DESAK on top, CAKADES below */}
          <div className="relative">
            <h1 className="flex flex-col items-center leading-[0.94] select-none">

              {/* D E S A K */}
              <span
                className="text-[85px] sm:text-[130px] md:text-[170px] lg:text-[210px] xl:text-[230px] uppercase filter drop-shadow-[0_4px_25px_rgba(0,0,0,0.95)] drop-shadow-[0_0_35px_rgba(255,200,100,0.25)]"
                style={{
                  fontFamily: "'Albertus Nova', 'Albertus', serif",
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: '#ffffff',
                  textShadow: '0 0 20px rgba(255, 255, 255, 0.85), 0 0 45px rgba(251, 191, 36, 0.35), 0 4px 25px rgba(0, 0, 0, 0.95)',
                }}
              >
                DESAK
              </span>

              {/* C A K A D E S */}
              <span
                className="text-[70px] sm:text-[108px] md:text-[142px] lg:text-[175px] xl:text-[192px] uppercase filter drop-shadow-[0_4px_25px_rgba(0,0,0,0.95)] drop-shadow-[0_0_35px_rgba(255,200,100,0.25)]"
                style={{
                  fontFamily: "'Albertus Nova', 'Albertus', serif",
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  color: '#ffffff',
                  textShadow: '0 0 20px rgba(255, 255, 255, 0.85), 0 0 45px rgba(251, 191, 36, 0.35), 0 4px 25px rgba(0, 0, 0, 0.95)',
                }}
              >
                CAKADES
              </span>
            </h1>
          </div>
        </div>

        {/* Bottom Decorative Line Divider (Static) */}
        <div className="mt-5 sm:mt-6 flex items-center gap-3 sm:gap-5 w-full max-w-[320px] sm:max-w-xl opacity-85">
          {/* Left Line */}
          <div className="flex-1 h-[1.5px] bg-gradient-to-r from-transparent to-amber-400/80" />
          {/* Center Diamond */}
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rotate-45 bg-amber-300/90 shadow-[0_0_10px_rgba(251,191,36,0.7)]" />
          {/* Right Line */}
          <div className="flex-1 h-[1.5px] bg-gradient-to-l from-transparent to-amber-400/80" />
        </div>

      </div>
    </div>
  )
}
