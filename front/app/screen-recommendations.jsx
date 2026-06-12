// Recommendations screen — the weighted strategy result.
(function () {
  const { C, sans, serif, tnum, rupee, Micro, Card, CardHead, Btn, PageHead } = window.LX;

  function Stat({ label, value, accent, big }) {
    return (
      <div style={{ flex: 1 }}>
        <Micro style={{ fontSize: 9.5 }}>{label}</Micro>
        <div style={{ fontFamily: serif, fontSize: big ? 30 : 22, fontWeight: 500, color: accent ? C.rose : C.taupe, marginTop: 6, ...tnum }}>{value}</div>
      </div>
    );
  }

  window.ScreenRecommendations = function ScreenRecommendations() {
    const r = window.APP.recommendation;
    return (
      <div style={{ paddingBottom: 40 }}>
        <PageHead eyebrow="Optimizer" title="Recommendation"
          sub="The plan after weighting price, discounts, delivery fees, travel, and stockout risk against your convenience limit."
          right={<Btn>Regenerate</Btn>} />

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, paddingTop: 18 }}>
          {/* Headline result */}
          <Card style={{ padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: 7, background: C.rose }} />
              <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.taupe }}>Strategy · {r.strategy}</span>
            </div>
            <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 500, color: C.taupe, margin: "16px 0 0", lineHeight: 1.15 }}>
              Spend <span style={{ color: C.rose }}>{rupee(r.optimizedSpend)}</span> instead of {rupee(r.expectedSpend)} this cycle — a saving of {rupee(r.estimatedSaving)}.
            </h2>
            <div style={{ display: "flex", gap: 0, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.lineSoft}` }}>
              <Stat label="Optimized spend" value={rupee(r.optimizedSpend)} accent big />
              <Stat label="You save" value={rupee(r.estimatedSaving)} big />
              <Stat label="Savings rate" value={r.savingsPct + "%"} big />
            </div>
          </Card>

          {/* Single vs multi */}
          <Card>
            <CardHead title="Single vs multi-store" />
            <div style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
                <div>
                  <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 500, color: C.taupe }}>Best single store</div>
                  <div style={{ fontFamily: sans, fontSize: 11.5, color: C.steel, marginTop: 2 }}>{r.bestSingleStore} · one delivery</div>
                </div>
                <span style={{ fontFamily: serif, fontSize: 18, color: C.taupe, ...tnum }}>{rupee(r.singleStoreCost)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: `1px solid ${C.lineSoft}`, background: "rgba(219,127,142,0.06)", margin: "0 -20px", paddingLeft: 20, paddingRight: 20 }}>
                <div>
                  <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 500, color: C.taupe, display: "flex", alignItems: "center", gap: 8 }}>
                    Multi-store plan
                    <span style={{ fontFamily: sans, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: C.card, background: C.rose, padding: "2px 6px", borderRadius: 3 }}>CHOSEN</span>
                  </div>
                  <div style={{ fontFamily: sans, fontSize: 11.5, color: C.steel, marginTop: 2 }}>two outlets</div>
                </div>
                <span style={{ fontFamily: serif, fontSize: 18, color: C.rose, ...tnum }}>{rupee(r.multiStoreCost)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Split + convenience */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, paddingTop: 18 }}>
          <Card>
            <CardHead title="Recommended split" />
            <div style={{ padding: "18px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {r.split.map((s) => (
                <div key={s.store} style={{ border: `1px solid ${C.line}`, borderRadius: 5, padding: "16px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: serif, fontSize: 18, fontWeight: 500, color: C.taupe }}>{s.store}</span>
                    <span style={{ fontFamily: serif, fontSize: 16, color: C.taupe, ...tnum }}>{rupee(s.cost)}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
                    {s.items.map((it) => (
                      <span key={it} style={{ fontFamily: sans, fontSize: 11.5, color: C.taupe, background: C.canvas, border: `1px solid ${C.line}`, borderRadius: 4, padding: "5px 10px", whiteSpace: "nowrap" }}>{it}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ background: C.taupe, border: "none" }}>
            <div style={{ padding: "22px 22px" }}>
              <Micro style={{ color: C.blush }}>Convenience note</Micro>
              <p style={{ fontFamily: serif, fontSize: 18, fontWeight: 400, color: C.card, lineHeight: 1.5, margin: "14px 0 0" }}>{r.convenience}</p>
            </div>
          </Card>
        </div>
      </div>
    );
  };
})();
