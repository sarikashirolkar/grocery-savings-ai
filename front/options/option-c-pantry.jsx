// Option C — "Pantry": warm boutique. Soft Blush field, cream/white cards with ONE
// soft shadow (no glass blur, no gradient wash), Old Rose actions, Pale Slate chips.
(function () {
  const C = {
    field: "#FFE4E2",   // soft blush field (slightly deepened for contrast with cards)
    blush: "#FFDBDA",
    cream: "#FFF7F4",
    card:  "#FFFFFF",
    rose:  "#DB7F8E",
    roseDeep: "#C96A7B",
    slate: "#D5C5C8",
    steel: "#9DA3A4",
    taupe: "#604D53",
    soft:  "0 10px 30px rgba(96,77,83,0.10)",
  };
  const sans  = "'Mulish', system-ui, sans-serif";
  const serif = "'Newsreader', Georgia, serif";
  const G = () => window.GROCERY;

  const Card = ({ children, style }) => (
    <div style={{ background: C.card, borderRadius: 18, boxShadow: C.soft, ...style }}>{children}</div>
  );
  const Label = ({ children, style }) => (
    <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: C.steel, ...style }}>{children}</div>
  );

  function Basket() {
    const g = G();
    const groups = g.basket.reduce((a, it) => ((a[it.cat] = a[it.cat] || []).push(it), a), {});
    return (
      <Card style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ fontFamily: sans, fontSize: 17, fontWeight: 800, color: C.taupe, margin: 0 }}>Your basket</h3>
          <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 700, color: C.steel, background: C.blush, borderRadius: 20, padding: "4px 11px" }}>3 items</span>
        </div>
        {Object.entries(groups).map(([cat, items]) => (
          <div key={cat} style={{ marginTop: 14 }}>
            <Label style={{ marginBottom: 8 }}>{cat}</Label>
            {items.map((it) => (
              <div key={it.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8,
                background: it.active ? C.cream : "transparent", border: it.active ? `1.5px solid ${C.rose}` : "1.5px solid transparent",
                borderRadius: 14, padding: "11px 13px" }}>
                <div>
                  <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: C.taupe }}>{it.name}</div>
                  <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: C.steel, marginTop: 2 }}>Qty {it.qty} · usually ₹{it.avg}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 800, color: C.roseDeep, background: C.blush, borderRadius: 20, padding: "4px 10px" }}>{it.best}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </Card>
    );
  }

  function Compare() {
    const g = G();
    return (
      <Card style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <Label>Comparing</Label>
            <h3 style={{ fontFamily: sans, fontSize: 24, fontWeight: 800, color: C.taupe, margin: "6px 0 0" }}>{g.compareItem}</h3>
            <div style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: C.steel, marginTop: 3 }}>Amul · 1L · cheapest at Dmart</div>
          </div>
          <div style={{ background: C.rose, color: C.card, borderRadius: 14, padding: "10px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.85 }}>You save</div>
            <div style={{ fontFamily: sans, fontSize: 20, fontWeight: 800, marginTop: 2 }}>₹40</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {g.compareRows.map((r) => (
            <div key={r.store} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              border: `1.5px solid ${r.best ? C.rose : "#F0E3E1"}`, background: r.best ? C.cream : C.card,
              borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: C.blush, display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: sans, fontSize: 15, fontWeight: 800, color: C.roseDeep }}>{r.store[0]}</div>
                <div>
                  <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 800, color: C.taupe, display: "flex", alignItems: "center", gap: 7 }}>
                    {r.store}
                    {r.best && <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 800, letterSpacing: "0.04em", color: C.card, background: C.rose, borderRadius: 20, padding: "2px 9px" }}>BEST PICK</span>}
                  </div>
                  <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: C.steel, marginTop: 2 }}>{r.why} · {r.stock}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: sans, fontSize: 18, fontWeight: 800, color: C.taupe }}>₹{r.price}</div>
                  <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, color: C.steel }}>{r.disc}% off · +₹{r.fees}</div>
                </div>
                <button style={{ fontFamily: sans, fontSize: 13, fontWeight: 800, cursor: "pointer", borderRadius: 12, padding: "10px 18px",
                  border: r.chosen ? "none" : `1.5px solid ${C.slate}`, background: r.chosen ? C.rose : C.card, color: r.chosen ? C.card : C.taupe }}>
                  {r.chosen ? "Chosen" : "Choose"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  function Plan() {
    const g = G();
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card style={{ padding: 22 }}>
          <h3 style={{ fontFamily: sans, fontSize: 17, fontWeight: 800, color: C.taupe, margin: "0 0 14px" }}>Final buy plan</h3>
          <div style={{ background: C.cream, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Label>Expected</Label>
              <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.steel, textDecoration: "line-through" }}>₹{g.plan.expected.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <Label style={{ color: C.roseDeep }}>Selected</Label>
              <span style={{ fontFamily: sans, fontSize: 26, fontWeight: 800, color: C.roseDeep }}>₹{g.plan.selected}</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
            <Label>Stores used</Label>
            <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, color: C.taupe, background: C.blush, borderRadius: 20, padding: "4px 11px" }}>{g.plan.stores}</span>
          </div>
          <button style={{ width: "100%", marginTop: 18, padding: "14px 0", border: "none", borderRadius: 14, cursor: "pointer",
            background: C.rose, color: C.card, fontFamily: sans, fontSize: 14, fontWeight: 800 }}>
            Choose best for all →
          </button>
        </Card>
        <Card style={{ padding: 22 }}>
          <h3 style={{ fontFamily: sans, fontSize: 15, fontWeight: 800, color: C.taupe, margin: "0 0 6px" }}>Chosen items</h3>
          {g.chosen.map((c, i) => (
            <div key={c.item} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0",
              borderTop: i ? "1px solid #F1E6E4" : "none" }}>
              <div>
                <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.taupe }}>{c.item}</div>
                <div style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 600, color: C.steel }}>{c.outlet === "—" ? "tap to choose" : c.outlet}</div>
              </div>
              <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 800, color: c.price ? C.taupe : C.slate }}>{c.price ? "₹" + c.price : "—"}</div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  window.OptionPantry = function OptionPantry() {
    const g = G();
    return (
      <div style={{ width: "100%", minHeight: "100%", background: C.field, fontFamily: sans, color: C.taupe, padding: "22px 26px 30px" }}>
        {/* Top bar */}
        <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderRadius: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 38, height: 38, borderRadius: 13, background: C.rose, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.card} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
            <span style={{ fontFamily: serif, fontSize: 23, fontWeight: 600, color: C.taupe, fontStyle: "italic" }}>Grocery Savings</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", background: C.field, borderRadius: 20, padding: 5 }}>
            {g.nav.map((n, i) => (
              <span key={n} style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, color: i === 0 ? C.card : C.taupe,
                background: i === 0 ? C.rose : "transparent", borderRadius: 16, padding: "7px 15px" }}>{n}</span>
            ))}
          </div>
          <div style={{ width: 38, height: 38, borderRadius: 19, background: C.blush, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: sans, fontWeight: 800, color: C.roseDeep, fontSize: 14 }}>A</div>
        </Card>

        {/* Hero */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "26px 6px 22px" }}>
          <div>
            <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: C.roseDeep,
              background: C.card, borderRadius: 20, padding: "5px 13px", boxShadow: C.soft }}>This week's basket</span>
            <h1 style={{ fontFamily: serif, fontSize: 40, fontWeight: 600, lineHeight: 1.08, color: C.taupe, letterSpacing: "-0.01em", margin: "16px 0 0", maxWidth: 560 }}>
              Everything you'll need, at the <span style={{ fontStyle: "italic", color: C.roseDeep }}>best price</span> nearby.
            </h1>
            <p style={{ fontFamily: sans, fontSize: 14.5, fontWeight: 600, color: C.steel, margin: "12px 0 0", maxWidth: 520 }}>
              We predicted your June basket and priced every item across 5 outlets. Pick store by store, or let us choose.
            </p>
          </div>
          <button style={{ padding: "13px 22px", border: "none", borderRadius: 14, background: C.taupe, color: C.card, fontFamily: sans, fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: C.soft, whiteSpace: "nowrap" }}>↻ Refresh basket</button>
        </div>

        {/* Search */}
        <Card style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, borderRadius: 16, marginBottom: 8 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 11, padding: "0 12px" }}>
            <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke={C.steel} strokeWidth="1.8"><circle cx="7" cy="7" r="5" /><path d="M11 11l3.5 3.5" strokeLinecap="round" /></svg>
            <input placeholder="Search any grocery item — not just recommended ones" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: sans, fontSize: 14, fontWeight: 600, color: C.taupe }} />
          </div>
          <button style={{ padding: "12px 22px", border: "none", borderRadius: 12, background: C.rose, color: C.card, fontFamily: sans, fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>Search</button>
        </Card>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "8px 4px 0" }}>
          {["Milk", "Basmati Rice", "Detergent", "Eggs", "Toor Dal", "Tomato"].map((c, i) => (
            <span key={c} style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, color: i === 0 ? C.card : C.taupe,
              background: i === 0 ? C.rose : C.slate, borderRadius: 20, padding: "6px 14px" }}>{c}</span>
          ))}
        </div>

        {/* Three columns */}
        <div style={{ display: "grid", gridTemplateColumns: "0.95fr 1.3fr 0.9fr", gap: 18, alignItems: "start", marginTop: 18 }}>
          <Basket /><Compare /><Plan />
        </div>
      </div>
    );
  };
})();
