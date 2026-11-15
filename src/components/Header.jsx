const LINKS = [
  ['home', 'Home'],
  ['book', 'Book a trip'],
  ['todo', 'Things to do'],
  ['property', 'The property'],
]

function MaltaFlag() {
  return (
    <svg className="flag" viewBox="0 0 30 20" aria-hidden="true">
      <rect width="15" height="20" fill="#fff" />
      <rect x="15" width="15" height="20" fill="#cf142b" />
      <path d="M4 1.4h2v2.6h2.6v2H6v2.6H4V6H1.4V4H4z" fill="#b5b5b5" stroke="#cf142b" strokeWidth=".5" />
    </svg>
  )
}

export default function Header({ page, loggedIn, onLogOut }) {
  return (
    <header>
      <div className="bar">
        <a className="logo" href="#home">
          <MaltaFlag />
          Visit Cotton in Malta
        </a>
        {loggedIn ? (
          <a
            href="#home"
            className="authlink"
            onClick={(e) => {
              e.preventDefault()
              onLogOut()
            }}
          >
            Log out
          </a>
        ) : (
          <a href="#login" className="authlink">
            Log in
          </a>
        )}
        <nav>
          {LINKS.map(([id, label]) => (
            <a key={id} href={'#' + id} className={page === id ? 'on' : undefined}>
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
