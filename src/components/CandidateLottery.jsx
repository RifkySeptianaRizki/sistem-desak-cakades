import { useState, useEffect, useRef } from 'react'
import {
  playSound,
  playShufflingSound,
  stopShufflingSound,
  unlockAudio,
  getPreloadedShufflingAudio,
} from '../utils/audioManager'
import EmberOverlay from './EmberOverlay'

// Import foto calon resmi dari assets
import fotoCalon1 from '../assets/1_trimmed.png'
import fotoCalon2 from '../assets/2_trimmed.png'
import fotoCalon3 from '../assets/3_trimmed.png'
import fotoCalon4 from '../assets/4_trimmed.png'

const CANDIDATES = [
  {
    id: 1,
    num: '01',
    name: 'HERU HERNAWAN',
    title: 'Calon Kepala Desa Nomor Urut 01',
    photo: fotoCalon1,
    position: 'jam-10', // Arah Jam 10 (Top-Left)
    angle: 214,
  },
  {
    id: 2,
    num: '02',
    name: 'ELAN SUKARLAN',
    title: 'Calon Kepala Desa Nomor Urut 02',
    photo: fotoCalon2,
    position: 'jam-2', // Arah Jam 2 (Top-Right)
    angle: 326,
  },
  {
    id: 3,
    num: '03',
    name: 'ADI ARISNADI N',
    title: 'Calon Kepala Desa Nomor Urut 03',
    photo: fotoCalon3,
    position: 'jam-5', // Arah Jam 5 (Bottom-Right)
    angle: 34,
  },
  {
    id: 4,
    num: '04',
    name: 'AHMAD GUSRAM N.H',
    title: 'Calon Kepala Desa Nomor Urut 04',
    photo: fotoCalon4,
    position: 'jam-8', // Arah Jam 8 (Bottom-Left)
    angle: 146,
  },
]

// Durasi putaran gacha: tepat 6 detik (6000ms) saat masih ada lebih dari 1 calon
const SPIN_DURATION_MS = 6000

// Parameter Posisi Kartu Nyerong Diagonal (Arah Jam 10, 2, 5, 8) - Didekatkan Sedikit ke Tengah
const DIST_X = 295 // Jarak horizontal diagonal dari tengah (px, digeser mendekat ke pusat)
const DIST_Y = 195 // Jarak vertikal diagonal dari tengah (px)

export default function CandidateLottery({ drawnIds = [], setDrawnIds, onBackToTitle }) {
  // Phase: 'idle' | 'spinning' | 'winner'
  const [phase, setPhase] = useState('idle')
  // ID calon pemenang putaran saat ini
  const [winnerId, setWinnerId] = useState(null)
  // Sudut rotasi jarum panah dalam derajat: default 270 menunjuk ke atas center ketika belum dipilih
  const [arrowAngle, setArrowAngle] = useState(270)
  // Modal konfirmasi reset
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const isSpinningRef = useRef(false)
  const animFrameRef = useRef(null)
  const currentAngleRef = useRef(270)

  useEffect(() => {
    currentAngleRef.current = arrowAngle
  }, [arrowAngle])

  useEffect(() => {
    // Preload audio di awal
    getPreloadedShufflingAudio()

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      stopShufflingSound()
    }
  }, [])

  // Calon yang masih tersedia
  const availableCandidates = CANDIDATES.filter((c) => !drawnIds.includes(c.id))
  const isAllDrawn = drawnIds.length >= CANDIDATES.length
  const winnerCandidate = CANDIDATES.find((c) => c.id === winnerId)

  // Memicu Modal Konfirmasi Reset
  const requestReset = () => {
    setShowResetConfirm(true)
  }

  // Konfirmasi Eksekusi Reset
  const confirmReset = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    stopShufflingSound()
    isSpinningRef.current = false
    if (setDrawnIds) setDrawnIds([])
    setWinnerId(null)
    setPhase('idle')
    setArrowAngle(270)
    setShowResetConfirm(false)
  }

  // Batalkan Reset
  const cancelReset = () => {
    setShowResetConfirm(false)
  }

  // Easing Kurva Putaran 6 Detik:
  // - 0% - 70% (0s - 4.2s): Jarum panah berputar kencang & dinamis
  // - 70% - 100% (4.2s - 6.0s): Deselerasi dramatis 1.8 detik, melambat anggun dan mendarat presisi di detik ke-6
  const getProgress = (t) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    const tSplit = 0.7 // 70% waktu berputar kencang
    const p = 2 // Quadratic deceleration
    const v0 = 1 / (tSplit + (1 - tSplit) / (p + 1)) // 1.25

    if (t <= tSplit) {
      return v0 * t
    } else {
      const u = (1 - t) / (1 - tSplit)
      return 1 - ((v0 * (1 - tSplit)) / (p + 1)) * Math.pow(u, p + 1)
    }
  }

  // Fungsi Memutar Undian: 100% Murni Gacha Acak
  const startRoll = () => {
    unlockAudio()
    if (isSpinningRef.current) return
    if (showResetConfirm) return

    // Ambil calon yang BELUM pernah terpilih
    const pool = CANDIDATES.filter((c) => !drawnIds.includes(c.id))

    // Jika semua sudah terpilih, tawarkan reset
    if (pool.length === 0) {
      requestReset()
      return
    }

    // ATURAN KHUSUS: KETIKA TINGGAL SISA 1 CALON -> LANGSUNG GONG SAJA TANPA UNDIAN LAGI!
    if (pool.length === 1) {
      const finalCandidate = pool[0]
      setArrowAngle(finalCandidate.angle)
      finalizeWinner(finalCandidate.id, finalCandidate.angle)
      return
    }

    // Jika masih ada 2 atau lebih calon -> Putar gacha selama 6 detik
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    isSpinningRef.current = true
    setPhase('spinning')
    setWinnerId(null)

    // Putar audio shuffling.mp3
    playShufflingSound(false)

    // Pilihan 100% Gacha Random murni
    const randIdx = Math.floor(Math.random() * pool.length)
    const targetCandidate = pool[randIdx]

    const startAngle = currentAngleRef.current
    const targetAngle = targetCandidate.angle // 270 (Top), 0 (Right), 90 (Bottom), 180 (Left)

    // Hitung sudut rotasi agar jarum panah berputar searah jarum jam dan mengunci di target
    const currentMod = ((startAngle % 360) + 360) % 360
    let delta = targetAngle - currentMod
    if (delta <= 0) delta += 360

    // Berputar minimal 16 putaran penuh dalam 6 detik
    const totalRotation = startAngle + 360 * 16 + delta
    let animStartTime = null

    const animateSpin = (now) => {
      if (!animStartTime) animStartTime = now

      const elapsed = now - animStartTime
      const t = Math.min(elapsed / SPIN_DURATION_MS, 1)
      const easedProgress = getProgress(t)

      const calculatedAngle = startAngle + (totalRotation - startAngle) * easedProgress
      setArrowAngle(calculatedAngle)

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animateSpin)
      } else {
        // Tepat 6 detik: mendarat presisi di calon terpilih!
        finalizeWinner(targetCandidate.id, totalRotation)
      }
    }

    animFrameRef.current = requestAnimationFrame(animateSpin)
  }

  // Selesai Mendarat di Pemenang (atau Langsung Gong untuk Calon Terakhir)
  const finalizeWinner = (winId, finalAngle) => {
    isSpinningRef.current = false
    stopShufflingSound()
    setArrowAngle(finalAngle)
    setWinnerId(winId)

    // Simpan calon terpilih (tidak bisa terpilih lagi)
    if (setDrawnIds) {
      setDrawnIds((prev) => (prev.includes(winId) ? prev : [...prev, winId]))
    }
    setPhase('winner')

    // 1 Dentuman Gong tegas dan berwibawa
    playSound('gong')
  }

  // Cek calon mana yang sedang ditunjuk oleh jarum panah saat ini (Sektor Diagonal Jam 10, 2, 5, 8)
  const getPointedCandidateId = () => {
    const modAngle = ((arrowAngle % 360) + 360) % 360
    // Kuadran Jam 10 (Top-Left): 180° - 270° (Calon 01)
    if (modAngle >= 180 && modAngle < 270) return 1
    // Kuadran Jam 2 (Top-Right): 270° - 360° (Calon 02)
    if (modAngle >= 270 && modAngle < 360) return 2
    // Kuadran Jam 5 (Bottom-Right): 0° - 90° (Calon 03)
    if (modAngle >= 0 && modAngle < 90) return 3
    // Kuadran Jam 8 (Bottom-Left): 90° - 180° (Calon 04)
    return 4
  }

  const currentPointedId = getPointedCandidateId()

  // Keyboard Shortcuts (Fungsi tetap aktif penuh lewat keyboard)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      // Modal Konfirmasi Reset terbuka:
      if (showResetConfirm) {
        if (e.key === 'Enter' || e.key === 'y' || e.key === 'Y') {
          e.preventDefault()
          confirmReset()
          return
        }
        if (e.key === 'Escape' || e.key === 'n' || e.key === 'N') {
          e.preventDefault()
          cancelReset()
          return
        }
        return
      }

      // Ctrl+R atau Cmd+R atau R: Buka Modal Reset
      if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        requestReset()
        return
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        requestReset()
        return
      }

      // Spasi: Putar gacha / Langsung Gong calon terakhir / Lanjut calon berikutnya
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        if (phase === 'spinning') return
        if (isAllDrawn) {
          requestReset()
          return
        }
        startRoll()
        return
      }

      // Esc: Kembali ke Home
      if (e.key === 'Escape') {
        e.preventDefault()
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        stopShufflingSound()
        if (onBackToTitle) onBackToTitle()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, drawnIds, isAllDrawn, showResetConfirm])

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none z-20 select-none overflow-hidden px-4 sm:px-8 pt-3 pb-3">
      {/* Ambient Radial Golden Glow */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] md:w-[1200px] h-[450px] md:h-[650px] rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          phase === 'winner'
            ? 'bg-amber-500/35 opacity-100 scale-110'
            : phase === 'spinning'
            ? 'bg-amber-600/30 opacity-95 animate-pulse'
            : 'bg-amber-800/20 opacity-60'
        }`}
      />


      {/* ================= 2. KONTEN TENGAH ================= */}
      {/* KONDISI A: SAAT PEMENANG TERPILIH -> ZOOM KE DEPAN FOTO & NAMA PEMENANG */}
      {phase === 'winner' && winnerCandidate ? (
        <div className="relative flex-1 w-full max-w-[1100px] flex items-center justify-center z-20 animate-zoom-forward min-h-0 my-auto">
          {/* Liquid Glass Showcase Frame Pemenang */}
          <div className="relative w-full aspect-[16/7.8] max-h-[58vh] min-h-[390px] rounded-[32px] sm:rounded-[40px] bg-gradient-to-b from-amber-300/40 via-amber-400/15 to-amber-500/25 p-[3px] shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_80px_rgba(251,191,36,0.45)] backdrop-blur-3xl overflow-hidden">
            <div className="relative w-full h-full rounded-[29px] sm:rounded-[37px] overflow-hidden bg-gradient-to-b from-white/[0.12] via-black/85 to-black flex items-center justify-between px-8 sm:px-14 md:px-18 lg:px-24 border border-amber-300/30">
              {/* Left Side: Detail Pemenang */}
              <div className="relative flex flex-col items-start text-left z-20 flex-1 max-w-[620px] py-4">
                {/* Lencana Pemenang Resmi */}
                <div className="mb-2">
                  <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-black font-extrabold text-xs sm:text-sm tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(251,191,36,0.9)] animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-black" />
                    <span>★ CALON TERPILIH UNTUK MENJAWAB ★</span>
                  </div>
                </div>

                {/* Nomor Urut & Kategori */}
                <div className="flex items-center gap-6 my-1">
                  <span
                    className="text-[85px] sm:text-[115px] md:text-[135px] font-black leading-none select-none text-white"
                    style={{
                      fontFamily: "'Albertus Nova', 'Albertus', serif",
                      fontWeight: 900,
                      textShadow:
                        '0 0 25px rgba(255, 255, 255, 1), 0 0 60px rgba(251, 191, 36, 0.95), 0 4px 25px rgba(0, 0, 0, 0.95)',
                    }}
                  >
                    {winnerCandidate.num}
                  </span>

                  <div className="flex flex-col justify-center">
                    <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-black/70 border border-white/20 mb-1 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]" />
                      <span className="text-xs text-amber-200 tracking-[0.2em] font-bold uppercase">
                        NOMOR URUT RESMI
                      </span>
                    </div>

                    <h2
                      className="text-lg sm:text-2xl md:text-3xl text-white uppercase tracking-[0.14em] font-extrabold leading-tight"
                      style={{ fontFamily: "'Albertus Nova', serif" }}
                    >
                      CALON KEPALA DESA
                    </h2>
                  </div>
                </div>

                {/* Pita Emas Pemisah */}
                <div className="my-2 flex items-center gap-4 w-full max-w-[460px] opacity-90">
                  <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                  <div className="w-2.5 h-2.5 rotate-45 bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,1)]" />
                  <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-amber-400 to-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                </div>

                {/* Nama Lengkap Calon Terpilih */}
                <h1
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] text-white uppercase tracking-[0.04em] leading-tight font-black select-none whitespace-nowrap"
                  style={{
                    fontFamily: "'Albertus Nova', 'Albertus', serif",
                    fontWeight: 800,
                    textShadow:
                      '0 0 20px rgba(255, 255, 255, 1), 0 0 45px rgba(251, 191, 36, 0.75), 0 4px 20px rgba(0, 0, 0, 0.95)',
                  }}
                >
                  {winnerCandidate.name}
                </h1>

                {/* Subtitle Wilayah */}
                <div
                  className="mt-2 flex items-center gap-2 text-amber-200/90 tracking-[0.16em] uppercase text-xs sm:text-sm font-semibold"
                  style={{ fontFamily: "'Albertus Nova', serif" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]" />
                  <span>DESA BAGINDA • KAB. SUMEDANG</span>
                </div>
              </div>

              {/* Right Side: Foto Calon Besar */}
              <div className="relative flex flex-col items-end justify-end flex-shrink-0 z-20 self-end h-[95%] max-h-[500px] w-[260px] sm:w-[320px] md:w-[390px]">
                <div className="absolute inset-0 bg-amber-400/35 rounded-full blur-3xl scale-105 pointer-events-none" />
                <img
                  src={winnerCandidate.photo}
                  alt={winnerCandidate.name}
                  className="h-full w-auto max-w-full object-contain object-bottom select-none drop-shadow-[0_20px_40px_rgba(251,191,36,0.5)]"
                  style={{
                    maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex-1 w-full flex items-center justify-center z-10 min-h-0 overflow-visible pointer-events-none">
          {/* ================= PUSAT ROULETTE / DIAL DENGAN JARUM PANAH BERPUTAR ================= */}
          <div
            className="absolute rounded-full z-20 flex items-center justify-center"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '140px',
              height: '140px',
            }}
          >
            {/* Piringan Dial Emas Mewah / Bezel Arloji Kompak */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-amber-400/25 via-black/95 to-black border-2 border-amber-400/60 shadow-[0_0_35px_rgba(251,191,36,0.35)] backdrop-blur-2xl flex items-center justify-center">
              {/* Garis Kompas & Radiasi Emas */}
              <div className="absolute w-[114px] h-[114px] rounded-full border border-amber-400/20 border-dashed" />
              <div className="absolute w-[86px] h-[86px] rounded-full border border-amber-400/15" />

              {/* 4 Penanda Arah Emas Menuju Card Calon (Diagonal Jam 10, Jam 2, Jam 5, Jam 8) */}
              {[214, 326, 34, 146].map((ang) => (
                <div
                  key={ang}
                  className="absolute pointer-events-none"
                  style={{
                    top: '50%',
                    left: '50%',
                    width: 0,
                    height: 0,
                    transform: `rotate(${ang}deg)`,
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 bg-amber-400 rotate-45 shadow-[0_0_6px_rgba(251,191,36,1)]"
                    style={{
                      transform: 'translate(53px, -50%) rotate(45deg)',
                    }}
                  />
                </div>
              ))}

              {/* Penanda Emas Atas Center (Posisi Default Jarum Sebelum Dipilih) */}
              <div
                className="absolute pointer-events-none"
                style={{
                  top: '50%',
                  left: '50%',
                  width: 0,
                  height: 0,
                  transform: 'rotate(270deg)',
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_6px_rgba(251,191,36,1)] border border-amber-400"
                  style={{
                    transform: 'translate(54px, -50%)',
                  }}
                />
              </div>
            </div>

            {/* ================= JARUM PANAH EMAS 3D DENGAN PUSAT ROTASI TEPAT DI (0,0) ================= */}
            <div
              className="absolute pointer-events-none z-30"
              style={{
                top: '50%',
                left: '50%',
                width: 0,
                height: 0,
                transform: `rotate(${arrowAngle}deg)`,
              }}
            >
              {/* SVG Jarum Panah Emas 3D: Dibuat Lebih Panjang (Ujung 112px), Berotasi Konsentris Sempurna */}
              <svg
                viewBox="-30 -20 160 40"
                className="select-none filter drop-shadow-[0_0_18px_rgba(251,191,36,1)]"
                style={{
                  position: 'absolute',
                  left: '-30px',
                  top: '-20px',
                  width: '160px',
                  height: '40px',
                }}
              >
                <defs>
                  {/* Gradien Emas Sisi Terang (Atas) */}
                  <linearGradient id="goldTopGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#b45309" />
                    <stop offset="40%" stopColor="#f59e0b" />
                    <stop offset="85%" stopColor="#fef08a" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>

                  {/* Gradien Emas Sisi Gelap / Bayangan (Bawah) */}
                  <linearGradient id="goldBottomGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#451a03" />
                    <stop offset="40%" stopColor="#92400e" />
                    <stop offset="85%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>

                  {/* Permata Merah Delima di Ekor Panah */}
                  <radialGradient id="rubyJewel" cx="40%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#fca5a5" />
                    <stop offset="50%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#7f1d1d" />
                  </radialGradient>
                </defs>

                {/* Ekor / Counterweight Panah Belakang (x < 0) */}
                <polygon points="0,0 -16,-9 -26,-5 -12,0" fill="url(#goldTopGrad)" stroke="#fde047" strokeWidth="0.5" />
                <polygon points="0,0 -12,0 -26,5 -16,9" fill="url(#goldBottomGrad)" stroke="#b45309" strokeWidth="0.5" />
                <circle cx="-16" cy="0" r="3.5" fill="url(#rubyJewel)" stroke="#fde047" strokeWidth="1" />

                {/* Batang Panah Utama (x: 0 sampai 72 - Dipanjangkan) */}
                <polygon points="0,-3.5 72,-3.5 72,0 0,0" fill="url(#goldTopGrad)" />
                <polygon points="0,0 72,0 72,3.5 0,3.5" fill="url(#goldBottomGrad)" />

                {/* Kepala Panah Berlian Tajam (x: 68 sampai 112 - Lebih Panjang & Berwibawa) */}
                <polygon points="68,-12 112,0 73,0" fill="url(#goldTopGrad)" stroke="#ffffff" strokeWidth="0.8" />
                <polygon points="68,12 112,0 73,0" fill="url(#goldBottomGrad)" stroke="#b45309" strokeWidth="0.8" />

                {/* Garis Kilauan Punggung Jarum (Spine Line) */}
                <line x1="-8" y1="0" x2="110" y2="0" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
              </svg>

              {/* Poros Emas Tengah (Pivot Gem Cap) */}
              <div
                className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 p-[2px] shadow-[0_0_15px_rgba(251,191,36,1)] z-40"
                style={{
                  top: 0,
                  left: 0,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="w-full h-full rounded-full bg-black/90 flex items-center justify-center border border-amber-300/70">
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-white via-amber-300 to-amber-600 shadow-[0_0_6px_rgba(251,191,36,1)]" />
                </div>
              </div>
            </div>
          </div>

          {/* ================= 4 CARD CALON: LIQUID GLASS MEWAH & FOTO LEBIH BESAR ================= */}
          {CANDIDATES.map((cand) => {
            const isAlreadyDrawn = drawnIds.includes(cand.id)
            // KUNCI: Saat phase === 'idle' (belum dipilih / belum diputar), jarum menunjuk ke atas center dan TIDAK ADA kartu yang berstatus TARGET!
            // Semua calon yang belum terpilih tampil jernih, anggun, dan berstatus SIAP.
            const isPointed = phase !== 'idle' && !isAlreadyDrawn && currentPointedId === cand.id

            // Hitung posisi statis masing-masing kartu secara seimbang (Diagonal Jam 10, 2, 5, 8)
            let posX = 0
            let posY = 0
            if (cand.position === 'jam-10') {
              posX = -DIST_X
              posY = -DIST_Y
            } else if (cand.position === 'jam-2') {
              posX = DIST_X
              posY = -DIST_Y
            } else if (cand.position === 'jam-5') {
              posX = DIST_X
              posY = DIST_Y
            } else if (cand.position === 'jam-8') {
              posX = -DIST_X
              posY = DIST_Y
            }

            return (
              <div
                key={cand.id}
                className="absolute pointer-events-none transition-all duration-200"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% + ${posX}px), calc(-50% + ${posY}px)) scale(${
                    isPointed ? 1.05 : 1.0
                  })`,
                  zIndex: isPointed ? 30 : 15,
                }}
              >
                {/* Kartu Calon: Elegant Frosted Crystal Glass - Proporsional, Utuh & Mewah */}
                <div
                  className={`relative w-[225px] sm:w-[240px] md:w-[255px] h-[275px] sm:h-[295px] md:h-[310px] rounded-[26px] p-[1.5px] transition-all duration-300 select-none ${
                    isAlreadyDrawn
                      ? 'opacity-25 grayscale-[0.95] bg-white/[0.04] border border-white/10 shadow-none'
                      : isPointed
                      ? 'bg-gradient-to-b from-amber-300/80 via-white/30 to-amber-400/80 shadow-[0_0_35px_rgba(251,191,36,0.5),0_10px_25px_rgba(0,0,0,0.2)] ring-2 ring-amber-300/90 scale-[1.04] z-30'
                      : 'bg-gradient-to-b from-white/30 via-white/10 to-amber-200/20 shadow-[0_10px_25px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.5)] border border-white/20'
                  }`}
                >
                  {/* Frosted Acrylic Body: Transparan Elegan, Latar Belakang Pemandangan Tetap Terlihat */}
                  <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-gradient-to-b from-white/[0.14] via-white/[0.04] to-black/35 backdrop-blur-xl p-2.5 flex flex-col justify-between border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                    
                    {/* Kilauan Kaca Halus di Bagian Atas */}
                    <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/[0.22] via-white/[0.04] to-transparent pointer-events-none rounded-t-[24px]" />
                    
                    {/* Ambient Glow Emas Lembut di Dasar Kaca */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/4 bg-amber-400/10 rounded-full blur-lg pointer-events-none" />

                    {/* Header: Nomor Urut Elegan & Status Pill (Selalu Terlihat di Atas) */}
                    <div className="w-full flex items-center justify-between px-1.5 pt-0.5 z-20 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-3xl sm:text-4xl font-black leading-none ${
                            isPointed ? 'text-amber-300' : isAlreadyDrawn ? 'text-gray-400' : 'text-amber-100'
                          }`}
                          style={{
                            fontFamily: "'Albertus Nova', serif",
                            textShadow: isPointed ? '0 0 14px rgba(251,191,36,0.9)' : '0 2px 4px rgba(0,0,0,0.6)',
                          }}
                        >
                          {cand.num}
                        </span>
                      </div>

                      {isAlreadyDrawn ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300 font-semibold text-[10px] tracking-wider uppercase border border-white/10">
                          SUDAH
                        </span>
                      ) : isPointed ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px] tracking-wider uppercase shadow-[0_0_12px_rgba(251,191,36,0.8)]">
                          TARGET
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 font-medium text-[10px] tracking-wider uppercase border border-white/20 backdrop-blur-md">
                          SIAP
                        </span>
                      )}
                    </div>

                    {/* Foto Calon: Tampil Utuh & Proporsional, Tidak Akan Mendorong Nama Keluar */}
                    <div className="relative flex-1 w-full min-h-0 flex items-end justify-center overflow-hidden z-10 px-0.5 py-1">
                      <img
                        src={cand.photo}
                        alt={cand.name}
                        className={`h-full w-auto max-w-full object-contain object-bottom select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)] transition-all duration-300 ${
                          isAlreadyDrawn ? 'opacity-30 grayscale-[0.9]' : 'opacity-100'
                        }`}
                      />
                    </div>

                    {/* Nama Calon: Selalu Terlihat di Bawah dengan Gradasi Halus Terbuka */}
                    <div className="w-full text-center pt-2 pb-1.5 px-1 bg-gradient-to-t from-black/85 via-black/45 to-transparent rounded-b-[20px] z-20 flex-shrink-0">
                      <div className="w-8 h-[1px] bg-amber-300/40 mx-auto mb-1 rounded-full" />
                      <span
                        className="text-xs sm:text-[13px] font-bold uppercase tracking-wide truncate block text-white"
                        style={{
                          fontFamily: "'Albertus Nova', serif",
                          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                        }}
                      >
                        {cand.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ================= 3. MODAL KONFIRMASI RESET "YAKIN?" ================= */}
      {showResetConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 pointer-events-auto px-4 select-none">
          <div className="relative w-full max-w-lg rounded-[32px] bg-gradient-to-b from-amber-950/95 via-black/95 to-black border-2 border-amber-400/80 p-6 sm:p-8 shadow-[0_0_70px_rgba(251,191,36,0.6)] text-center animate-cinematic-impact">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-500/20 border-2 border-amber-400/70 flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-[0_0_30px_rgba(251,191,36,0.5)]">
              <span className="text-3xl sm:text-4xl">⚠️</span>
            </div>

            <h3
              className="text-2xl sm:text-3xl text-white font-black tracking-wider uppercase mb-2"
              style={{ fontFamily: "'Albertus Nova', serif" }}
            >
              KONFIRMASI RESET UNDIAN
            </h3>

            <p className="text-sm sm:text-base text-gray-200 mb-2 leading-relaxed">
              Apakah Anda yakin ingin mereset seluruh undian calon?
            </p>
            <p className="text-xs sm:text-sm text-amber-300 font-semibold mb-6">
              Calon yang sudah terpilih ({drawnIds.length} dari 4) akan diulang kembali dari awal.
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={confirmReset}
                className="px-6 sm:px-8 py-3 rounded-full font-bold text-sm sm:text-base uppercase tracking-wider bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white border border-amber-300 shadow-[0_0_20px_rgba(239,68,68,0.7)] hover:scale-105 active:scale-95 cursor-pointer"
                style={{ fontFamily: "'Albertus Nova', serif" }}
              >
                YA, RESET [ ENTER ]
              </button>
              <button
                onClick={cancelReset}
                className="px-6 sm:px-8 py-3 rounded-full font-bold text-sm sm:text-base uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:scale-105 active:scale-95 cursor-pointer"
                style={{ fontFamily: "'Albertus Nova', serif" }}
              >
                BATAL [ ESC ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Atmospheric Ember Particles */}
      <EmberOverlay />
    </div>
  )
}
