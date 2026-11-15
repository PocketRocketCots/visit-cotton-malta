import { TODO } from '../data/content'
import SplitTheG from '../components/SplitTheG'

const Item = ([title, text]) => (
  <div className="todo-item" key={title}>
    <h3>{title}</h3>
    <p>{text}</p>
  </div>
)

// The Split the G bar scene stays pinned; these glass panels scroll over it, left and right.
export default function ThingsToDo({ user }) {
  const half = Math.ceil(TODO.length / 2)
  return (
    <SplitTheG user={user}>
      <div className="lux-screen lux-pair">
        <div className="glass-panel reveal">
          <h1 className="glass-h">Things to do in Malta</h1>
          {TODO.slice(0, half).map(Item)}
        </div>
        <div className="glass-panel reveal">
          <h2 className="glass-h">More favourites</h2>
          {TODO.slice(half).map(Item)}
        </div>
      </div>

      <div className="lux-screen lux-pair">
        <div className="glass-panel reveal">
          <h2 className="glass-h">More ideas: Explore Malta</h2>
          <p className="mute">
            A guide by John Montaño with 70+ hidden gems, caves, beaches and historical sites across Malta and Gozo,
            with ratings and filters to help you choose.
          </p>
          <div className="links">
            <a className="btn p" href="https://johnfabiomb.com/malta/list" target="_blank" rel="noopener noreferrer">
              Open the guide ↗
            </a>
          </div>
          <p className="mute" style={{ marginTop: 8 }}>
            Opens John’s site in a new tab.
          </p>
        </div>
        <div className="glass-panel reveal">
          <h2 className="glass-h">More coming soon</h2>
          <p className="mute">I’ll add my favourite restaurants, hikes and hidden spots here.</p>
        </div>
      </div>
    </SplitTheG>
  )
}
