import { useState, useEffect, useRef } from 'react'
import { playSound, playBeepSeries, unlockAudio } from '../utils/audioManager'

export default function CooldownTimer({ mode = 1, onBackToTitle }) {
  // Durasi default: Mode 1 = 5 Menit (300s) | Mode 2 = 1 Menit Setengah (90s) | Mode 3 = 3 Menit (180s) | Mode 4 = 2 Menit (120s)
  const getDefaultDuration = (m) => {
    if (m === 2) return 90 // 1 Menit Setengah (90 detik)
    if (m === 3) return 180
    if (m === 4) return 120
    return 300
  }

  const getSessionTitle = (m) => {
    if (m === 2) return 'Pengajuan Pertanyaan Panelis'
    if (m === 3) return 'Jawaban Cakades atas Pertanyaan Panelis'
    if (m === 4) return 'Closing Statement & Deklarasi Damai'
    return 'Pemaparan Visi, Misi & Program Unggulan'
  }

  const DEFAULT_SECONDS = getDefaultDuration(mode)
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_SECONDS)
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SECONDS)
  const [isRunning, setIsRunning] = useState(false)
  const [isPreCountdown, setIsPreCountdown] = useState(false)
  const [preCountdownNum, setPreCountdownNum] = useState(3)

  // Tracking milestone audio triggers
  const triggeredMilestones = useRef({
    threeMin: false,   // 3 menit (180s) -> Mode 1: BIP 1x
    oneMin: false,     // 1 menit (60s)  -> Mode 1: BIP 2x | Mode 3: BIP 1x
    thirtySec: false,  // 30 detik (30s) -> Mode 2: BIP 1x | Mode 3: BIP 2x
    fifteenSec: false, // 15 detik (15s) -> Mode 1: BIP 3x | Mode 2: BIP 2x | Mode 3: BIP 3x
    fiveSec: false,    // 5 detik (5s)   -> 5,4,3,2,1 interval
    zeroSec: false,    // 0 detik (00:00)-> GONG 1x
  })

  // Reset milestone suara
  const resetMilestones = () => {
    triggeredMilestones.current = {
      threeMin: false,
      oneMin: false,
      thirtySec: false,
      fifteenSec: false,
      fiveSec: false,
      zeroSec: false,
    }
  }

  // Reset timer
  const resetTimer = (newDuration = totalSeconds) => {
    setIsRunning(false)
    setIsPreCountdown(false)
    setTimeLeft(newDuration)
    resetMilestones()
  }

  // Reset otomatis saat beralih mode (Mode 1, Mode 2, Mode 3)
  useEffect(() => {
    const defaultSecs = getDefaultDuration(mode)
    setTotalSeconds(defaultSecs)
    setTimeLeft(defaultSecs)
    setIsRunning(false)
    setIsPreCountdown(false)
    resetMilestones()
  }, [mode])

  // Mulai sesi dengan hitung mundur visual 3-2-1
  const startSessionWithCountdown = () => {
    unlockAudio()
    if (isRunning) return

    if (timeLeft <= 0) {
      resetTimer(totalSeconds)
    }

    setIsPreCountdown(true)
    setPreCountdownNum(3)

    // Mainkan audio 3,2,1.mp3
    playSound('321')

    setTimeout(() => setPreCountdownNum(2), 1000)
    setTimeout(() => setPreCountdownNum(1), 2000)
    setTimeout(() => {
      setIsPreCountdown(false)
      setIsRunning(true)
    }, 3200)
  }

  // Toggle Space: Mulai / Jeda / Lanjut
  const handleSpaceAction = () => {
    unlockAudio()
    if (isPreCountdown) return

    if (timeLeft <= 0) {
      startSessionWithCountdown()
      return
    }

    if (!isRunning) {
      // Jika masih di awal (belum pernah jalan), mulai dengan 3-2-1
      if (timeLeft === totalSeconds) {
        startSessionWithCountdown()
      } else {
        // Resume langsung jika sebelumnya dipause
        setIsRunning(true)
      }
    } else {
      // Pause
      setIsRunning(false)
    }
  }

  // Timer Countdown Loop (1 detik per tick, bebas pusing tanpa milidetik)
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  // Cek Milestone Peringatan Waktu & Efek Suara
  useEffect(() => {
    if (!isRunning) return

    if (mode === 1) {
      // ===== MODE 1 (Sesi 1: Pemaparan Visi, Misi & Program Unggulan) =====
      // 1. Sisa Waktu 3 Menit (180 detik): Suara BIP 1 Kali
      if (timeLeft === 180 && !triggeredMilestones.current.threeMin) {
        if (totalSeconds >= 180) {
          triggeredMilestones.current.threeMin = true
          playBeepSeries(1)
        }
      }

      // 2. Sisa Waktu 1 Menit (60 detik): Suara BIP 2 Kali dengan jeda teratur (700ms)
      if (timeLeft === 60 && !triggeredMilestones.current.oneMin) {
        if (totalSeconds >= 60) {
          triggeredMilestones.current.oneMin = true
          playBeepSeries(2, 700)
        }
      }

      // 3. Sisa Waktu 15 Detik: Suara BIP 3 Kali dengan jeda teratur (700ms)
      if (timeLeft === 15 && !triggeredMilestones.current.fifteenSec) {
        if (totalSeconds >= 15) {
          triggeredMilestones.current.fifteenSec = true
          playBeepSeries(3, 700)
        }
      }
    } else if (mode === 2) {
      // ===== MODE 2 (Sesi 2: Pengajuan Pertanyaan Panelis - 1 Menit Setengah / 90 Detik) =====
      // 1. Sisa Waktu 30 Detik: Suara BIP 1 Kali
      if (timeLeft === 30 && !triggeredMilestones.current.thirtySec) {
        if (totalSeconds >= 30) {
          triggeredMilestones.current.thirtySec = true
          playBeepSeries(1)
        }
      }

      // 2. Sisa Waktu 15 Detik: Suara BIP 2 Kali dengan jeda teratur (700ms)
      if (timeLeft === 15 && !triggeredMilestones.current.fifteenSec) {
        if (totalSeconds >= 15) {
          triggeredMilestones.current.fifteenSec = true
          playBeepSeries(2, 700)
        }
      }
    } else if (mode === 3 || mode === 4) {
      // ===== MODE 3 & MODE 4 (Sesi 3 & Sesi 4: 1m BIP 1x, 30s BIP 2x, 15s BIP 3x) =====
      // 1. Sisa Waktu 1 Menit (60 detik): Suara BIP 1 Kali
      if (timeLeft === 60 && !triggeredMilestones.current.oneMin) {
        if (totalSeconds >= 60) {
          triggeredMilestones.current.oneMin = true
          playBeepSeries(1)
        }
      }

      // 2. Sisa Waktu 30 Detik (30 detik): Suara BIP 2 Kali dengan jeda teratur (700ms)
      if (timeLeft === 30 && !triggeredMilestones.current.thirtySec) {
        if (totalSeconds >= 30) {
          triggeredMilestones.current.thirtySec = true
          playBeepSeries(2, 700)
        }
      }

      // 3. Sisa Waktu 15 Detik (15 detik): Suara BIP 3 Kali dengan jeda teratur (700ms)
      if (timeLeft === 15 && !triggeredMilestones.current.fifteenSec) {
        if (totalSeconds >= 15) {
          triggeredMilestones.current.fifteenSec = true
          playBeepSeries(3, 700)
        }
      }
    }

    // ===== COMMON MILESTONES (Mode 1, Mode 2, Mode 3, Mode 4) =====
    // Sisa Waktu 5 Detik: Suara BIP Interval per Detik (5, 4, 3, 2, 1)
    if (timeLeft === 5 && !triggeredMilestones.current.fiveSec) {
      triggeredMilestones.current.fiveSec = true
      playSound('54321')
    }

    // Detik ke-0 (00:00): Suara GONG 1 Kali
    if (timeLeft === 0 && !triggeredMilestones.current.zeroSec) {
      triggeredMilestones.current.zeroSec = true
      setIsRunning(false)
      playSound('gong')
    }
  }, [timeLeft, isRunning, totalSeconds, mode])

  // Navigasi & Kontrol Murni via Keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // Spasi: Mulai / Jeda / Lanjut
      if (e.code === 'Space') {
        e.preventDefault()
        handleSpaceAction()
        return
      }

      // R: Reset ke 5 menit (atau waktu awal)
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        resetTimer(totalSeconds)
        return
      }

      // Panah Kanan (Row Kanan): Skip waktu maju 10 detik (sisa waktu berkurang 10s)
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        const next = Math.max(0, timeLeft - 10)
        setTimeLeft(next)
        // Cek jika skip langsung ke 0
        if (next === 0 && !triggeredMilestones.current.zeroSec) {
          triggeredMilestones.current.zeroSec = true
          setIsRunning(false)
          playSound('gong')
        }
        return
      }

      // Panah Kiri (Row Kiri): Skip waktu mundur 10 detik (sisa waktu bertambah 10s)
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const next = timeLeft + 10
        setTimeLeft(next)
        return
      }

      // Esc: Kembali ke Mode 0 (Judul Standby)
      if (e.key === 'Escape') {
        e.preventDefault()
        if (onBackToTitle) onBackToTitle()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRunning, timeLeft, totalSeconds, isPreCountdown])

  // Hitung Menit dan Detik saja (Tanpa Milidetik)
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const isFinished = timeLeft === 0
  const isCritical = timeLeft <= 5 && timeLeft > 0

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 px-4 select-none">
      
      {/* Ambient Glow di Belakang Timer */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[650px] md:w-[900px] h-[220px] sm:h-[350px] rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isFinished
            ? 'bg-red-700/35'
            : isCritical
            ? 'bg-amber-600/35 animate-pulse'
            : 'bg-amber-900/15'
        }`}
      />

      <div className="relative flex flex-col items-center z-20 w-full max-w-[1400px]">
        
        {/* ================= TULISAN DESAK CAKADES BESAR DI ATAS (FONT ALBERTUS, SPACING LEBIH RAPAT & BERCAHAYA) ================= */}
        <div className="mb-5 sm:mb-7 md:mb-9 lg:mb-11 flex items-center justify-center px-4 text-center select-none">
          <h1
            className="text-[36px] sm:text-[56px] md:text-[74px] lg:text-[92px] xl:text-[102px] uppercase leading-none text-white tracking-[0.03em] sm:tracking-[0.05em] select-none text-center"
            style={{
              fontFamily: "'Albertus Nova', 'Albertus', 'Marcellus', serif",
              fontWeight: 700,
              textShadow:
                '0 0 12px rgba(255, 255, 255, 0.85), 0 0 25px rgba(255, 255, 255, 0.5), 0 0 45px rgba(255, 255, 255, 0.25), 0 4px 20px rgba(0, 0, 0, 0.95)',
            }}
          >
            DESAK CAKADES
          </h1>
        </div>

        {/* ================= SATU KOTAK TUNGGAL LIQUID GLASS MEWAH & RAMPING (Menit : Detik) ================= */}
        <div className="w-full max-w-[360px] sm:max-w-[570px] md:max-w-[760px] lg:max-w-[900px] xl:max-w-[960px]">
          <div className="relative w-full h-[155px] sm:h-[230px] md:h-[295px] lg:h-[355px] xl:h-[375px] rounded-[28px] sm:rounded-[38px] md:rounded-[46px] lg:rounded-[52px] bg-gradient-to-b from-white/45 via-white/10 to-white/20 p-[2.5px] sm:p-[3px] shadow-[0_40px_110px_-20px_rgba(0,0,0,0.95),0_0_60px_rgba(255,200,120,0.08),0_0_25px_rgba(255,255,255,0.06),inset_0_2px_4px_rgba(255,255,255,0.65),inset_0_-2px_4px_rgba(0,0,0,0.85)] backdrop-blur-3xl select-none">
          
          {/* Liquid Glass Chamber */}
          <div className="relative w-full h-full rounded-[25px] sm:rounded-[35px] md:rounded-[43px] lg:rounded-[49px] overflow-hidden flex items-center justify-center bg-gradient-to-b from-white/[0.14] via-black/55 to-black/85 backdrop-blur-3xl border border-white/20">
            
            {/* Curved Specular Liquid Glass Top Highlight (Efek Cembung Kaca Cair) */}
            <div className="absolute inset-x-0 top-0 h-[48%] bg-gradient-to-b from-white/[0.30] via-white/[0.06] to-transparent pointer-events-none rounded-t-[25px] sm:rounded-t-[35px] md:rounded-t-[43px] lg:rounded-t-[49px] border-t border-white/55" />

            {/* Bottom Internal Refraction Arc (Refleksi Kaca Lengkung Bawah) */}
            <div className="absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t from-white/[0.12] via-white/[0.03] to-transparent pointer-events-none rounded-b-[25px] sm:rounded-b-[35px] md:rounded-b-[43px] lg:rounded-b-[49px] border-b border-white/25" />

            {/* Diagonal Liquid Fluid Light Beam (Kilau Refleksi Kaca Cair) */}
            <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent rotate-12 pointer-events-none" />

            {/* Subtle Internal Warm Liquid Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-2/3 bg-amber-500/[0.06] rounded-full blur-2xl pointer-events-none" />

            {/* Deep Ambient Edge Vignette (Tepi Kaca Tebal) */}
            <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] pointer-events-none rounded-[25px] sm:rounded-[35px] md:rounded-[43px] lg:rounded-[49px]" />

            {/* Tampilan Waktu: Menit : Detik dengan Font Technology-Bold (Center Presisi) */}
            <div className="relative flex items-center justify-center gap-1.5 sm:gap-4 md:gap-6 z-10 translate-y-2 sm:translate-y-3 md:translate-y-4 lg:translate-y-5">
              
              {/* Menit */}
              <span
                className="text-[112px] sm:text-[180px] md:text-[242px] lg:text-[300px] xl:text-[320px] text-white tracking-wider leading-none drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] drop-shadow-[0_0_35px_rgba(255,255,255,0.35)] select-none text-center"
                style={{
                  fontFamily: "'Technology-Bold', monospace",
                }}
              >
                {String(minutes).padStart(2, '0')}
              </span>

              {/* Titik Dua (Colon) */}
              <span
                className="text-[96px] sm:text-[156px] md:text-[212px] lg:text-[265px] xl:text-[285px] text-white/95 leading-none drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)] drop-shadow-[0_0_25px_rgba(255,255,255,0.35)] pb-2 sm:pb-3 select-none animate-pulse"
                style={{
                  fontFamily: "'Technology-Bold', monospace",
                }}
              >
                :
              </span>

              {/* Detik */}
              <span
                className="text-[112px] sm:text-[180px] md:text-[242px] lg:text-[300px] xl:text-[320px] text-white tracking-wider leading-none drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] drop-shadow-[0_0_35px_rgba(255,255,255,0.35)] select-none text-center"
                style={{
                  fontFamily: "'Technology-Bold', monospace",
                }}
              >
                {String(seconds).padStart(2, '0')}
              </span>

            </div>
          </div>
        </div>
      </div>

      {/* ================= TULISAN SESI DI BAWAH (HARUS SATU BARIS / NO WRAP) ================= */}
      <div className="mt-5 sm:mt-7 md:mt-9 lg:mt-11 flex items-center justify-center px-2 sm:px-4 text-center w-full select-none">
        <span
          className="whitespace-nowrap text-xs sm:text-base md:text-xl lg:text-2xl xl:text-[32px] text-white tracking-[0.08em] sm:tracking-[0.12em] md:tracking-[0.14em] uppercase leading-none select-none text-center"
          style={{
            fontFamily: "'Albertus Nova', 'Albertus', 'Marcellus', serif",
            fontWeight: 700,
            textShadow:
              '0 0 10px rgba(255, 255, 255, 0.7), 0 0 22px rgba(255, 255, 255, 0.4), 0 0 40px rgba(255, 255, 255, 0.15), 0 4px 18px rgba(0, 0, 0, 0.95)',
          }}
        >
          {getSessionTitle(mode)}
        </span>
      </div>
    </div>

      {/* ================= OVERLAY VISUAL COUNTDOWN 3-2-1 (Simpel & Bersih) ================= */}
      {isPreCountdown && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm z-50 pointer-events-none">
          <span
            key={preCountdownNum}
            className="text-[180px] sm:text-[260px] md:text-[340px] text-white tracking-widest leading-none drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] drop-shadow-[0_0_50px_rgba(255,255,255,0.25)] select-none"
            style={{
              fontFamily: "'Albertus Nova', 'Albertus', 'Marcellus', serif",
              fontWeight: 700,
            }}
          >
            {preCountdownNum}
          </span>
        </div>
      )}

    </div>
  )
}
