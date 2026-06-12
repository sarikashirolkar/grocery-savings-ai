// Buy screen — interactive. Pick a store per item; the Final buy plan recomputes live.
(function () {
  const { C, sans, serif, tnum, rupee, Micro, Card, CardHead, Btn } = window.LX;

  window.ScreenBuy = function ScreenBuy() {
    const basket = window.APP.basket;
    const [active, setActive] = React.useState(basket[0].id);
    const [picks, setPicks] = React.useState({ milk: "Dmart" }); // start with one chosen

    const itemById = (id) => basket.find((b) => b.id === id);
    const bestOf = (it) => it.options.find((o) => o.best) || it.options[0];
    const optionOf = (it, store) => it.options.find((o) => o.store === store);

    const pick = (itemId, store) => setPicks((p) => ({ ...p, [itemId]: store }));
    const chooseBestForAll = () => setPicks(Object.fromEntries(basket.map((it) => [it.id, bestOf(it).store])));

    const expected = basket.reduce((s, it) => s + it.avg * it.qty, 0);
    const selected = basket.reduce((s, it) => {
      const o = picks[it.id] ? optionOf(it, picks[it.id]) : null;
      return s + (o ? o.offer * it.qty : it.avg * it.qty);
    }, 0);
    const chosenCount = basket.filter((it) => picks[it.id]).length;
    const storesUsed = [...new Set(basket.map((it) => picks[it.id]).filter(Boolean))];

    const act = itemById(active);
    const groups = basket.reduce((a, it) => ((a[it.cat] = a[it.cat] || []).push(it), a), {});

    return (
      <div>
        {/* Hero */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, padding: "26px 0 22px", borderBottom: `1px solid ${C.lineSoft}` }}>
          <div>
            <Micro style={{ color: C.rose }}>Primary workflow</Micro>
            <h1 style={{ fontFamily: serif, fontSize: 33, fontWeight: 500, letterSpacing: "-0.01em", color: C.taupe, margin: "9px 0 0", lineHeight: 1.08 }}>
              Predicted basket, priced across every outlet.
            </h1>
            <p style={{ fontFamily: sans, fontSize: 13.5, color: C.steel, margin: "8px 0 0", maxWidth: 600, lineHeight: 1.5 }}>
              Search any item, compare offers across five outlets, pick store by store — or let us choose the cheapest plan in one click.
            </p>
          </div>
          <div style={{ display: "flex", gap: 18, alignItems: "center", flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <Micro style={{ fontSize: 9.5, whiteSpace: "nowrap" }}>June 2026</Micro>
              <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 500, color: C.taupe, marginTop: 2, whiteSpace: "nowrap" }}>{basket.length} items</div>
            </div>
            <Btn kind="ghost">Refresh basket</Btn>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: "flex", gap: 12, paddingTop: 20 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${C.line}`, borderRadius: 4, padding: "0 14px", height: 44 }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={C.steel} strokeWidth="1.6"><circle cx="7" cy="7" r="5" /><path d="M11 11l3.5 3.5" strokeLinecap="round" /></svg>
            <input placeholder="Search any grocery item — not just recommended ones" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: sans, fontSize: 13.5, color: C.taupe }} />
          </div>
          <Btn kind="dark" style={{ padding: "0 22px", height: 44 }}>Search</Btn>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 12 }}>
          {window.APP.searchChips.map((c, i) => (
            <span key={c} style={{ fontFamily: sans, fontSize: 12, color: i === 0 ? C.taupe : C.steel,
              border: `1px solid ${i === 0 ? C.steel : C.line}`, background: C.card, borderRadius: 3, padding: "5px 11px" }}>{c}</span>
          ))}
        </div>

        {/* Three columns */}
        <div style={{ display: "grid", gridTemplateColumns: "0.95fr 1.25fr 0.92fr", gap: 18, alignItems: "start", paddingTop: 22, paddingBottom: 40 }}>
          {/* Basket */}
          <Card>
            <CardHead title="Recommended basket" right={<span style={{ fontFamily: sans, fontSize: 12, color: C.taupe, ...tnum }}>{String(basket.length).padStart(2, "0")}</span>} />
            <div style={{ padding: "4px 18px 14px" }}>
              {Object.entries(groups).map(([cat, items]) => (
                <div key={cat}>
                  <Micro style={{ fontSize: 9.5, margin: "14px 0 4px" }}>{cat}</Micro>
                  {items.map((it) => {
                    const on = active === it.id;
                    const pickedStore = picks[it.id];
                    return (
                      <button key={it.id} onClick={() => setActive(it.id)} style={{ width: "100%", textAlign: "left", cursor: "pointer",
                        display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 10px", marginLeft: -10, marginRight: -10,
                        border: "none", borderRadius: 4, background: on ? "rgba(219,127,142,0.08)" : "transparent",
                        boxShadow: on ? `inset 2px 0 0 ${C.rose}` : "none" }}>
                        <div>
                          <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 500, color: C.taupe }}>{it.name}</div>
                          <div style={{ fontFamily: sans, fontSize: 11, color: C.steel, marginTop: 3, ...tnum }}>Qty {it.qty} · avg {rupee(it.avg)}</div>
                        </div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: 11.5, fontWeight: 600, color: pickedStore ? C.taupe : C.steel }}>
                          <span style={{ width: 6, height: 6, borderRadius: 6, background: pickedStore ? C.rose : C.slate, display: "inline-block" }} />
                          {pickedStore || "pick store"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>

          {/* Comparison */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", borderBottom: `1px solid ${C.line}` }}>
              <div>
                <Micro>Price comparison</Micro>
                <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 500, color: C.taupe, marginTop: 3 }}>
                  {act.name} <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: C.steel }}>{act.meta}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Micro>Est. saving</Micro>
                <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: C.rose, marginTop: 1, ...tnum }}>
                  {rupee((act.avg - bestOf(act).offer) * act.qty)}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.7fr 0.9fr 1fr", padding: "10px 20px", borderBottom: `1px solid ${C.lineSoft}` }}>
              {["Outlet", "Offer", "Disc", "Fees", ""].map((h, i) => (
                <Micro key={i} style={{ fontSize: 9.5, textAlign: i === 0 ? "left" : "right" }}>{h}</Micro>
              ))}
            </div>
            {act.options.map((o) => {
              const chosen = picks[act.id] === o.store;
              return (
                <div key={o.store} style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.7fr 0.9fr 1fr", alignItems: "center",
                  padding: "13px 20px", borderBottom: `1px solid ${C.lineSoft}`, background: chosen ? "rgba(219,127,142,0.06)" : "transparent" }}>
                  <div>
                    <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 500, color: C.taupe, display: "flex", alignItems: "center", gap: 8 }}>
                      {o.store}
                      {o.best && <span style={{ fontFamily: sans, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: C.card, background: C.rose, padding: "2px 6px", borderRadius: 3 }}>BEST</span>}
                    </div>
                    <div style={{ fontFamily: sans, fontSize: 10.5, color: C.steel, marginTop: 2 }}>{o.why} · {o.stock}</div>
                  </div>
                  <div style={{ fontFamily: serif, fontSize: 17, color: C.taupe, textAlign: "right", ...tnum }}>{rupee(o.offer)}</div>
                  <div style={{ fontFamily: sans, fontSize: 13, color: C.steel, textAlign: "right", ...tnum }}>{o.disc}%</div>
                  <div style={{ fontFamily: sans, fontSize: 13, color: C.steel, textAlign: "right", ...tnum }}>{o.fees ? rupee(o.fees) : "—"}</div>
                  <div style={{ textAlign: "right" }}>
                    <Btn kind={chosen ? "primary" : "quiet"} onClick={() => pick(act.id, o.store)} style={{ padding: "7px 14px", fontSize: 11.5 }}>
                      {chosen ? "Chosen" : "Choose"}
                    </Btn>
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Plan */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Card style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Micro>Final buy plan</Micro>
                <span style={{ fontFamily: sans, fontSize: 11, color: C.steel, ...tnum }}>{chosenCount} / {basket.length} set</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: C.line, border: `1px solid ${C.line}`, borderRadius: 4, marginTop: 14, overflow: "hidden" }}>
                <div style={{ background: C.card, padding: "13px 14px" }}>
                  <Micro style={{ fontSize: 9.5 }}>Expected</Micro>
                  <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 500, color: C.taupe, marginTop: 4, ...tnum }}>{rupee(expected)}</div>
                </div>
                <div style={{ background: C.card, padding: "13px 14px" }}>
                  <Micro style={{ fontSize: 9.5 }}>Selected</Micro>
                  <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 500, color: C.rose, marginTop: 4, ...tnum }}>{rupee(selected)}</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 13 }}>
                <Micro style={{ fontSize: 9.5 }}>You save</Micro>
                <span style={{ fontFamily: serif, fontSize: 17, color: C.taupe, ...tnum }}>{rupee(expected - selected)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 9, paddingTop: 11, borderTop: `1px solid ${C.lineSoft}` }}>
                <Micro style={{ fontSize: 9.5 }}>Stores used</Micro>
                <span style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: storesUsed.length ? C.taupe : C.steel }}>{storesUsed.join(", ") || "none yet"}</span>
              </div>
              <Btn onClick={chooseBestForAll} style={{ width: "100%", marginTop: 16, padding: "12px 0" }}>Choose best for all</Btn>
            </Card>
            <Card>
              <CardHead title="Chosen items" />
              <div style={{ padding: "4px 18px 12px" }}>
                {basket.map((it) => {
                  const o = picks[it.id] ? it.options.find((x) => x.store === picks[it.id]) : null;
                  return (
                    <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
                      <div>
                        <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 500, color: C.taupe }}>{it.name}</div>
                        <div style={{ fontFamily: sans, fontSize: 10.5, color: C.steel, marginTop: 2 }}>{picks[it.id] || "unset"}</div>
                      </div>
                      <div style={{ fontFamily: serif, fontSize: 16, color: o ? C.taupe : C.steel, ...tnum }}>{o ? rupee(o.offer * it.qty) : "—"}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };
})();
