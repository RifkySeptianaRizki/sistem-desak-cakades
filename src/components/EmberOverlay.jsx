import { useEffect, useRef } from 'react'

export default function EmberOverlay() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Jumlah partikel terdistribusi secara proporsional layar
    const count = Math.floor(Math.min(width, 1920) / 10) + 75
    const particles = []

    // Helper membuat partikel bara api dengan simulasi termodinamika realistis
    const createParticle = (spawnAnywhere = false) => {
      // 3 Lapisan Kedalaman Kamera (Depth of Field):
      // 0 = Jauh (kecil, lambat, lembut), 1 = Sedang (fokus utama), 2 = Dekat (sedikit lebih besar, melesat)
      const depthRand = Math.random()
      const layer = depthRand < 0.45 ? 0 : depthRand < 0.85 ? 1 : 2

      let size = 1.4 + Math.random() * 0.8 // layer 0 (1.4 - 2.2px)
      let baseSpeed = 0.5 + Math.random() * 0.35 // layer 0 lambat tenang (0.5 - 0.85px)
      if (layer === 1) {
        size = 2.2 + Math.random() * 1.2 // layer 1 (2.2 - 3.4px)
        baseSpeed = 0.75 + Math.random() * 0.45 // layer 1 (0.75 - 1.2px)
      } else if (layer === 2) {
        size = 3.4 + Math.random() * 1.6 // layer 2 (3.4 - 5.0px)
        baseSpeed = 1.1 + Math.random() * 0.55 // layer 2 (1.1 - 1.65px)
      }

      // Waktu hidup lebih panjang agar partikel melayang perlahan dan alami melintasi layar
      const maxLife = 380 + Math.random() * 420
      const currentLife = spawnAnywhere ? Math.random() * maxLife : 0

      // Posisi awal
      const x = Math.random() * (width + 200) - 100
      const y = spawnAnywhere
        ? Math.random() * height
        : height + 20 + Math.random() * 60

      return {
        x,
        y,
        prevX: x,
        prevY: y,
        layer,
        size,
        baseSpeed,
        life: currentLife,
        maxLife,
        // Kecepatan vektor horizontal lembut
        vx: 0.15 + Math.random() * 0.35,
        vy: baseSpeed,
        // Parameter fisik turbulensi lembut
        seedX: Math.random() * 1000,
        seedY: Math.random() * 1000,
        swaySpeed: 0.007 + Math.random() * 0.01,
        swayRange: 0.4 + Math.random() * 0.6,
        // Rotasi kepingan bara santai (kedip perlahan)
        tumbleAngle: Math.random() * Math.PI * 2,
        tumbleSpeed: 0.015 + Math.random() * 0.03,
      }
    }

    // Inisialisasi partikel awal di seluruh layar
    for (let i = 0; i < count; i++) {
      particles.push(createParticle(true))
    }

    let time = 0

    const render = () => {
      time += 1
      ctx.clearRect(0, 0, width, height)

      ctx.globalCompositeOperation = 'source-over'

      // Hembusan angin termal periodik yang lembut dan tenang
      const thermalWind =
        Math.sin(time * 0.006) * 0.25 + Math.cos(time * 0.014) * 0.15 + 0.2

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.life += 1

        // 1. SIMULASI FISIKA TERMAL & AERODINAMIKA
        // Progress usia bara api (0 = baru menyala, 1 = padam jadi arang)
        const progress = p.life / p.maxLife

        // Simpan posisi sebelumnya untuk motion trail alami
        p.prevX = p.x
        p.prevY = p.y

        // Turbulensi udara panas perlahan
        const noiseX =
          Math.sin(p.y * 0.004 + time * p.swaySpeed + p.seedX) * p.swayRange +
          Math.cos(p.x * 0.003 + time * 0.01 + p.seedY) * 0.25

        // Partikel bergerak lembut dan sedikit melambat saat mendingin di atas
        const thermalDecay = 1 - progress * 0.25
        const currentVy = (p.baseSpeed + Math.sin(time * 0.02 + p.seedX) * 0.12) * thermalDecay
        const currentVx = (p.vx + thermalWind + noiseX) * thermalDecay

        p.x += currentVx
        p.y -= currentVy

        // Rotasi kepingan bara (efek kedip alami karena permukaan arang berputar)
        p.tumbleAngle += p.tumbleSpeed
        const tumbleFactor = 0.72 + 0.28 * Math.sin(p.tumbleAngle)

        // 2. RADIASI BENDA HITAM & PERUBAHAN WARNA (BLACKBODY COOLING)
        // Bara api sejati:
        // Awal: Merah-oranye terang bersuhu tinggi
        // Pertengahan: Merah menyala membara
        // Akhir: Merah tua arang temaram yang memudar ke abu
        let r, g, b, alpha

        if (progress < 0.25) {
          // Fase awal: Panas menyala keemasan/oranye (Warm Amber Flame)
          const t = progress / 0.25
          r = 255
          g = Math.round(140 - t * 25) // 140 -> 115
          b = Math.round(42 - t * 15) // 42 -> 27
          alpha = (progress / 0.25) * 0.95
        } else if (progress < 0.75) {
          // Fase tengah: Oranye bara api alami (Natural Fire Orange)
          const t = (progress - 0.25) / 0.5
          r = Math.round(255 - t * 15) // 255 -> 240
          g = Math.round(115 - t * 35) // 115 -> 80
          b = Math.round(27 - t * 10) // 27 -> 17
          alpha = 0.95 - t * 0.25
        } else {
          // Fase akhir: Pendinginan arang merah-oranye temaram (Charcoal Ember fading out)
          const t = (progress - 0.75) / 0.25
          r = Math.round(240 - t * 45) // 240 -> 195
          g = Math.round(80 - t * 35) // 80 -> 45
          b = Math.round(17 - t * 7) // 17 -> 10
          alpha = Math.max(0, (1 - t) * 0.7)
        }

        // Terapkan efek kedip putaran
        alpha *= tumbleFactor

        // Pudar jika mendekati tepi atas layar
        if (p.y < height * 0.12) {
          alpha *= Math.max(0, p.y / (height * 0.12))
        }

        // 3. PENGGAMBARAN PARTIKEL BERTEKSTUR CAHAYA
        // Garis laju (micro motion blur aerodinamis)
        const dx = p.x - p.prevX
        const dy = p.y - p.prevY
        const tailX = p.x - dx * 1.6
        const tailY = p.y - dy * 1.6

        // Goresan ekor bara
        const trailGrad = ctx.createLinearGradient(p.x, p.y, tailX, tailY)
        trailGrad.addColorStop(0, `rgba(${r}, ${g + 15}, ${b + 10}, ${alpha})`)
        trailGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`)
        trailGrad.addColorStop(1, `rgba(${r - 30}, ${Math.max(0, g - 15)}, ${b}, 0)`)

        ctx.strokeStyle = trailGrad
        ctx.lineWidth = p.size
        ctx.lineCap = 'round'

        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()

        // Pendaran lembut di inti bara api (soft glow halo)
        const glowRadius = p.size * (p.layer === 2 ? 1.8 : 1.4)
        const radialGrad = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          glowRadius
        )

        // Inti bara hangat
        radialGrad.addColorStop(0, `rgba(255, ${g + 35}, ${b + 20}, ${alpha})`)
        radialGrad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${alpha * 0.75})`)
        radialGrad.addColorStop(1, `rgba(${r}, ${Math.max(0, g - 20)}, 0, 0)`)

        ctx.fillStyle = radialGrad
        ctx.beginPath()
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2)
        ctx.fill()

        // Respawn jika waktu hidup habis atau keluar batas layar
        if (
          p.life >= p.maxLife ||
          p.y < -30 ||
          p.x > width + 100 ||
          p.x < -100
        ) {
          particles[i] = createParticle(false)
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-10"
    />
  )
}
