import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Übersicht', icon: '🏠', end: true },
  { to: '/inventory', label: 'Inventar', icon: '📋', end: false },
  { to: '/settings', label: 'Einstellungen', icon: '⚙️', end: false },
];

export function Nav() {
  return (
    <>
      <nav className="bottom-nav" aria-label="Hauptnavigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
          >
            <span className="bottom-nav__icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <nav className="sidebar" aria-label="Hauptnavigation">
        <div className="sidebar__brand">Vorrat</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar__item${isActive ? ' sidebar__item--active' : ''}`}
          >
            <span className="sidebar__icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
