import { PHOTOS, VIDEOS } from '../data/content'

export default function Property() {
  const empty = !PHOTOS.length && !VIDEOS.length
  return (
    <section>
      <h1>The property</h1>
      {empty ? (
        <div className="card soft">
          <b>Photos and videos coming soon</b>
          <div className="mute">I’ll add them once I’ve settled in.</div>
        </div>
      ) : (
        <>
          {VIDEOS.map((v) => (
            <div className="vid" key={v}>
              <iframe
                src={'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v)}
                title="Property video"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ))}
          <div className="gal">
            {PHOTOS.map((f) => (
              <img key={f} src={'/img/' + f} alt="The property" loading="lazy" />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
