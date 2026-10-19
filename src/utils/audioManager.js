import sound321 from '../assets/3,2,1.mp3'
import sound54321 from '../assets/5,4,3,2,1.wav'
import soundBeep from '../assets/beep.mp3'
import soundGong from '../assets/goong.mp3'
import soundBumperSambutan from '../assets/sound-bumper-sambutan.mp3'
import soundBumperCalon from '../assets/sound-bumper-calon.mp3'
import soundShuffling from '../assets/shuffling.mp3'

let audioUnlocked = false
let currentBumperAudio = null
let currentShufflingAudio = null
let preloadedShufflingAudio = null

// Preload shuffling audio so playback starts with 0ms latency
export function getPreloadedShufflingAudio() {
  if (!preloadedShufflingAudio && typeof Audio !== 'undefined') {
    try {
      preloadedShufflingAudio = new Audio(soundShuffling)
      preloadedShufflingAudio.preload = 'auto'
      preloadedShufflingAudio.loop = false
    } catch (e) {
      console.warn('Audio preload warning:', e)
    }
  }
  return preloadedShufflingAudio
}

// Unlock browser autoplay policy on first user interaction
export function unlockAudio() {
  if (audioUnlocked) return
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      const ctx = new AudioContextClass()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
    }
    audioUnlocked = true
    getPreloadedShufflingAudio()
  } catch (e) {
    console.warn('Audio unlock warning:', e)
  }
}

// Play specific named sound
export function playSound(name) {
  unlockAudio()
  let src = null
  if (name === '321') src = sound321
  else if (name === '54321') src = sound54321
  else if (name === 'beep') src = soundBeep
  else if (name === 'gong') src = soundGong
  else if (name === 'bumper') src = soundBumperSambutan
  else if (name === 'bumper-calon') src = soundBumperCalon
  else if (name === 'shuffling') src = soundShuffling

  if (!src) return null

  try {
    const audio = new Audio(src)
    audio.currentTime = 0
    audio.play().catch((err) => {
      console.warn(`Autoplay audio [${name}] dicegah browser:`, err)
    })
    return audio
  } catch (e) {
    console.error(`Gagal memutar audio [${name}]:`, e)
    return null
  }
}

// Stop currently playing bumper sound
export function stopBumperSound() {
  if (currentBumperAudio) {
    try {
      currentBumperAudio.pause()
      currentBumperAudio.currentTime = 0
    } catch (e) {
      console.warn('Gagal menghentikan bumper audio:', e)
    }
    currentBumperAudio = null
  }
}

// Play bumper sambutan sound with tracking (stops previous bumper sound first)
export function playBumperSound() {
  stopBumperSound()
  unlockAudio()
  try {
    const audio = new Audio(soundBumperSambutan)
    audio.currentTime = 0
    audio.play().catch((err) => {
      console.warn('Autoplay bumper audio dicegah browser:', err)
    })
    currentBumperAudio = audio
    return audio
  } catch (e) {
    console.error('Gagal memutar bumper sound:', e)
    return null
  }
}

// Play bumper calon sound with tracking (stops previous bumper sound first)
export function playBumperCalonSound() {
  stopBumperSound()
  unlockAudio()
  try {
    const audio = new Audio(soundBumperCalon)
    audio.currentTime = 0
    audio.play().catch((err) => {
      console.warn('Autoplay bumper calon audio dicegah browser:', err)
    })
    currentBumperAudio = audio
    return audio
  } catch (e) {
    console.error('Gagal memutar bumper calon sound:', e)
    return null
  }
}

// Play repeated beeps with deliberate delay (for 2x and 3x beeps)
export function playBeepSeries(times, gapMs = 700) {
  unlockAudio()
  for (let i = 0; i < times; i++) {
    setTimeout(() => {
      playSound('beep')
    }, i * gapMs)
  }
}

// Play shuffling roll sound (with loop option, default false so it matches exact track duration)
export function playShufflingSound(loop = false) {
  stopShufflingSound()
  unlockAudio()
  try {
    const audio = getPreloadedShufflingAudio() || new Audio(soundShuffling)
    audio.loop = loop
    audio.currentTime = 0
    audio.play().catch((err) => {
      console.warn('Autoplay shuffling audio dicegah browser:', err)
    })
    currentShufflingAudio = audio
    return audio
  } catch (e) {
    console.error('Gagal memutar shuffling audio:', e)
    return null
  }
}

// Stop currently playing shuffling sound
export function stopShufflingSound() {
  if (currentShufflingAudio) {
    try {
      currentShufflingAudio.pause()
      currentShufflingAudio.currentTime = 0
    } catch (e) {
      console.warn('Gagal menghentikan shuffling audio:', e)
    }
    currentShufflingAudio = null
  }
}
