import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useInventory } from "../data/useInventory";

export function Home() {
  const [query, setQuery] = useState("");
  const { categories: inventory, loading } = useInventory();

  const categories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inventory;
    return inventory
      .map((category) => ({
        ...category,
        circuits: category.circuits.filter((circuit) => circuit.name.toLowerCase().includes(q)),
      }))
      .filter((category) => category.circuits.length > 0);
  }, [query, inventory]);

  return (
    <div>
      <div className="page-hero">
        <h2>Training Inventory</h2>
        <div className="search-bar">
          <input
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <Link className="pilot-banner" to="/video-library">
        <span>🎬 New: Sprint Drills <b>Video Library</b> (preview)</span>
        <span className="chevron">&gt;</span>
      </Link>

      {loading && categories.length === 0 && (
        <div className="empty-state">Loading…</div>
      )}

      {categories.map((category) => (
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

      <div style={{ height: 24 }} />
    </div>
  );
}
