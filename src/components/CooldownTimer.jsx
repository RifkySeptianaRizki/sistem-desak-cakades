import { useState, useEffect, useRef } from 'react'
import { playSound, playBeepSeries, unlockAudio } from '../utils/audioManager'
import CandidateFrame from './CandidateFrame'
import EmberOverlay from './EmberOverlay'
import './CandidateBumper.css'

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
  const isCritical = timeLeft <= 10 && timeLeft > 0

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 select-none overflow-hidden">
      
      {/* Ambient Glow di Belakang Kotak Timer (Berubah Warna saat Kritis / Habis) */}
      <div
        className={`candidate-bumper__timer-ambient ${
          isFinished
            ? 'candidate-bumper__timer-ambient--finished'
            : isCritical
            ? 'candidate-bumper__timer-ambient--critical'
            : ''
        }`}
      />

      <section
        key={`timer-session-${mode}`}
        className="candidate-bumper"
        aria-label={`Time Keeper - ${getSessionTitle(mode)}`}
        aria-live="polite"
      >
        {/* Frame Panggung Luar dengan Ornamen Sudut Emas */}
        <CandidateFrame className="candidate-frame--stage" />
        <p className="candidate-bumper__event-title">PEMILIHAN KEPALA DESA BAGINDA 2026</p>

        {/* Header Desak Cakades Sebaris di Tengah & Wilayah di Pojok Kanan Atas */}
        <header className="candidate-bumper__header candidate-bumper__header--sambutan">
          <div className="candidate-bumper__brand candidate-bumper__brand--sambutan">
            DESAK<strong>CAKADES</strong>
          </div>
          
        </header>

        {/* Kotak Identitas Center (Sesuai Desain Sambutan & Bumper Calon) */}
        <div className={`candidate-bumper__identity candidate-bumper__identity--center candidate-bumper__identity--timer ${isFinished ? 'is-finished' : isCritical ? 'is-critical' : ''}`}>
          <CandidateFrame />

          {/* Judul Sesi Resmi */}
          <h2 className="candidate-bumper__sambutan-role candidate-bumper__sambutan-role--timer">
            {getSessionTitle(mode)}
          </h2>

          {/* Garis Emas Pembatas */}
          <div className="candidate-bumper__rule" />

          {/* Tampilan Timer (Menit : Detik) yang Megah dan Bersinar */}
          <div className={`candidate-bumper__timer-display ${isFinished ? 'is-finished' : isCritical ? 'is-critical' : ''}`}>
            <div
              key={isCritical && isRunning ? `pulse-${timeLeft}` : 'static-pulse'}
              className={`candidate-bumper__timer-pulse-wrap ${isCritical && isRunning ? 'animate-critical-tick' : ''}`}
            >
              <span className="candidate-bumper__timer-val">
                {String(minutes).padStart(2, '0')}
              </span>
              <span className={`candidate-bumper__timer-sep ${isRunning ? 'animate-pulse' : ''}`}>
                :
              </span>
              <span className="candidate-bumper__timer-val">
                {String(seconds).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Status Sesi saat Selesai atau Kritis (Peringatan Warna mulai Detik ke-10) */}
          {isFinished ? (
            <p className="candidate-bumper__sambutan-motto candidate-bumper__timer-motto--finished">
              WAKTU TELAH HABIS
            </p>
          ) : isCritical ? (
            <p className="candidate-bumper__sambutan-motto candidate-bumper__timer-motto--critical">
              PERINGATAN: SISA WAKTU 10 DETIK TERAKHIR
            </p>
          ) : null}
        </div>
      </section>

      {/* Partikel Bara Api Melayang di Depan Layar (Konsisten dengan Bumper Sambutan & Calon) */}
      <EmberOverlay />

      {/* ================= OVERLAY VISUAL COUNTDOWN 3-2-1 (Broadcast Debat Elegan) ================= */}
      {isPreCountdown && (
        <div className="countdown-overlay">
          {/* Subtle Ambient Glow Behind Dial */}
          <div className="countdown-dial-ambient" />

          {/* Central Broadcast Dial / Medallion */}
          <div className="countdown-dial-card">
            {/* SVG Circular Progress Ring */}
            <svg className="countdown-dial-svg" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="countdownGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="30%" stopColor="#fde68a" />
                  <stop offset="70%" stopColor="#d4af37" />
                  <stop offset="100%" stopColor="#92400e" />
                </linearGradient>
              </defs>
              {/* Subtle background track */}
              <circle
                className="countdown-svg-track"
                cx="100"
                cy="100"
                r="88"
              />
              {/* Dynamic sweeping progress stroke (resets every second with key) */}
              <circle
                key={preCountdownNum}
                className="countdown-svg-meter"
                cx="100"
                cy="100"
                r="88"
              />
            </svg>

            {/* Corner / Axis Precision Notches (Hairline gold marks at 12, 3, 6, 9 o'clock) */}
            <div className="countdown-dial-ticks">
              <span className="countdown-tick countdown-tick--top" />
              <span className="countdown-tick countdown-tick--right" />
              <span className="countdown-tick countdown-tick--bottom" />
              <span className="countdown-tick countdown-tick--left" />
            </div>

            {/* Inner Glass Core with Metallic Number */}
            <div className="countdown-dial-core">
              <span key={preCountdownNum} className="countdown-number">
                {preCountdownNum}
              </span>
            </div>
          </div>

          {/* Bottom Broadcast Label Badge */}
          <div className="countdown-info-box">
            <div className="countdown-status-badge">
              <span className="countdown-pulse-dot" />
              <span className="countdown-status-text">SESI SEGERA DIMULAI</span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
