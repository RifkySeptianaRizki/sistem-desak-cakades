import { useEffect, useState, useRef } from 'react'
import bgSistem from './assets/bg-sistem.jpeg'
import EmberOverlay from './components/EmberOverlay'
import EsportsTitle from './components/EsportsTitle'
import CooldownTimer from './components/CooldownTimer'
import BumperSuite from './components/BumperSuite'

export default function App() {
  // Mode 0: Standby / Judul DESAK CAKADES
  // Mode 1, 2, 3, 4: Cooldown Timer (Sesi 1-4)
  // Mode 'bumper': Bumper Sambutan, Indonesia Raya, Calon 1-4
  const [mode, setMode] = useState(0)
  const [bumperTarget, setBumperTarget] = useState('sambutan')
  const modeRef = useRef(mode)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  // Kunci tombol Escape saat Fullscreen agar browser Chrome tidak keluar dari fullscreen saat menekan Esc
  useEffect(() => {
    const lockEscapeKey = async () => {
      const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement)
      if (isFullscreen) {
        if ('keyboard' in navigator && navigator.keyboard?.lock) {
          try {
            await navigator.keyboard.lock(['Escape'])
          } catch (err) {
            console.warn('Keyboard lock failed:', err)
          }
        }
      } else {
        if ('keyboard' in navigator && navigator.keyboard?.unlock) {
          try {
            navigator.keyboard.unlock()
          } catch (err) {
            console.warn('Keyboard unlock failed:', err)
          }
        }
      }
    }

    document.addEventListener('fullscreenchange', lockEscapeKey)
    document.addEventListener('webkitfullscreenchange', lockEscapeKey)

    return () => {
      document.removeEventListener('fullscreenchange', lockEscapeKey)
      document.removeEventListener('webkitfullscreenchange', lockEscapeKey)
      if ('keyboard' in navigator && navigator.keyboard?.unlock) {
        try {
          navigator.keyboard.unlock()
        } catch {}
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Abaikan jika pengguna sedang mengetik di input atau textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target?.isContentEditable
      ) {
        return
      }

      const currentMode = modeRef.current
      const isTimerSession = [1, 2, 3, 4].includes(currentMode)

      // Tombol Escape: Kembali ke Home (Mode 0 / Judul Standby) tanpa mengecilkan/keluar dari fullscreen
      if (e.key === 'Escape') {
        e.preventDefault()
        setMode(0)
        return
      }

      // 1. SHORTCUT LANGSUNG DARI HALAMAN UTAMA (S, I, 1, 2, 3, 4):
      // HANYA AKTIF JIKA DI HALAMAN UTAMA (Mode 0)
      // KETIKA MASUK MODE 1, 2, 3, 4: DIKUNCI TOTAL agar tidak sengaja terpencet saat sesi debat berlangsung!
      if (!isTimerSession && currentMode === 0 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Tombol S: Langsung buka Bumper Sambutan
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault()
          setBumperTarget('sambutan')
          setMode('bumper')
          return
        }

        // Tombol I: Langsung buka Bumper Indonesia Raya
        if (e.key === 'i' || e.key === 'I') {
          e.preventDefault()
          setBumperTarget('indonesia-raya')
          setMode('bumper')
          return
        }

        // Tombol 1, 2, 3, 4: Langsung buka Bumper Calon 1, 2, 3, 4
        if (['1', '2', '3', '4'].includes(e.key)) {
          e.preventDefault()
          setBumperTarget(`calon-${e.key}`)
          setMode('bumper')
          return
        }
      }

      // 2. SHORTCUT CTRL/CMD:
      // Deteksi Ctrl+B atau Cmd+B untuk beralih ke Mode Bumper (hanya jika BUKAN mode timer sesi 1,2,3,4)
      if (!isTimerSession && (e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault()
        setBumperTarget('sambutan')
        setMode('bumper')
        return
      }

      // Deteksi Ctrl+1 atau Cmd+1 untuk beralih ke Mode 1 (Sesi 1: Pemaparan Visi, Misi & Program Unggulan)
      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault()
        setMode(1)
        return
      }

      // Deteksi Ctrl+2 atau Cmd+2 untuk beralih ke Mode 2 (Sesi 2: Pengajuan Pertanyaan Panelis)
      if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault()
        setMode(2)
        return
      }

      // Deteksi Ctrl+3 atau Cmd+3 untuk beralih ke Mode 3 (Sesi 3: Jawaban Cakades atas Pertanyaan Panelis)
      if ((e.ctrlKey || e.metaKey) && e.key === '3') {
        e.preventDefault()
        setMode(3)
        return
      }

      // Deteksi Ctrl+4 atau Cmd+4 untuk beralih ke Mode 4 (Sesi 4: Closing Statement & Deklarasi Damai)
      if ((e.ctrlKey || e.metaKey) && e.key === '4') {
        e.preventDefault()
        setMode(4)
        return
      }

      // Deteksi Ctrl+0 atau Cmd+0 untuk kembali ke Mode 0 (Judul Standby)
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        setMode(0)
        return
      }

      // Deteksi tombol 'f' atau 'F' untuk toggle Fullscreen
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()

        const isFullscreen =
          document.fullscreenElement || document.webkitFullscreenElement

        if (!isFullscreen) {
          const docEl = document.documentElement
          const requestMethod = docEl.requestFullscreen || docEl.webkitRequestFullscreen
          if (requestMethod) {
            requestMethod.call(docEl).then(() => {
              if ('keyboard' in navigator && navigator.keyboard?.lock) {
                navigator.keyboard.lock(['Escape']).catch(() => {})
              }
            }).catch((err) => {
              console.warn('Gagal masuk mode fullscreen:', err)
            })
          }
        } else {
          const exitMethod = document.exitFullscreen || document.webkitExitFullscreen
          if (exitMethod) {
            exitMethod.call(document).catch((err) => {
              console.warn('Gagal keluar dari fullscreen:', err)
            })
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-center bg-no-repeat overflow-hidden select-none"
      style={{
        backgroundImage: `url(${bgSistem})`,
        backgroundSize: '100% 100%',
      }}
    >
      {/* Overlay Hitam Transparan Bagian Atas Memudar ke Tengah */}
      <div className="absolute top-0 inset-x-0 h-[38%] bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none z-[1]" />

      {/* Overlay Hitam Transparan Bagian Bawah Memudar ke Tengah */}
      <div className="absolute bottom-0 inset-x-0 h-[40%] bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none z-[1]" />

      {/* Tampilan Sesuai Mode */}
      {mode === 0 ? (
        /* Mode 0: Judul Utama DESAK CAKADES (Statis Bersih) */
        <EsportsTitle />
      ) : mode === 'bumper' ? (
        /* Mode Bumper: Sambutan, Indonesia Raya, Calon 1-4 */
        <BumperSuite
          key={`bumper-${bumperTarget}`}
          initialBumper={bumperTarget}
          onBackToTitle={() => setMode(0)}
        />
      ) : (
        /* Mode 1, 2, 3, 4: Cooldown Timer */
        <CooldownTimer mode={mode} onBackToTitle={() => setMode(0)} />
      )}

      {/* Efek partikel bara api melayang di sekeliling layar */}
      <EmberOverlay />
    </div>
  )
}
