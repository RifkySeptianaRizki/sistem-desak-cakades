import bannerSvg from '../assets/banner.svg'

export default function EsportsTitle() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 select-none overflow-hidden">
      <img
        src={bannerSvg}
        alt="Banner Desak Cakades"
        className="w-full h-full object-contain"
        draggable="false"
      />
    </div>
  )
}

