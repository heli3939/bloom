import flower from '../assets/figma/flower.svg'

function FlowerBackdrop({ variant = 'main' }) {
  return (
    <div className={`flower-backdrop ${variant}`} aria-hidden="true">
      {Array.from({ length: 9 }, (_, index) => (
        <img key={index} src={flower} alt="" />
      ))}
    </div>
  )
}

export default FlowerBackdrop
