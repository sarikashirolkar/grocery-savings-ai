// Option B — "Ledger" (refined): Swiss utility layout + Option A's type system.
// Newsreader serif for headlines / names / key figures, Public Sans for labels,
// captions, buttons & dense data (tabular figures keep columns aligned).
// Neutral Pale Slate / Cool Steel; Old Rose used ONLY for primary action + best marker.
(function () {
  const C = {
    canvas: "#ECEAE8",  // warm off-white (derived from Pale Slate)
    card:   "#FFFFFF",
    blush:  "#FFDBDA",
    rose:   "#DB7F8E",
    slate:  "#D5C5C8",
    steel:  "#9DA3A4",
    taupe:  "#604D53",
    line:   "rgba(157,163,164,0.45)",
    lineSoft: "rgba(157,163,164,0.28)",
  };
  const sans  = "'Public Sans', system-ui, sans-serif";
  const serif = "'Newsreader', Georgia, serif";
  const tnum  = { fontVariantNumeric: "tabular-nums" };
  const G = () => window.GROCERY;

  const Micro = ({ children, style }) => (
    <div style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em",
      textTransform: "uppercase", color: C.steel, ...style }}>{children}</div>
  );

  const Card = ({ children, style }) => (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 4, ...style }}>{children}</div>
  );

  function Basket() {
    const g = G();
    const groups = g.basket.reduce((a, it) => ((a[it.cat] = a[it.cat] || []).push(it), a), {});
    return (
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: `1px solid ${C.line}` }}>
          <Micro>Recommended basket</Micro>
          <span style={{ fontFamily: sans, fontSize: 12, color: C.taupe, ...tnum }}>03</span>
        </div>
        <div style={{ padding: "4px 18px 14px" }}>
          {Object.entries(groups).map(([cat, items]) => (
            <div key={cat}>
              <Micro style={{ fontSize: 9.5, color: C.steel, margin: "14px 0 6px" }}>{cat}</Micro>
              {items.map((it) => (
                <div key={it.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 10px", marginLeft: -10, marginRight: -10, borderRadius: 4,
                  background: it.active ? "rgba(219,127,142,0.08)" : "transparent",
                  boxShadow: it.active ? `inset 2px 0 0 ${C.rose}` : "none" }}>
                  <div>
                    <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 500, color: C.taupe }}>{it.name}</div>
                    <div style={{ fontFamily: sans, fontSize: 11, color: C.steel, marginTop: 3, ...tnum }}>Qty {it.qty} · avg ₹{it.avg}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: 11.5, fontWeight: 600, color: C.taupe }}>
                      <span style={{ width: 6, height: 6, borderRadius: 6, background: C.rose, display: "inline-block" }} />{it.best}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    );
  }

  function Compare() {
    const g = G();
    return (
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${C.line}` }}>
          <div>
            <Micro>Price comparison</Micro>
            <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 500, color: C.taupe, marginTop: 4 }}>{g.compareItem} <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: C.steel }}>Amul · 1L</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <Micro>Est. saving</Micro>
            <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: C.rose, marginTop: 2, ...tnum }}>₹40</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.7fr 0.9fr 1fr", padding: "10px 20px", borderBottom: `1px solid ${C.lineSoft}` }}>
          {["Outlet", "Offer", "Disc", "Fees", ""].map((h, i) => (
            <Micro key={i} style={{ fontSize: 9.5, textAlign: i === 0 ? "left" : "right" }}>{h}</Micro>
          ))}
        </div>
        {g.compareRows.map((r) => (
          <div key={r.store} style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.7fr 0.9fr 1fr", alignItems: "center",
            padding: "13px 20px", borderBottom: `1px solid ${C.lineSoft}`, background: r.best ? "rgba(219,127,142,0.05)" : "transparent" }}>
            <div>
              <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 500, color: C.taupe, display: "flex", alignItems: "center", gap: 8 }}>
                {r.store}
                {r.best && <span style={{ fontFamily: sans, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: C.card, background: C.rose, padding: "2px 6px", borderRadius: 3 }}>BEST</span>}
              </div>
              <div style={{ fontFamily: sans, fontSize: 10.5, color: C.steel, marginTop: 2 }}>{r.stock}</div>
            </div>
            <div style={{ fontFamily: serif, fontSize: 17, color: C.taupe, textAlign: "right", ...tnum }}>₹{r.price}</div>
            <div style={{ fontFamily: sans, fontSize: 13, color: C.steel, textAlign: "right", ...tnum }}>{r.disc}%</div>
            <div style={{ fontFamily: sans, fontSize: 13, color: C.steel, textAlign: "right", ...tnum }}>₹{r.fees}</div>
            <div style={{ textAlign: "right" }}>
              <button style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 600, cursor: "pointer", borderRadius: 3, padding: "7px 13px",
                border: r.chosen ? "none" : `1px solid ${C.steel}`, background: r.chosen ? C.rose : C.card, color: r.chosen ? C.card : C.taupe }}>
                {r.chosen ? "Chosen" : "Choose"}
              </button>
            </div>
          </div>
        ))}
      </Card>
    );
  }

  function Plan() {
    const g = G();
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Micro>Final buy plan</Micro>
            <span style={{ fontFamily: sans, fontSize: 11, color: C.steel, ...tnum }}>1 / 3 set</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: C.line, border: `1px solid ${C.line}`, borderRadius: 4, marginTop: 14, overflow: "hidden" }}>
            <div style={{ background: C.card, padding: "14px" }}>
              <Micro style={{ fontSize: 9.5 }}>Expected</Micro>
              <div style={{ fontFamily: serif, fontSize: 25, fontWeight: 500, color: C.taupe, marginTop: 4, ...tnum }}>₹{g.plan.expected.toLocaleString("en-IN")}</div>
            </div>
            <div style={{ background: C.card, padding: "14px" }}>
              <Micro style={{ fontSize: 9.5 }}>Selected</Micro>
              <div style={{ fontFamily: serif, fontSize: 25, fontWeight: 500, color: C.rose, marginTop: 4, ...tnum }}>₹{g.plan.selected}</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
            <Micro style={{ fontSize: 9.5 }}>Stores used</Micro>
            <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.taupe }}>{g.plan.stores}</span>
          </div>
          <button style={{ width: "100%", marginTop: 16, padding: "12px 0", border: "none", borderRadius: 4, cursor: "pointer",
            background: C.rose, color: C.card, fontFamily: sans, fontSize: 13, fontWeight: 700, letterSpacing: "0.02em" }}>
            Choose best for all
          </button>
        </Card>
        <Card>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.line}` }}><Micro>Chosen items</Micro></div>
          <div style={{ padding: "4px 18px 12px" }}>
            {g.chosen.map((c) => (
              <div key={c.item} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
                <div>
                  <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 500, color: C.taupe }}>{c.item}</div>
                  <div style={{ fontFamily: sans, fontSize: 10.5, color: C.steel, marginTop: 2 }}>{c.outlet === "—" ? "unset" : c.outlet}</div>
                </div>
                <div style={{ fontFamily: serif, fontSize: 16, color: c.price ? C.taupe : C.steel, ...tnum }}>{c.price ? "₹" + c.price : "—"}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  window.OptionLedger = function OptionLedger() {
    const g = G();
    return (
      <div style={{ width: "100%", minHeight: "100%", background: C.canvas, fontFamily: sans, color: C.taupe }}>
        {/* Top bar */}
        <div style={{ background: C.card, borderBottom: `1px solid ${C.line}`, padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 62 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: 5, background: C.taupe, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 9, height: 9, background: C.rose, borderRadius: 2 }} />
              </div>
              <span style={{ fontFamily: serif, fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em", color: C.taupe }}>Grocery Savings</span>
              <span style={{ fontFamily: sans, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", color: C.steel, border: `1px solid ${C.line}`, borderRadius: 3, padding: "2px 5px", marginLeft: 2 }}>AI</span>
            </div>
            <div style={{ display: "flex", gap: 28, alignItems: "center", height: "100%" }}>
              {g.nav.map((n, i) => (
                <span key={n} style={{ fontFamily: sans, fontSize: 13, fontWeight: i === 0 ? 600 : 500, color: i === 0 ? C.taupe : C.steel,
                  height: "100%", display: "flex", alignItems: "center", borderBottom: i === 0 ? `2px solid ${C.rose}` : "2px solid transparent" }}>{n}</span>
              ))}
            </div>
            <span style={{ fontFamily: sans, fontSize: 12.5, color: C.steel }}>Sign out</span>
          </div>
        </div>

        {/* Hero strip */}
        <div style={{ padding: "26px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.lineSoft}` }}>
          <div>
            <Micro style={{ color: C.rose }}>Primary workflow</Micro>
            <h1 style={{ fontFamily: serif, fontSize: 32, fontWeight: 500, letterSpacing: "-0.01em", color: C.taupe, margin: "8px 0 0" }}>
              Predicted basket, priced across every outlet.
            </h1>
          </div>
          <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <Micro style={{ fontSize: 9.5 }}>Expected spend</Micro>
              <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 500, color: C.taupe, marginTop: 2, ...tnum }}>₹2,780</div>
            </div>
            <button style={{ padding: "11px 18px", border: `1px solid ${C.taupe}`, background: "transparent", color: C.taupe, borderRadius: 4,
              fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Refresh basket</button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "20px 32px 0", display: "flex", gap: 12 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${C.line}`, borderRadius: 4, padding: "0 14px", height: 42 }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={C.steel} strokeWidth="1.6"><circle cx="7" cy="7" r="5" /><path d="M11 11l3.5 3.5" strokeLinecap="round" /></svg>
            <input placeholder="Search any grocery item…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: sans, fontSize: 13.5, color: C.taupe }} />
          </div>
          <button style={{ padding: "0 20px", height: 42, border: "none", borderRadius: 4, background: C.taupe, color: C.card, fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Search</button>
        </div>
        <div style={{ padding: "12px 32px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Milk", "Basmati Rice", "Detergent", "Eggs", "Toor Dal"].map((c, i) => (
            <span key={c} style={{ fontFamily: sans, fontSize: 12, color: i === 0 ? C.taupe : C.steel, border: `1px solid ${i === 0 ? C.steel : C.line}`,
              background: C.card, borderRadius: 3, padding: "5px 11px" }}>{c}</span>
          ))}
        </div>

        {/* Three columns */}
        <div style={{ padding: "22px 32px 34px", display: "grid", gridTemplateColumns: "0.95fr 1.25fr 0.92fr", gap: 18, alignItems: "start" }}>
          <Basket /><Compare /><Plan />
        </div>
      </div>
    );
  };
})();
