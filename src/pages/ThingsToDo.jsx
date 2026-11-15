import { TODO } from '../data/content'

export default function ThingsToDo() {
  return (
    <section>
      <h1>Things to do in Malta</h1>
      {TODO.map(([title, text]) => (
        <div className="card" key={title}>
          <h2>{title}</h2>
          <div className="mute" style={{ fontSize: '1rem' }}>
            {text}
          </div>
        </div>
      ))}
      <div className="card">
        <h2>More ideas: Explore Malta</h2>
        <div className="mute" style={{ fontSize: '1rem' }}>
          A guide by John Montaño with 70+ hidden gems, caves, beaches and historical sites across Malta and Gozo, with
          ratings and filters to help you choose.
        </div>
        <div className="links">
          <a className="btn p" href="https://johnfabiomb.com/malta/list" target="_blank" rel="noopener noreferrer">
            Open the guide ↗
          </a>
        </div>
        <div className="mute" style={{ marginTop: 8 }}>
          Opens John’s site in a new tab.
        </div>
      </div>
      <div className="card soft">
        <b>More coming soon</b>
        <div className="mute">I’ll add my favourite restaurants, hikes and hidden spots here.</div>
      </div>
    </section>
  )
}
