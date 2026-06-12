// Shared Ledger UI kit — theme tokens + primitives + top bar. Exports window.LX.
(function () {
  const C = {
    canvas: "#ECEAE8",
    card:   "#FFFFFF",
    blush:  "#FFDBDA",
    rose:   "#DB7F8E",
    roseDeep: "#C2667A",
    slate:  "#D5C5C8",
    steel:  "#9DA3A4",
    taupe:  "#604D53",
    ink:    "#43383C",
    line:   "rgba(157,163,164,0.45)",
    lineSoft: "rgba(157,163,164,0.26)",
  };
  const sans  = "'Public Sans', system-ui, sans-serif";
  const serif = "'Newsreader', Georgia, serif";
  const tnum  = { fontVariantNumeric: "tabular-nums" };
  const rupee = (n) => "₹" + Number(n).toLocaleString("en-IN");

  const Micro = ({ children, style }) => (
    <div style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em",
      textTransform: "uppercase", color: C.steel, ...style }}>{children}</div>
  );

  const Card = ({ children, style }) => (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 5, ...style }}>{children}</div>
  );

  const CardHead = ({ title, right, style }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "15px 18px", borderBottom: `1px solid ${C.line}`, ...style }}>
      <Micro>{title}</Micro>
      {right}
    </div>
  );

  function Btn({ children, kind = "primary", onClick, style }) {
    const base = { fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
      borderRadius: 4, padding: "10px 17px", transition: "background .12s, color .12s, border-color .12s", ...style };
    const kinds = {
      primary: { border: "none", background: C.rose, color: C.card },
      dark:    { border: "none", background: C.taupe, color: C.card },
      ghost:   { border: `1px solid ${C.taupe}`, background: "transparent", color: C.taupe },
      quiet:   { border: `1px solid ${C.line}`, background: C.card, color: C.taupe },
    };
    return <button onClick={onClick} style={{ ...base, ...kinds[kind] }}>{children}</button>;
  }

  // Page header: eyebrow + serif title + optional right slot
  function PageHead({ eyebrow, title, sub, right }) {
    return (
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24,
        padding: "26px 0 22px", borderBottom: `1px solid ${C.lineSoft}` }}>
        <div>
          {eyebrow && <Micro style={{ color: C.rose }}>{eyebrow}</Micro>}
          <h1 style={{ fontFamily: serif, fontSize: 33, fontWeight: 500, letterSpacing: "-0.01em",
            color: C.taupe, margin: eyebrow ? "9px 0 0" : 0, lineHeight: 1.08 }}>{title}</h1>
          {sub && <p style={{ fontFamily: sans, fontSize: 13.5, color: C.steel, margin: "8px 0 0", maxWidth: 620, lineHeight: 1.5 }}>{sub}</p>}
        </div>
        {right && <div style={{ flexShrink: 0 }}>{right}</div>}
      </div>
    );
  }

  function TopBar({ nav, active, onNav, onSignOut }) {
    return (
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: C.card, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 62 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 25, height: 25, borderRadius: 6, background: C.taupe, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 9, height: 9, background: C.rose, borderRadius: 2 }} />
            </div>
            <span style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", color: C.taupe }}>Grocery Savings</span>
            <span style={{ fontFamily: sans, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", color: C.steel, border: `1px solid ${C.line}`, borderRadius: 3, padding: "2px 5px", marginLeft: 2 }}>AI</span>
          </div>
          <div style={{ display: "flex", gap: 26, alignItems: "center", height: "100%" }}>
            {nav.map((n) => (
              <button key={n} onClick={() => onNav(n)} style={{ fontFamily: sans, fontSize: 13, fontWeight: n === active ? 600 : 500,
                color: n === active ? C.taupe : C.steel, height: "100%", display: "flex", alignItems: "center", gap: 0,
                background: "none", border: "none", cursor: "pointer", borderBottom: n === active ? `2px solid ${C.rose}` : "2px solid transparent" }}>{n}</button>
            ))}
          </div>
          <button onClick={onSignOut} style={{ fontFamily: sans, fontSize: 12.5, color: C.steel, background: "none", border: "none", cursor: "pointer" }}>Sign out</button>
        </div>
      </div>
    );
  }

  window.LX = { C, sans, serif, tnum, rupee, Micro, Card, CardHead, Btn, PageHead, TopBar };
})();
