// Option A — "Market Press": editorial / serif / warm paper. Single Old Rose accent.
(function () {
  const C = {
    paper: "#FBF5F2",   // warm paper (lightened Soft Blush)
    blush: "#FFDBDA",
    rose:  "#DB7F8E",
    slate: "#D5C5C8",
    steel: "#9DA3A4",
    taupe: "#604D53",
    ink:   "#3E3236",   // darkened taupe for headlines
  };
  const serif = "'Newsreader', Georgia, serif";
  const sans  = "'Public Sans', system-ui, sans-serif";
  const G = () => window.GROCERY;

  const Eyebrow = ({ children, color }) => (
    <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.28em",
      textTransform: "uppercase", color: color || C.rose }}>{children}</div>
  );

  const Rule = ({ color, mt, mb }) => (
    <div style={{ height: 1, background: color || "rgba(96,77,83,0.16)", marginTop: mt, marginBottom: mb }} />
  );

  function Basket() {
    const g = G();
    const groups = g.basket.reduce((a, it) => ((a[it.cat] = a[it.cat] || []).push(it), a), {});
    return (
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h3 style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: C.ink, margin: 0 }}>Recommended basket</h3>
          <span style={{ fontFamily: sans, fontSize: 12, color: C.steel, letterSpacing: "0.04em" }}>3 ITEMS</span>
        </div>
        <Rule mt={14} mb={0} />
        {Object.entries(groups).map(([cat, items]) => (
          <div key={cat}>
            <div style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: "0.26em",
              textTransform: "uppercase", color: C.steel, margin: "18px 0 10px" }}>{cat}</div>
            {items.map((it) => (
              <div key={it.name} style={{ padding: "10px 0", borderTop: items.indexOf(it) ? "1px solid rgba(96,77,83,0.10)" : "none",
                background: it.active ? "linear-gradient(90deg, rgba(219,127,142,0.07), transparent 70%)" : "none",
                paddingLeft: it.active ? 12 : 0, marginLeft: it.active ? -12 : 0,
                borderLeft: it.active ? `2px solid ${C.rose}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontFamily: serif, fontSize: 19, color: C.ink }}>{it.name}</div>
                  <div style={{ fontFamily: serif, fontSize: 14, color: C.taupe, fontStyle: "italic" }}>{it.active ? "Dmart" : "pick store"}</div>
                </div>
                <div style={{ display: "flex", gap: 18, marginTop: 4, fontFamily: sans, fontSize: 12.5, color: C.steel }}>
                  <span>Qty {it.qty}</span>
                  <span>Avg ₹{it.avg}</span>
                  <span style={{ color: C.rose, fontWeight: 600 }}>Best · {it.best}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  function Compare() {
    const g = G();
    return (
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h3 style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: C.ink, margin: 0 }}>{g.compareItem}</h3>
          <span style={{ fontFamily: sans, fontSize: 12, color: C.taupe }}>Saving <span style={{ color: C.rose, fontWeight: 700 }}>₹40</span></span>
        </div>
        <div style={{ fontFamily: sans, fontSize: 12.5, color: C.steel, marginTop: 4 }}>
          Cheapest outlet <span style={{ color: C.taupe, fontWeight: 600 }}>Dmart</span> · Amul · 1L
        </div>
        <Rule mt={16} mb={0} />
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr 0.7fr 0.9fr", fontFamily: sans, fontSize: 10,
          fontWeight: 700, letterSpacing: "0.18em", color: C.steel, textTransform: "uppercase", padding: "12px 0" }}>
          <span>Outlet</span><span style={{ textAlign: "right" }}>Offer</span><span style={{ textAlign: "right" }}>Fees</span><span style={{ textAlign: "right" }}></span>
        </div>
        {g.compareRows.map((r) => (
          <div key={r.store} style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr 0.7fr 0.9fr", alignItems: "center",
            padding: "14px 0", borderTop: "1px solid rgba(96,77,83,0.10)" }}>
            <div>
              <div style={{ fontFamily: serif, fontSize: 18, color: C.ink, display: "flex", alignItems: "center", gap: 8 }}>
                {r.store}
                {r.best && <span style={{ fontFamily: sans, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em",
                  color: C.paper, background: C.rose, padding: "2px 7px" }}>BEST</span>}
              </div>
              <div style={{ fontFamily: sans, fontSize: 11.5, color: C.steel, marginTop: 3 }}>{r.why} · {r.stock}</div>
            </div>
            <div style={{ fontFamily: serif, fontSize: 18, color: C.ink, textAlign: "right" }}>₹{r.price}</div>
            <div style={{ fontFamily: sans, fontSize: 13, color: C.taupe, textAlign: "right" }}>₹{r.fees}</div>
            <div style={{ textAlign: "right" }}>
              <button style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", cursor: "pointer",
                padding: "7px 14px", border: r.chosen ? "none" : `1px solid ${C.taupe}`,
                background: r.chosen ? C.rose : "transparent", color: r.chosen ? C.paper : C.taupe }}>
                {r.chosen ? "Chosen" : "Choose"}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function Plan() {
    const g = G();
    const stat = (label, val, accent) => (
      <div style={{ padding: "12px 0", borderTop: "1px solid rgba(96,77,83,0.10)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.steel }}>{label}</span>
        <span style={{ fontFamily: serif, fontSize: 22, color: accent ? C.rose : C.ink }}>{val}</span>
      </div>
    );
    return (
      <div>
        <h3 style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: C.ink, margin: 0 }}>Final buy plan</h3>
        <div style={{ marginTop: 14 }}>
          {stat("Expected spend", "₹" + g.plan.expected.toLocaleString("en-IN"))}
          {stat("Selected spend", "₹" + g.plan.selected, true)}
          {stat("Stores used", g.plan.stores)}
        </div>
        <button style={{ width: "100%", marginTop: 18, padding: "13px 0", border: "none", cursor: "pointer",
          background: C.rose, color: C.paper, fontFamily: sans, fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Choose best for all
        </button>
        <div style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase",
          color: C.steel, margin: "26px 0 4px" }}>Chosen items</div>
        {g.chosen.map((c) => (
          <div key={c.item} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
            padding: "11px 0", borderTop: "1px solid rgba(96,77,83,0.10)" }}>
            <div>
              <div style={{ fontFamily: serif, fontSize: 16, color: C.ink }}>{c.item}</div>
              <div style={{ fontFamily: sans, fontSize: 11.5, color: C.steel, fontStyle: c.price ? "normal" : "italic" }}>{c.outlet === "—" ? "not chosen yet" : c.outlet}</div>
            </div>
            <div style={{ fontFamily: serif, fontSize: 16, color: c.price ? C.ink : C.steel }}>{c.price ? "₹" + c.price : "—"}</div>
          </div>
        ))}
      </div>
    );
  }

  window.OptionMarketPress = function OptionMarketPress() {
    const g = G();
    return (
      <div style={{ width: "100%", minHeight: "100%", background: C.paper, fontFamily: sans, color: C.taupe }}>
        {/* Masthead */}
        <div style={{ padding: "26px 44px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: sans, fontSize: 10, fontWeight: 600, letterSpacing: "0.34em", color: C.steel, textTransform: "uppercase" }}>Est. 2026 · Bengaluru</div>
              <div style={{ fontFamily: serif, fontSize: 30, fontWeight: 600, color: C.ink, letterSpacing: "-0.01em", marginTop: 4 }}>Grocery&nbsp;Savings&nbsp;<span style={{ fontStyle: "italic", color: C.rose }}>AI</span></div>
            </div>
            <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
              {g.nav.map((n, i) => (
                <span key={n} style={{ fontFamily: sans, fontSize: 12, fontWeight: i === 0 ? 700 : 500, letterSpacing: "0.14em",
                  textTransform: "uppercase", color: i === 0 ? C.ink : C.taupe,
                  borderBottom: i === 0 ? `2px solid ${C.rose}` : "2px solid transparent", paddingBottom: 4 }}>{n}</span>
              ))}
              <span style={{ fontFamily: sans, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: C.steel }}>Sign out</span>
            </div>
          </div>
          <div style={{ height: 2, background: C.ink, marginTop: 16 }} />
          <div style={{ height: 1, background: "rgba(96,77,83,0.25)", marginTop: 2 }} />
        </div>

        {/* Hero */}
        <div style={{ padding: "30px 44px 24px", display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 40, alignItems: "end" }}>
          <div>
            <Eyebrow>The Buy Desk — Primary Workflow</Eyebrow>
            <h1 style={{ fontFamily: serif, fontSize: 46, fontWeight: 500, lineHeight: 1.04, color: C.ink, letterSpacing: "-0.015em", margin: "12px 0 0", maxWidth: 640 }}>
              Your predicted basket, priced across <span style={{ fontStyle: "italic", color: C.rose }}>every outlet</span>.
            </h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: serif, fontSize: 15, color: C.taupe, lineHeight: 1.6 }}>
              June 2026 edition<br />3 items · ₹2,780 expected
            </div>
            <button style={{ marginTop: 14, padding: "12px 22px", border: `1px solid ${C.ink}`, background: C.ink, color: C.paper,
              fontFamily: sans, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
              Refresh basket
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "0 44px 26px" }}>
          <div style={{ display: "flex", gap: 0, border: `1px solid ${C.taupe}` }}>
            <input defaultValue="" placeholder="Search any item — milk, basmati rice, detergent…"
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", padding: "14px 18px",
                fontFamily: serif, fontSize: 16, color: C.ink }} />
            <button style={{ border: "none", background: C.rose, color: C.paper, padding: "0 26px", cursor: "pointer",
              fontFamily: sans, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Search</button>
          </div>
          <div style={{ marginTop: 12, fontFamily: sans, fontSize: 12.5, color: C.steel }}>
            Recent — <span style={{ color: C.taupe, textDecoration: "underline", textUnderlineOffset: 3 }}>milk</span>&nbsp;&nbsp;·&nbsp;&nbsp;
            <span style={{ color: C.taupe, textDecoration: "underline", textUnderlineOffset: 3 }}>basmati rice</span>&nbsp;&nbsp;·&nbsp;&nbsp;
            <span style={{ color: C.taupe, textDecoration: "underline", textUnderlineOffset: 3 }}>detergent</span>
          </div>
        </div>

        {/* Three columns, newspaper rules */}
        <div style={{ padding: "8px 44px 44px", display: "grid", gridTemplateColumns: "1fr 1.18fr 0.92fr", gap: 0, borderTop: `2px solid ${C.ink}` }}>
          <div style={{ padding: 0, paddingRight: 32, paddingTop: 26 }}><Basket /></div>
          <div style={{ paddingLeft: 32, paddingRight: 32, paddingTop: 26, borderLeft: "1px solid rgba(96,77,83,0.18)" }}><Compare /></div>
          <div style={{ paddingLeft: 32, paddingTop: 26, borderLeft: "1px solid rgba(96,77,83,0.18)" }}><Plan /></div>
        </div>
      </div>
    );
  };
})();
