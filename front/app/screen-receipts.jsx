// Receipts screen — ledger-style table with expandable item lists.
(function () {
  const { C, sans, serif, tnum, rupee, Micro, Card, Btn, PageHead } = window.LX;

  const typeTone = { image: C.steel, pdf: C.taupe, manual: C.roseDeep };

  window.ScreenReceipts = function ScreenReceipts() {
    const data = window.APP.receipts;
    const [open, setOpen] = React.useState(data[0].id);
    const total = data.reduce((s, r) => s + r.total, 0);

    return (
      <div style={{ paddingBottom: 40 }}>
        <PageHead eyebrow="History" title="Receipts"
          sub="Uploaded and seeded receipts. These feed the pattern model that predicts your next basket."
          right={<Btn kind="ghost">Upload receipt</Btn>} />

        <div style={{ display: "flex", gap: 14, paddingTop: 18 }}>
          <Card style={{ padding: "13px 16px", flex: 1 }}>
            <Micro style={{ fontSize: 9.5 }}>Receipts</Micro>
            <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 500, color: C.taupe, marginTop: 4, ...tnum }}>{data.length}</div>
          </Card>
          <Card style={{ padding: "13px 16px", flex: 1 }}>
            <Micro style={{ fontSize: 9.5 }}>Logged spend</Micro>
            <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 500, color: C.taupe, marginTop: 4, ...tnum }}>{rupee(total)}</div>
          </Card>
          <Card style={{ padding: "13px 16px", flex: 1 }}>
            <Micro style={{ fontSize: 9.5 }}>Outlets</Micro>
            <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 500, color: C.taupe, marginTop: 4, ...tnum }}>{new Set(data.map((r) => r.store)).size}</div>
          </Card>
        </div>

        <Card style={{ marginTop: 18, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 0.8fr 0.5fr", padding: "13px 22px", borderBottom: `1px solid ${C.line}` }}>
            {["Outlet", "Date", "Receipt no.", "Total", ""].map((h, i) => (
              <Micro key={i} style={{ fontSize: 9.5, textAlign: i === 3 ? "right" : "left" }}>{h}</Micro>
            ))}
          </div>
          {data.map((r) => {
            const isOpen = open === r.id;
            return (
              <div key={r.id} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                <button onClick={() => setOpen(isOpen ? null : r.id)} style={{ width: "100%", textAlign: "left", cursor: "pointer", border: "none",
                  background: isOpen ? "rgba(157,163,164,0.07)" : "transparent", display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 0.8fr 0.5fr", alignItems: "center", padding: "15px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: serif, fontSize: 17, fontWeight: 500, color: C.taupe }}>{r.store}</span>
                    <span style={{ fontFamily: sans, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: typeTone[r.type], border: `1px solid ${C.line}`, borderRadius: 3, padding: "2px 6px" }}>{r.type}</span>
                  </div>
                  <div style={{ fontFamily: sans, fontSize: 12.5, color: C.steel, ...tnum }}>{r.date}</div>
                  <div style={{ fontFamily: sans, fontSize: 12.5, color: C.steel }}>{r.no}</div>
                  <div style={{ fontFamily: serif, fontSize: 17, color: C.taupe, textAlign: "right", ...tnum }}>{rupee(r.total)}</div>
                  <div style={{ textAlign: "right" }}>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke={C.steel} strokeWidth="1.6" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }}><path d="M3 5l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </button>
                {isOpen && (
                  <div style={{ padding: "2px 22px 18px 22px", background: "rgba(157,163,164,0.07)" }}>
                    <Micro style={{ fontSize: 9, marginBottom: 8 }}>{r.items.length} line items</Micro>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {r.items.map((it) => (
                        <span key={it} style={{ fontFamily: sans, fontSize: 12, color: C.taupe, background: C.card, border: `1px solid ${C.line}`, borderRadius: 4, padding: "6px 11px", whiteSpace: "nowrap" }}>{it}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      </div>
    );
  };
})();
