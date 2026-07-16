import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useInventory } from "../data/useInventory";
import { useVideos } from "../data/useVideos";

export function Home() {
  const [query, setQuery] = useState("");
  const { categories: inventory, loading } = useInventory();
  const { videos } = useVideos();
  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return null;
    const exercises: { ex: any; ci: any; cat: any }[] = [];
    const circuits: { ci: any; cat: any }[] = [];
    for (const cat of inventory) {
      for (const ci of cat.circuits) {
        if (ci.name.toLowerCase().includes(q)) circuits.push({ ci, cat });
        for (const ex of ci.exercises) {
          if (ex.name.toLowerCase().includes(q)) exercises.push({ ex, ci, cat });
        }
      }
    }
    const clips = videos.filter((v) => !v.hidden && v.name.toLowerCase().includes(q));
    return { exercises, circuits, clips };
  }, [q, inventory, videos]);

  const total = results
    ? results.exercises.length + results.circuits.length + results.clips.length
    : 0;

  return (
    <div>
      <div className="page-hero">
        <h2>Training Inventory</h2>
        <p>Search drills, exercises, and videos</p>
        <div className="search-bar">
          <span className="search-icon">⌕</span>
          <input
            placeholder="Search exercises, circuits, videos…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>
      </div>

      {results ? (
        <div className="search-results">
          <div className="results-count">
            {total} result{total === 1 ? "" : "s"} for “{query.trim()}”
          </div>

          {results.exercises.length > 0 && (
            <section className="category-section">
              <h3>Exercises · {results.exercises.length}</h3>
              <div className="list">
                {results.exercises.map(({ ex, ci, cat }) => (
                  <Link
                    className="list-row"
                    to={`/circuit/${ci.id}/exercise/${ex.id}`}
                    key={`${ci.id}-${ex.id}`}
                  >
                    <span
                      className="thumb"
                      style={ex.mediaUrl ? { backgroundImage: `url(${ex.mediaUrl})` } : undefined}
                    />
                    <span className="label">
                      {ex.name}
                      <span className="result-meta">
                        {cat.name} · {ci.name}
                      </span>
                    </span>
                    <span className="chevron">&gt;</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.circuits.length > 0 && (
            <section className="category-section">
              <h3>Circuits · {results.circuits.length}</h3>
              <div className="list">
                {results.circuits.map(({ ci, cat }) => (
                  <Link className="list-row" to={`/circuit/${ci.id}`} key={ci.id}>
                    <span className="label">
                      {ci.name}
                      <span className="result-meta">
                        {cat.name} · {ci.exercises.length} exercises
                      </span>
                    </span>
                    <span className="chevron">&gt;</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.clips.length > 0 && (
            <section className="category-section">
              <h3>Videos · {results.clips.length}</h3>
              <div className="list">
                {results.clips.map((c) => (
                  <Link
                    className="list-row"
                    to={`/video-library?focus=${encodeURIComponent(c.slug ?? String(c.id))}`}
                    key={c.id ?? c.videoUrl}
                  >
                    <span className="thumb thumb-video">▶</span>
                    <span className="label">
                      {c.name}
                      <span className="result-meta">Video · {c.category}</span>
                    </span>
                    <span className="chevron">&gt;</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {total === 0 && (
            <div className="empty-state">No matches for “{query.trim()}”. Try another word.</div>
          )}
        </div>
      ) : (
        <>
          <Link className="pilot-banner" to="/video-library">
            <span>
              🎬 <b>Video Library</b> — coaching clips by category
            </span>
            <span className="chevron">&gt;</span>
          </Link>

          {loading && inventory.length === 0 && <div className="empty-state">Loading…</div>}

          {inventory.map((category) => (
            <section className="category-section" key={category.id}>
              <h3>{category.name}</h3>
              <div className="list">
                {category.circuits.map((circuit) => (
                  <Link className="list-row" to={`/circuit/${circuit.id}`} key={circuit.id}>
                    <span className="label">{circuit.name}</span>
                    <span className="chevron">&gt;</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}
