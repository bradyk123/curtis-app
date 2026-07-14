export function Header() {
  return (
    <header className="header">
      <h1>Beach Track Club</h1>
      <div className="actions">
        {/* TODO: wire up once auth/database is in place */}
        <button className="sign-in">Sign In</button>
        <button className="sign-up">Sign Up</button>
      </div>
    </header>
  );
}
