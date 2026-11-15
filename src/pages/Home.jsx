import { useState } from 'react'

export default function Home() {
  const [photoOk, setPhotoOk] = useState(true)
  return (
    <section>
      <div className="hero">
        {photoOk && <img src="/img/host.jpg" alt="Your host" onError={() => setPhotoOk(false)} />}        <span>
          📸 Your photo goes here
          <br />
          <small>(save it as public/img/host.jpg)</small>
        </span>
      </div>
    </section>
  )
}
