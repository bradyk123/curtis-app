import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useInventory } from "../data/useInventory";
import { useVideos } from "../data/useVideos";
import { useProfile } from "../lib/profile";
import { useFlag } from "../data/useFlag";
import { updateInvRow, persistOrder } from "../data/inventoryAdmin";
import type { Category, Circuit } from "../types";

export function Home() {
  const [query, setQuery] = useState("");
  const { categories: inventory, loading, reload } = useInventory();
  const { videos } = useVideos();
  const { profile } = useProfile();
  const isAdmin = !!profile?.is_admin;
  const { enabled: videoOn } = useFlag("video_library");
  const videosVisible = videoOn || isAdmin;

  const [edit, setEdit] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const q = edit ? "" : query.trim().toLowerCase();

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
    const clips = videosVisible
      ? videos.filter((v) => !v.hidden && v.name.toLowerCase().includes(q))
      : [];
    return { exercises, circuits, clips };
  }, [q, inventory, videos, videosVisible]);

  const total = results
    ? results.exercises.length + results.circuits.length + results.clips.length
    : 0;

  // In edit mode admins see everything (incl. hidden); otherwise only visible items.
  const cats = edit ? inventory : inventory.filter((c) => !c.hidden);
  const circuitsOf = (cat: Category) =>
    edit ? cat.circuits : cat.circuits.filter((c) => !c.hidden);

  const fail = (e?: string) => e && setMsg(`Couldn't save: ${e}`);

  const renameCat = async (c: Category, name: string) =>
    fail((await updateInvRow("categories", c.dbId!, { name })).error);
  const hideCat = async (c: Category) => {
    fail((await updateInvRow("categories", c.dbId!, { hidden: !c.hidden })).error);
    reload();
  };
  const moveCat = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= cats.length) return;
    const ids = cats.map((c) => c.dbId!);
    [ids[index], ids[j]] = [ids[j], ids[index]];
    fail((await persistOrder("categories", ids)).error);
    reload();
  };

  const renameCircuit = async (c: Circuit, name: string) =>
    fail((await updateInvRow("circuits", c.dbId!, { name })).error);
  const hideCircuit = async (c: Circuit) => {
    fail((await updateInvRow("circuits", c.dbId!, { hidden: !c.hidden })).error);
    reload();
  };
  const moveCircuit = async (cat: Category, index: number, dir: -1 | 1) => {
    const list = circuitsOf(cat);
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const ids = list.map((c) => c.dbId!);
    [ids[index], ids[j]] = [ids[j], ids[index]];
    fail((await persistOrder("circuits", ids)).error);
    reload();
  };

  return (
    <div>
      <div className="page-hero">
        <div className="hero-head">
          <h2>Training Inventory</h2>
          {isAdmin && (
            <button className={`vlib-edit-toggle${edit ? " on" : ""}`} onClick={() => setEdit((v) => !v)}>
              {edit ? "Done" : "Edit"}
            </button>
          )}
        </div>
        {!edit && <p>Search drills, exercises, and videos</p>}
        {!edit && (
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
        )}
        {edit && <p>Rename, reorder, or hide categories &amp; circuits. Athletes only see visible items.</p>}
      </div>

      {msg && <div className="vlib-msg">{msg}</div>}

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
                  <Link className="list-row" to={`/circuit/${ci.id}/exercise/${ex.id}`} key={`${ci.id}-${ex.id}`}>
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
          {!edit && videosVisible && (
            <Link className="pilot-banner" to="/video-library">
              <span>
                🎬 <b>Video Library</b> — coaching clips by category
                {!videoOn && <span className="hidden-tag"> · hidden from athletes</span>}
              </span>
              <span className="chevron">&gt;</span>
            </Link>
          )}

          {loading && inventory.length === 0 && <div className="empty-state">Loading…</div>}

          {cats.map((category, ci) => {
            const circuits = circuitsOf(category);
            return (
              <section className="category-section" key={category.id}>
                {edit ? (
                  <div className={`edit-head${category.hidden ? " row-hidden" : ""}`}>
                    <input
                      className="edit-title-input"
                      defaultValue={category.name}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== category.name) renameCat(category, v);
                      }}
                    />
                    <div className="row-actions">
                      <button className="icon-btn" disabled={ci === 0} onClick={() => moveCat(ci, -1)}>↑</button>
                      <button className="icon-btn" disabled={ci === cats.length - 1} onClick={() => moveCat(ci, 1)}>↓</button>
                      <button className="text-btn" onClick={() => hideCat(category)}>
                        {category.hidden ? "Show" : "Hide"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <h3>{category.name}</h3>
                )}
                <div className="list">
                  {circuits.map((circuit, i) =>
                    edit ? (
                      <div className={`list-row editing-row${circuit.hidden ? " row-hidden" : ""}`} key={circuit.id}>
                        <input
                          className="edit-row-input"
                          defaultValue={circuit.name}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v && v !== circuit.name) renameCircuit(circuit, v);
                          }}
                        />
                        <div className="row-actions">
                          <button className="icon-btn" disabled={i === 0} onClick={() => moveCircuit(category, i, -1)}>↑</button>
                          <button className="icon-btn" disabled={i === circuits.length - 1} onClick={() => moveCircuit(category, i, 1)}>↓</button>
                          <button className="text-btn" onClick={() => hideCircuit(circuit)}>
                            {circuit.hidden ? "Show" : "Hide"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <Link className="list-row" to={`/circuit/${circuit.id}`} key={circuit.id}>
                        <span className="label">{circuit.name}</span>
                        <span className="chevron">&gt;</span>
                      </Link>
                    )
                  )}
                </div>
              </section>
            );
          })}
        </>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}
