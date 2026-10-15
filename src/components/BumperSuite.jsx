import { useState, useEffect, useRef } from 'react'
import { playBumperSound, playBumperCalonSound, stopBumperSound } from '../utils/audioManager'
import EmberOverlay from './EmberOverlay'

// Import foto calon langsung dari assets
import fotoCalon1 from '../assets/1_trimmed.png'
import fotoCalon2 from '../assets/2_trimmed.png'
import fotoCalon3 from '../assets/3_trimmed.png'
import fotoCalon4 from '../assets/4_trimmed.png'
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

  // Video State untuk Indonesia Raya
  const [videoSrc, setVideoSrc] = useState(videoIndonesiaRaya)
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)

  // Jalankan animasi dan audio saat bumper aktif berubah
  const triggerBumper = (bumperId) => {
    // Exit animation for current bumper first
    setBumperPhase('exit')

    setTimeout(() => {
      setActiveBumper(bumperId)
      setAnimKey((prev) => prev + 1)
      setBumperPhase('enter')

      if (bumperId === 'indonesia-raya') {
        stopBumperSound()
        setTimeout(() => {
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
      setTimeout(() => setBumperPhase('active'), 1800)
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
      setTimeout(() => {
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

    const timer = setTimeout(() => setBumperPhase('active'), 1800)

    return () => {
      clearTimeout(timer)
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
      if (e.ctrlKey || e.metaKey) return

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
      setTimeout(() => {
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

      {/* ========================================================================================= */}
      {/* 1. BUMPER SAMBUTAN KETUA PANITIA PILKADES                                                 */}
      {/* ========================================================================================= */}
      {/* ========================================================================================= */}
      {/* 1. BUMPER SAMBUTAN KETUA PANITIA PILKADES (Center Stage Layout — APENDI)                 */}
      {/* ========================================================================================= */}
      {activeBumper === 'sambutan' && (
        <div
          key={`sambutan-${animKey}`}
          className={`relative flex flex-col items-center justify-center text-center z-10 w-full max-w-[1100px] px-6 sm:px-10 py-6 mx-auto ${getAnimClass()}`}
        >
          {/* Top Pill Badge */}
          <div className="mb-5 sm:mb-7 animate-badge-slide">
            <div className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-amber-500/25 via-amber-400/40 to-amber-500/25 border border-amber-300/50 backdrop-blur-xl shadow-[0_0_30px_rgba(251,191,36,0.3)]">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-pulse shadow-[0_0_10px_rgba(251,191,36,1)]" />
              <span
                className="text-xs sm:text-sm md:text-base text-amber-100 tracking-[0.26em] uppercase font-bold"
                style={{ fontFamily: "'Albertus Nova', serif" }}
              >
                DESAK CAKADES • DESA BAGINDA 2026
              </span>
            </div>
          </div>

          {/* Subtitle / Session Category */}
          <h2
            className="text-sm sm:text-base md:text-lg lg:text-xl text-amber-300 uppercase tracking-[0.28em] font-bold mb-3 sm:mb-4 animate-text-slide-up"
            style={{
              fontFamily: "'Albertus Nova', serif",
              textShadow: '0 0 14px rgba(251, 191, 36, 0.7), 0 2px 10px rgba(0, 0, 0, 0.95)',
              animationDelay: '0.25s',
              animationFillMode: 'both',
            }}
          >
            SAMBUTAN & PEMBUKAAN ACARA
          </h2>

          {/* Designation / Role Title */}
          <div
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-amber-100 uppercase tracking-[0.14em] font-extrabold leading-tight mb-4 sm:mb-6 animate-text-slide-up"
            style={{
              fontFamily: "'Albertus Nova', 'Albertus', serif",
              textShadow:
                '0 0 20px rgba(255, 255, 255, 0.9), 0 0 40px rgba(251, 191, 36, 0.5), 0 4px 20px rgba(0, 0, 0, 0.95)',
              animationDelay: '0.45s',
              animationFillMode: 'both',
            }}
          >
            KETUA PANITIA PILKADES
          </div>

          {/* Golden Ribbon Line Divider (Centered with Diamond) */}
          <div
            className="my-3 sm:my-5 flex items-center gap-4 sm:gap-6 w-full max-w-[480px] opacity-90 animate-text-slide-up"
            style={{ animationDelay: '0.65s', animationFillMode: 'both' }}
          >
            <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
            <div className="w-3.5 h-3.5 rotate-45 bg-amber-300 shadow-[0_0_18px_rgba(251,191,36,1)] border border-white/90" />
            <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-amber-400 to-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
          </div>

          {/* The Name: APENDI (Monumental, Regal, Generously Spaced) */}
          <h1
            className="text-5xl sm:text-7xl md:text-8xl lg:text-[96px] xl:text-[110px] text-white uppercase tracking-[0.08em] leading-none font-black my-4 sm:my-6 select-none animate-text-slide-up"
            style={{
              fontFamily: "'Albertus Nova', 'Albertus', serif",
              fontWeight: 800,
              textShadow:
                '0 0 25px rgba(255, 255, 255, 1), 0 0 50px rgba(255, 255, 255, 0.6), 0 0 90px rgba(251, 191, 36, 0.45), 0 5px 30px rgba(0, 0, 0, 0.95)',
              animationDelay: '0.85s',
              animationFillMode: 'both',
            }}
          >
            APENDI
          </h1>

          {/* Region Tag & Motto */}
          <div
            className="mt-4 sm:mt-6 flex flex-col items-center gap-3 sm:gap-4 animate-text-slide-up"
            style={{ animationDelay: '1.05s', animationFillMode: 'both' }}
          >
            <div
              className="flex items-center gap-3 text-sm sm:text-base md:text-lg text-amber-200/90 tracking-[0.2em] uppercase font-bold"
              style={{
                fontFamily: "'Albertus Nova', serif",
                textShadow: '0 0 10px rgba(255, 255, 255, 0.5), 0 2px 8px rgba(0, 0, 0, 0.9)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]" />
              <span>DESA BAGINDA • KAB. SUMEDANG</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]" />
            </div>

            <p
              className="text-xs sm:text-sm md:text-base text-white/85 tracking-[0.1em] uppercase font-medium max-w-xl leading-relaxed mt-1"
              style={{
                fontFamily: "'Albertus Nova', serif",
                textShadow: '0 0 8px rgba(0, 0, 0, 0.9)',
              }}
            >
              Membuka Ruang Dialog Kritis, Gagasan Transparan & Demokrasi Desa Bermartabat
            </p>
          </div>
        </div>
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
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
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
        <div
          key={`calon-${activeBumper}-${animKey}`}
          className={`relative flex flex-row items-center justify-between z-10 w-full h-full max-w-[1800px] pl-8 sm:pl-12 md:pl-16 lg:pl-20 xl:pl-24 pr-0 md:pr-4 lg:pr-8 xl:pr-12 ${getAnimClass()}`}
        >
          {/* Left Side: Candidate Information Panel */}
          <div className="flex flex-col items-start text-left flex-1 max-w-[700px] xl:max-w-[780px] z-10 py-6">

            {/* Top Pill Header */}
            <div className="mb-4 sm:mb-6 animate-badge-slide">
              <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full bg-gradient-to-r from-amber-500/25 via-amber-400/40 to-amber-500/25 border border-amber-300/50 backdrop-blur-xl shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-pulse shadow-[0_0_10px_rgba(251,191,36,1)]" />
                <span
                  className="text-xs sm:text-sm md:text-base text-amber-100 tracking-[0.24em] uppercase font-bold"
                  style={{ fontFamily: "'Albertus Nova', serif" }}
                >
                  DESAK CAKADES • DESA BAGINDA 2026
                </span>
              </div>
            </div>

            {/* Candidate Role & Number Lockup — Unified Albertus Nova Font */}
            <div className="flex items-center gap-5 sm:gap-7 my-2 sm:my-3 animate-text-slide-up" style={{ animationDelay: '0.35s', animationFillMode: 'both' }}>
              {/* Grand Official Number in Albertus Nova (NOT Technology font) */}
              <div className="relative select-none flex-shrink-0">
                <span
                  className="text-[85px] sm:text-[105px] md:text-[125px] lg:text-[145px] text-white font-extrabold leading-none tracking-tight"
                  style={{
                    fontFamily: "'Albertus Nova', 'Albertus', serif",
                    fontWeight: 800,
                    textShadow:
                      '0 0 20px rgba(255, 255, 255, 0.95), 0 0 45px rgba(251, 191, 36, 0.65), 0 4px 20px rgba(0, 0, 0, 0.95)',
                  }}
                >
                  {currentCalonData?.num || '01'}
                </span>
              </div>

              {/* Title & Category Info */}
              <div className="flex flex-col justify-center">
                {/* NOMOR URUT Badge — High-contrast dark glass capsule with crisp white typography */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/70 border border-white/25 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.85)] mb-1.5 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]" />
                  <span
                    className="text-xs sm:text-sm text-white uppercase tracking-[0.24em] font-extrabold select-none"
                    style={{
                      fontFamily: "'Albertus Nova', serif",
                      textShadow: '0 1px 4px rgba(0, 0, 0, 0.95)',
                    }}
                  >
                    NOMOR URUT
                  </span>
                </div>

                <h2
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white uppercase tracking-[0.14em] font-extrabold leading-tight select-none"
                  style={{
                    fontFamily: "'Albertus Nova', serif",
                    textShadow:
                      '0 0 16px rgba(255, 255, 255, 0.9), 0 0 30px rgba(251, 191, 36, 0.6), 0 2px 10px rgba(0, 0, 0, 0.95)',
                  }}
                >
                  CALON KEPALA DESA
                </h2>
              </div>
            </div>

            {/* Golden Ribbon Line Divider */}
            <div className="my-3 sm:my-4 flex items-center gap-3 sm:gap-4 w-full max-w-[560px] opacity-90 animate-text-slide-up" style={{ animationDelay: '0.55s', animationFillMode: 'both' }}>
              <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
              <div className="w-3 h-3 rotate-45 bg-amber-300 shadow-[0_0_15px_rgba(251,191,36,1)] border border-white/80" />
              <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-amber-400 to-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
            </div>

            {/* Candidate Name — Strict Single Line (Never wrap down) */}
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[62px] text-white uppercase tracking-[0.03em] leading-tight font-black my-2 select-none whitespace-nowrap animate-text-slide-up"
              style={{
                fontFamily: "'Albertus Nova', 'Albertus', serif",
                fontWeight: 800,
                textShadow:
                  '0 0 16px rgba(255, 255, 255, 0.95), 0 0 35px rgba(255, 255, 255, 0.55), 0 0 65px rgba(251, 191, 36, 0.35), 0 4px 20px rgba(0, 0, 0, 0.9)',
                animationDelay: '0.75s',
                animationFillMode: 'both',
              }}
            >
              {currentCalonData?.name || 'NAMA CALON'}
            </h1>

            {/* Desa Baginda Subtitle */}
            <div
              className="mt-2 flex items-center gap-2.5 text-amber-100/90 tracking-[0.14em] uppercase text-sm sm:text-base md:text-lg font-medium whitespace-nowrap animate-text-slide-up"
              style={{
                fontFamily: "'Albertus Nova', serif",
                textShadow: '0 0 10px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.9)',
                animationDelay: '0.95s',
                animationFillMode: 'both',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <span>DESA BAGINDA • KAB. SUMEDANG</span>
            </div>
          </div>

          {/* Right Side: Giant Candidate Portrait Anchored to Bottom Right (Balanced vertical framing) */}
          <div className="hidden md:flex flex-col items-end justify-end flex-shrink-0 z-10 animate-portrait-entrance relative self-end h-[82vh] lg:h-[86vh] xl:h-[89vh] max-h-[910px] mr-0 lg:mr-2 xl:mr-6 translate-y-2 lg:translate-y-3">
            <div className="relative h-full flex items-end justify-end">
              {/* Candidate Photo (trimmed, ultra-clean, no dark outline artifacts) */}
              <img
                src={currentCalonData?.photo}
                alt={currentCalonData?.name}
                className="h-full w-auto max-w-[50vw] object-contain object-bottom select-none"
                style={{
                  filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.3))',
                  maskImage: 'linear-gradient(to bottom, black 70%, transparent 98%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 98%)',
                }}
              />
            </div>
          </div>

          {/* Mobile: Photo centered below on small screens */}
          <div className="flex md:hidden justify-center w-full mt-4 animate-portrait-entrance">
            <img
              src={currentCalonData?.photo}
              alt={currentCalonData?.name}
              className="w-[240px] h-[320px] object-contain object-bottom select-none"
              style={{
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))',
                maskImage: 'linear-gradient(to bottom, black 70%, transparent 98%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 98%)',
              }}
            />
          </div>

          {/* Bottom Cinematic Gradient Overlay (Seamlessly dissolves bottom of photo and screen) */}
          <div
            className="absolute inset-x-0 bottom-0 h-32 sm:h-44 md:h-52 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none z-15"
          />
        </div>
      )}

      {/* Efek Bara Api Melayang di Depan Layar: Aktif di Sambutan & Calon-Calon (Kecuali Indonesia Raya) */}
      {activeBumper !== 'indonesia-raya' && <EmberOverlay />}
    </div>
  )
}
