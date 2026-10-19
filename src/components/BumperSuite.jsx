import { useState, useEffect, useRef } from 'react'
import { playBumperSound, playBumperCalonSound, stopBumperSound } from '../utils/audioManager'
import CandidateFrame from './CandidateFrame'
import EmberOverlay from './EmberOverlay'
import './CandidateBumper.css'

// Import foto calon langsung dari assets (Format WebP untuk performa cepat)
import fotoCalon1 from '../assets/1_trimmed.webp'
import fotoCalon2 from '../assets/2_trimmed.webp'
import fotoCalon3 from '../assets/3_trimmed.webp'
import fotoCalon4 from '../assets/4_trimmed.webp'
import videoIndonesiaRaya from '../assets/Indonesia-Raya.mp4'

const BUMPERS = [
  { id: 'sambutan', label: 'Sambutan', key: 'S' },
  { id: 'indonesia-raya', label: 'Indonesia Raya', key: 'I' },
  {
    id: 'calon-1', label: 'Calon 01', key: '1', num: '01',
    name: 'HERU HERNAWAN',
    title: 'Calon Kepala Desa Nomor Urut 01',
    photo: fotoCalon1,
  },
  {
    id: 'calon-2', label: 'Calon 02', key: '2', num: '02',
    name: 'ELAN SUKARLAN',
    title: 'Calon Kepala Desa Nomor Urut 02',
    photo: fotoCalon2,
  },
  {
    id: 'calon-3', label: 'Calon 03', key: '3', num: '03',
    name: 'ADI ARISNADI N',
    title: 'Calon Kepala Desa Nomor Urut 03',
    photo: fotoCalon3,
  },
  {
    id: 'calon-4', label: 'Calon 04', key: '4', num: '04',
    name: 'AHMAD GUSRAM N.H',
    title: 'Calon Kepala Desa Nomor Urut 04',
    photo: fotoCalon4,
  },
]

export default function BumperSuite({ initialBumper = 'sambutan', onBackToTitle }) {
  const [activeBumper, setActiveBumper] = useState(initialBumper || 'sambutan')
  const [animKey, setAnimKey] = useState(0)
  const [bumperPhase, setBumperPhase] = useState('enter') // 'enter' | 'active' | 'exit'

  const transitionTimers = useRef([])
  const clearTransitionTimers = () => {
    transitionTimers.current.forEach(clearTimeout)
    transitionTimers.current = []
  }
  const scheduleTransition = (callback, delay) => {
    transitionTimers.current.push(setTimeout(callback, delay))
  }

  // Video State untuk Indonesia Raya
  const [videoSrc, setVideoSrc] = useState(videoIndonesiaRaya)
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)

  // Jalankan animasi dan audio saat bumper aktif berubah
  const triggerBumper = (bumperId) => {
    clearTransitionTimers()
    // Exit animation for current bumper first
    setBumperPhase('exit')

    scheduleTransition(() => {
      setActiveBumper(bumperId)
      setAnimKey((prev) => prev + 1)
      setBumperPhase('enter')

      if (bumperId === 'indonesia-raya') {
        stopBumperSound()
        scheduleTransition(() => {
          if (videoRef.current) {
            videoRef.current.currentTime = 0
            videoRef.current.play().catch((e) => {
              console.warn('Video autoplay dicegah:', e)
            })
          }
        }, 300)
      } else if (bumperId.startsWith('calon-')) {
        // Calon menggunakan sound-bumper-calon.mp3
        if (videoRef.current) {
          videoRef.current.pause()
        }
        playBumperCalonSound()
      } else {
        // Bumper Sambutan menggunakan sound-bumper-sambutan.mp3
        if (videoRef.current) {
          videoRef.current.pause()
        }
        playBumperSound()
      }

      // After enter animation completes, set to active
      scheduleTransition(() => setBumperPhase('active'), 1800)
    }, 400) // Wait for exit animation
  }

  // Mulai bumper pertama saat komponen dimuat
  useEffect(() => {
    const target = initialBumper || 'sambutan'
    setBumperPhase('enter')
    setActiveBumper(target)
    setAnimKey(1)

    if (target === 'indonesia-raya') {
      stopBumperSound()
      scheduleTransition(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0
          videoRef.current.play().catch((e) => {
            console.warn('Video autoplay dicegah:', e)
          })
        }
      }, 300)
    } else if (target.startsWith('calon-')) {
      playBumperCalonSound()
    } else {
      playBumperSound()
    }

    scheduleTransition(() => setBumperPhase('active'), 1800)

    return () => {
      clearTransitionTimers()
      stopBumperSound()
      const v = videoRef.current
      if (v) {
        v.pause()
      }
    }
  }, [initialBumper])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || e.target?.isContentEditable) return

      if (e.key === 's' || e.key === 'S') { e.preventDefault(); triggerBumper('sambutan'); return }
      if (e.key === 'i' || e.key === 'I' || e.key === 'v' || e.key === 'V') { e.preventDefault(); triggerBumper('indonesia-raya'); return }
      if (['1', '2', '3', '4'].includes(e.key)) { e.preventDefault(); triggerBumper(`calon-${e.key}`); return }

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        const idx = BUMPERS.findIndex((b) => b.id === activeBumper)
        triggerBumper(BUMPERS[(idx + 1) % BUMPERS.length].id)
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const idx = BUMPERS.findIndex((b) => b.id === activeBumper)
        triggerBumper(BUMPERS[(idx - 1 + BUMPERS.length) % BUMPERS.length].id)
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        if (activeBumper === 'indonesia-raya') {
          if (videoRef.current) {
            if (videoRef.current.paused) {
              videoRef.current.play()
            } else {
              videoRef.current.pause()
            }
          }
        } else {
          triggerBumper(activeBumper)
        }
        return
      }

      if (e.key === 'Escape') { e.preventDefault(); stopBumperSound(); if (onBackToTitle) onBackToTitle(); return }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeBumper, onBackToTitle])

  // Handle upload file video Indonesia Raya lokal
  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setVideoSrc(url)
      scheduleTransition(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0
          videoRef.current.play().catch((err) => {
            console.warn('Gagal memutar video:', err)
          })
        }
      }, 200)
    }
  }



  const currentCalonData = BUMPERS.find((b) => b.id === activeBumper)

  // Animation class based on phase
  const getAnimClass = () => {
    if (bumperPhase === 'exit') return 'animate-bumper-exit'
    if (bumperPhase === 'enter') return 'animate-bumper-enter'
    return ''
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 select-none overflow-hidden">
      
      {activeBumper === 'indonesia-raya' && <>
      {/* Dynamic Background Flare / Shockwave on each transition */}
      <div
        key={`shockwave-${animKey}`}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] md:w-[850px] h-[350px] sm:h-[600px] md:h-[850px] rounded-full border-2 border-amber-400/40 pointer-events-none animate-shockwave"
        style={{
          boxShadow: '0 0 80px rgba(251, 191, 36, 0.4), inset 0 0 60px rgba(251, 191, 36, 0.25)',
        }}
      />

      {/* Secondary Shockwave Ring */}
      <div
        key={`shockwave2-${animKey}`}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] sm:w-[450px] md:w-[650px] h-[250px] sm:h-[450px] md:h-[650px] rounded-full border border-amber-300/25 pointer-events-none animate-shockwave-delayed"
        style={{
          boxShadow: '0 0 50px rgba(251, 191, 36, 0.25)',
        }}
      />

      {/* Main Ambient Radial Glow — Clean golden warmth without dark muddy splotches */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] sm:w-[750px] md:w-[1050px] h-[280px] sm:h-[450px] bg-gradient-to-r from-transparent via-amber-500/15 to-transparent rounded-full blur-3xl opacity-80 pointer-events-none transition-all duration-700" />

      {/* Horizontal Cinematic Light Streak */}
      <div
        key={`streak-${animKey}`}
        className="absolute top-1/2 left-0 w-full h-[2px] -translate-y-1/2 pointer-events-none animate-light-streak"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.7), rgba(255, 255, 255, 0.9), rgba(251, 191, 36, 0.7), transparent)',
        }}
      />

      </>}

      {/* ========================================================================================= */}
      {/* 1. BUMPER SAMBUTAN KETUA PANITIA PILKADES (Center Stage Layout — Desain Bumper Calon)    */}
      {/* ========================================================================================= */}
      {activeBumper === 'sambutan' && (
        <section
          key={`sambutan-${animKey}`}
          className={`candidate-bumper ${bumperPhase === 'exit' ? 'candidate-bumper--exit' : ''}`}
          aria-label="Sambutan Ketua Panitia Pilkades"
          aria-live="polite"
        >
          <CandidateFrame className="candidate-frame--stage" />
          <p className="candidate-bumper__event-title">PEMILIHAN KEPALA DESA BAGINDA 2026</p>
          <header className="candidate-bumper__header candidate-bumper__header--sambutan">
            <div className="candidate-bumper__brand candidate-bumper__brand--sambutan">
              DESAK<strong>CAKADES</strong>
            </div>
            
          </header>

          {/* Kotak Identitas Center (Tanpa Foto, Layout Sambutan Sesuai Desain Bumper Calon) */}
          <div className="candidate-bumper__identity candidate-bumper__identity--center">
            <CandidateFrame />

            {/* Badge Kategori Acara Berbingkai */}
            <div className="candidate-bumper__role-badge">
              <span>SAMBUTAN &amp; PEMBUKAAN ACARA</span>
            </div>

            {/* Jabatan / Designation */}
            <h2 className="candidate-bumper__sambutan-role">
              KETUA PANITIA PILKADES
            </h2>

            {/* Garis Emas Pembatas */}
            <div className="candidate-bumper__rule" />

            {/* Nama Tokoh Sambutan */}
            <h1 className="candidate-bumper__name candidate-bumper__name--center">
              <span>APENDI</span>
            </h1>

            <p className="candidate-bumper__sambutan-motto">
              Membuka Ruang Dialog Kritis, Gagasan Transparan &amp; Demokrasi Desa Bermartabat
            </p>
          </div>
        </section>
      )}

      {/* ========================================================================================= */}
      {/* ========================================================================================= */}
      {/* 2. BUMPER VIDEO INDONESIA RAYA - Extra Large Theater Broadcast View                      */}
      {/* ========================================================================================= */}
      {activeBumper === 'indonesia-raya' && (
        <div
          key={`indo-${animKey}`}
          className={`relative flex flex-col items-center justify-center text-center z-10 w-full max-w-[94vw] xl:max-w-[1560px] px-2 sm:px-4 ${getAnimClass()}`}
        >
          {/* Header Bar */}
          <div className="mb-2 sm:mb-3 flex items-center gap-3 px-6 py-1.5 rounded-full bg-black/70 border border-white/20 backdrop-blur-xl shadow-[0_0_25px_rgba(0,0,0,0.8)] animate-badge-slide">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
            <span
              className="text-xs sm:text-sm md:text-base text-white tracking-[0.2em] uppercase font-bold"
              style={{ fontFamily: "'Albertus Nova', serif" }}
            >
              LAGU KEBANGSAAN • INDONESIA RAYA
            </span>
          </div>

          {/* Liquid Glass Video Stage Frame - Extra Large View */}
          <div className="relative w-full aspect-video max-h-[82vh] rounded-[24px] sm:rounded-[36px] bg-gradient-to-b from-white/35 via-white/10 to-white/15 p-[2.5px] shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_60px_rgba(239,68,68,0.25)] backdrop-blur-3xl overflow-hidden pointer-events-auto animate-stage-reveal">
            <div className="relative w-full h-full rounded-[22px] sm:rounded-[34px] overflow-hidden bg-black flex items-center justify-center">
              
              {videoSrc ? (
                <video
                  ref={videoRef}
                  src={videoSrc}
                  className="w-full h-full object-contain bg-black"
                  controls
                  autoPlay
                />
              ) : (
                <div className="relative flex flex-col items-center justify-center p-6 text-center z-10 max-w-lg">
                  {/* Bendera Merah Putih Aura */}
                  <div className="w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden border border-white/30 shadow-[0_0_35px_rgba(239,68,68,0.4)] mb-4 flex flex-col">
                    <div className="w-full h-1/2 bg-red-600" />
                    <div className="w-full h-1/2 bg-white" />
                  </div>

                  <h3
                    className="text-2xl sm:text-3xl text-white font-bold tracking-wider mb-2"
                    style={{ fontFamily: "'Albertus Nova', serif" }}
                  >
                    INDONESIA RAYA
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-gray-300 mb-5 leading-relaxed">
                    Siapkan video lagu kebangsaan Indonesia Raya untuk diputar di panggung.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Hidden video input fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={handleVideoUpload}
          />
        </div>
      )}

      {/* ========================================================================================= */}
      {/* 3. BUMPER MASUK CALON 1, 2, 3, 4 — Desain Broadcast Elegan dengan Foto Besar             */}
      {/* ========================================================================================= */}
      {activeBumper.startsWith('calon-') && (
        <section
          key={`calon-${activeBumper}-${animKey}`}
          className={`candidate-bumper ${bumperPhase === 'exit' ? 'candidate-bumper--exit' : ''}`}
          aria-label={currentCalonData.title}
          aria-live="polite"
        >
          <CandidateFrame className="candidate-frame--stage" />
          <p className="candidate-bumper__event-title">PEMILIHAN KEPALA DESA BAGINDA 2026</p>
          <header className="candidate-bumper__header">
            <div className="candidate-bumper__brand">
              DESAK <strong>CAKADES</strong>
            </div>
            
          </header>

          {/* Foto Calon Besar Megah di Sebelah Kanan dengan Efek Glitch Pas pada Foto */}
          <div className="candidate-bumper__portrait">
            <div className="candidate-bumper__portrait-glitch-wrap">
              <img
                className="candidate-bumper__portrait-img"
                src={currentCalonData.photo}
                alt={currentCalonData.name}
                fetchPriority="high"
              />
              <img
                className="candidate-bumper__portrait-ghost candidate-bumper__portrait-ghost--slice1"
                src={currentCalonData.photo}
                aria-hidden="true"
              />
              <img
                className="candidate-bumper__portrait-ghost candidate-bumper__portrait-ghost--slice2"
                src={currentCalonData.photo}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Kotak Besar Identitas Calon: Menyatu Lengkap dengan Nomor Urut Resmi */}
          <div className="candidate-bumper__identity">
            <CandidateFrame />
            
            {/* 1. CALON KEPALA DESA (Di Atas, Berbingkai / Border) */}
            <div className="candidate-bumper__role-badge">
              <span>CALON KEPALA DESA BAGINDA</span>
            </div>

            {/* 2. NOMOR URUT (Di Bawah, Tanpa Border) */}
            <div className="candidate-bumper__nomor-lockup">
              <span className="candidate-bumper__nomor-label">NOMOR URUT</span>
              <span className="candidate-bumper__nomor-val">{currentCalonData.num}</span>
            </div>

            <div className="candidate-bumper__rule" />
            <h1 className="candidate-bumper__name"><span>{currentCalonData.name}</span></h1>
          </div>

        </section>
      )}

      {/* Efek Bara Api Melayang di Depan Layar: Aktif di Sambutan & Calon-Calon (Kecuali Indonesia Raya) */}
      {activeBumper !== 'indonesia-raya' && <EmberOverlay />}
    </div>
  )
}
