import { useState, useEffect, useRef } from 'react'
import {
  playSound,
  playShufflingSound,
  stopShufflingSound,
  unlockAudio,
  getPreloadedShufflingAudio,
} from '../utils/audioManager'
import CandidateFrame from './CandidateFrame'
import EmberOverlay from './EmberOverlay'
import './CandidateBumper.css'

// Import foto calon resmi dari assets (Format WebP)
import fotoCalon1 from '../assets/1_trimmed.webp'
import fotoCalon2 from '../assets/2_trimmed.webp'
import fotoCalon3 from '../assets/3_trimmed.webp'
import fotoCalon4 from '../assets/4_trimmed.webp'

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
const SPIN_DURATION_MS = 7000

// Parameter Posisi Kartu Nyerong Diagonal (Arah Jam 10, 2, 5, 8) - Lebih Merapat ke Tengah
const DIST_X = 260 // Jarak horizontal diagonal dari tengah (px)
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
    <>
      {/* KONDISI A: SAAT PEMENANG TERPILIH -> TAMPILKAN FORMAT BUMPER CALON RESMI DENGAN BINGKAI EMAS */}
      {phase === 'winner' && winnerCandidate ? (
        <section
          key={`winner-${winnerCandidate.id}`}
          className="candidate-bumper"
          style={{ zIndex: 20 }}
          aria-label={winnerCandidate.title}
          aria-live="polite"
        >
          {/* Frame Panggung Luar dengan Ornamen Sudut Emas */}
          <CandidateFrame className="candidate-frame--stage" />

          {/* Foto Calon Besar Megah di Sebelah Kanan dengan Efek Glitch Halus */}
          <div className="candidate-bumper__portrait">
            <div className="candidate-bumper__portrait-glitch-wrap">
              <img
                className="candidate-bumper__portrait-img"
                src={winnerCandidate.photo}
                alt={winnerCandidate.name}
                fetchPriority="high"
              />
              <img
                className="candidate-bumper__portrait-ghost candidate-bumper__portrait-ghost--slice1"
                src={winnerCandidate.photo}
                aria-hidden="true"
              />
              <img
                className="candidate-bumper__portrait-ghost candidate-bumper__portrait-ghost--slice2"
                src={winnerCandidate.photo}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Kotak Besar Identitas Calon: Menyatu Lengkap dengan Nomor Urut Resmi (Aga Keatas) */}
          <div className="candidate-bumper__identity candidate-bumper__identity--winner">
            <CandidateFrame className="candidate-frame--card" />

            {/* 1. Lencana Calon Terpilih */}
            <div className="candidate-bumper__role-badge">
              <span>★ CALON TERPILIH UNTUK MENJAWAB ★</span>
            </div>

            {/* 2. Nomor Urut (Hanya Angka) */}
            <div className="candidate-bumper__nomor-lockup">
              <span className="candidate-bumper__nomor-val">{winnerCandidate.num}</span>
            </div>

            <div className="candidate-bumper__rule" />
            <h1 className="candidate-bumper__name">
              <span>{winnerCandidate.name}</span>
            </h1>
          </div>

        </section>
      ) : (
        /* KONDISI B: PUTARAN ROULETTE / UNDIAN CALON DENGAN TEMA RESMI DEBAT */
        <section
          key="lottery-stage"
          className="candidate-bumper"
          style={{ zIndex: 20 }}
          aria-label="Undian Giliran Calon"
          aria-live="polite"
        >
          {/* Frame Panggung Luar dengan Ornamen Sudut Emas di Depan */}
          <CandidateFrame className="candidate-frame--stage" />

          {/* Ambient Glow Center */}
          <div
            className={`candidate-bumper__timer-ambient ${
              phase === 'spinning' ? 'animate-pulse' : ''
            }`}
          />

          {/* ================= PUSAT ROULETTE / DIAL DENGAN JARUM PANAH BERPUTAR ================= */}
          <div
            className="absolute rounded-full z-20 flex items-center justify-center pointer-events-none"
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
              <div className="absolute w-[114px] h-[114px] rounded-full border border-amber-400/20 border-dashed" />
              <div className="absolute w-[86px] h-[86px] rounded-full border border-amber-400/15" />

              {/* 4 Penanda Arah Emas Menuju Card Calon */}
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

              {/* Penanda Emas Atas Center */}
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

            {/* Jarum Panah Emas 3D */}
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
                  <linearGradient id="goldTopGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#b45309" />
                    <stop offset="40%" stopColor="#f59e0b" />
                    <stop offset="85%" stopColor="#fef08a" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                  <linearGradient id="goldBottomGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#451a03" />
                    <stop offset="40%" stopColor="#92400e" />
                    <stop offset="85%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  <radialGradient id="rubyJewel" cx="40%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#fca5a5" />
                    <stop offset="50%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#7f1d1d" />
                  </radialGradient>
                </defs>
                <polygon points="0,0 -16,-9 -26,-5 -12,0" fill="url(#goldTopGrad)" stroke="#fde047" strokeWidth="0.5" />
                <polygon points="0,0 -12,0 -26,5 -16,9" fill="url(#goldBottomGrad)" stroke="#b45309" strokeWidth="0.5" />
                <circle cx="-16" cy="0" r="3.5" fill="url(#rubyJewel)" stroke="#fde047" strokeWidth="1" />
                <polygon points="0,-3.5 72,-3.5 72,0 0,0" fill="url(#goldTopGrad)" />
                <polygon points="0,0 72,0 72,3.5 0,3.5" fill="url(#goldBottomGrad)" />
                <polygon points="68,-12 112,0 73,0" fill="url(#goldTopGrad)" stroke="#ffffff" strokeWidth="0.8" />
                <polygon points="68,12 112,0 73,0" fill="url(#goldBottomGrad)" stroke="#b45309" strokeWidth="0.8" />
                <line x1="-8" y1="0" x2="110" y2="0" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
              </svg>

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

          {/* ================= 4 KARTU CALON ================= */}
          <div className="lottery-grid-container">
            {CANDIDATES.map((cand) => {
              const isAlreadyDrawn = drawnIds.includes(cand.id)
              const isPointed = phase !== 'idle' && !isAlreadyDrawn && currentPointedId === cand.id

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
                    transform: `translate(calc(-50% + ${posX}px), calc(-50% + ${posY}px))`,
                    zIndex: isPointed ? 30 : 15,
                  }}
                >
                  <div
                    className={`lottery-card ${
                      isAlreadyDrawn
                        ? 'lottery-card--drawn'
                        : isPointed
                        ? 'lottery-card--pointed'
                        : ''
                    }`}
                  >
                    {/* Frame Ornamen Sudut Emas (Identik dengan Kotak Waktu) */}
                    <CandidateFrame className="candidate-frame--card" />

                    <div className="lottery-card__header">
                      <span className="lottery-card__num">{cand.num}</span>
                      <span
                        className={`lottery-card__badge ${
                          isAlreadyDrawn
                            ? 'lottery-card__badge--drawn'
                            : isPointed
                            ? 'lottery-card__badge--pointed'
                            : ''
                        }`}
                      >
                        {isAlreadyDrawn ? 'SUDAH' : isPointed ? 'TARGET' : 'SIAP'}
                      </span>
                    </div>

                    <div className="lottery-card__photo-wrap">
                      <img
                        src={cand.photo}
                        alt={cand.name}
                        className="lottery-card__photo"
                      />
                    </div>

                    <div className="lottery-card__footer">
                      <div className="lottery-card__rule" />
                      <span className="lottery-card__name">{cand.name}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ================= 3. MODAL KONFIRMASI RESET ================= */}
      {showResetConfirm && (
        <div className="lottery-modal-overlay">
          <div className="lottery-modal-card">
            <CandidateFrame />
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center mx-auto mb-3 shadow-[0_0_25px_rgba(251,191,36,0.4)]">
              <span className="text-2xl text-amber-300">⚠</span>
            </div>

            <h3 className="lottery-modal-title">
              RESET UNDIAN
            </h3>

            <p className="lottery-modal-desc">
              Apakah Anda yakin ingin mereset seluruh undian calon?
            </p>
            <p className="lottery-modal-warn">
              Calon yang sudah terpilih ({drawnIds.length} dari 4) akan diulang kembali dari awal.
            </p>

            <div className="lottery-modal-actions">
              <button
                onClick={confirmReset}
                className="lottery-btn-reset"
              >
                YA, RESET 
              </button>
              <button
                onClick={cancelReset}
                className="lottery-btn-cancel"
              >
                BATAL 
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partikel Bara Api Melayang di Depan Layar */}
      <EmberOverlay />
    </>
  )
}
