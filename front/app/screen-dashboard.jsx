// Dashboard screen — metrics + charts drawn only from the palette.
(function () {
  const { C, sans, serif, tnum, rupee, Micro, Card, CardHead, Btn, PageHead } = window.LX;
  const A = () => window.APP;

  function Metric({ label, value, accent }) {
    return (
      <Card style={{ padding: "15px 16px" }}>
        <Micro style={{ fontSize: 9.5 }}>{label}</Micro>
        <div style={{ fontFamily: serif, fontSize: 27, fontWeight: 500, color: accent ? C.rose : C.taupe, marginTop: 7, ...tnum }}>{value}</div>
      </Card>
    );
  }

  // Grouped vertical bars: actual (steel) vs optimized (rose)
  function SpendBars() {
    const data = A().monthly;
    const max = Math.max(...data.map((d) => d.actual)) * 1.08;
    const plotH = 188;
    return (
      <Card>
        <CardHead title="Actual vs optimized spend" right={
          <div style={{ display: "flex", gap: 16 }}>
            <Legend swatch={C.steel} label="Actual" />
            <Legend swatch={C.rose} label="Optimized" />
          </div>} />
        <div style={{ padding: "20px 20px 14px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: plotH, borderBottom: `1px solid ${C.line}` }}>
            {data.map((d) => (
              <div key={d.m} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: plotH }}>
                  <div title={"Actual " + rupee(d.actual)} style={{ width: 17, height: (d.actual / max) * plotH, background: C.steel, borderRadius: "3px 3px 0 0" }} />
                  <div title={"Optimized " + rupee(d.optimized)} style={{ width: 17, height: (d.optimized / max) * plotH, background: C.rose, borderRadius: "3px 3px 0 0" }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {data.map((d) => (
              <div key={d.m} style={{ flex: 1, textAlign: "center", fontFamily: sans, fontSize: 11, color: C.steel }}>{d.m}</div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  function Legend({ swatch, label }) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: 11, color: C.taupe }}>
        <span style={{ width: 9, height: 9, background: swatch, borderRadius: 2, display: "inline-block" }} />{label}
      </span>
    );
  }

  // Donut from the 5 palette tones
  function CategoryDonut() {
    const data = A().categories;
    const tones = [C.taupe, C.rose, C.steel, C.slate, C.blush];
    const total = data.reduce((s, d) => s + d.value, 0);
    const r = 62, cx = 80, cy = 80, circ = 2 * Math.PI * r;
    let acc = 0;
    return (
      <Card>
        <CardHead title="Category spend" right={<span style={{ fontFamily: sans, fontSize: 11, color: C.steel, ...tnum }}>{rupee(total)}/mo</span>} />
        <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: 22 }}>
          <svg width="160" height="160" viewBox="0 0 160 160" style={{ flexShrink: 0 }}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.lineSoft} strokeWidth="18" />
            {data.map((d, i) => {
              const frac = d.value / total;
              const seg = (
                <circle key={d.name} cx={cx} cy={cy} r={r} fill="none" stroke={tones[i]} strokeWidth="18"
                  strokeDasharray={`${frac * circ} ${circ}`} strokeDashoffset={-acc * circ}
                  transform={`rotate(-90 ${cx} ${cy})`} />
              );
              acc += frac;
              return seg;
            })}
            <text x={cx} y={cy - 3} textAnchor="middle" style={{ fontFamily: serif, fontSize: 22, fill: C.taupe }}>{data.length}</text>
            <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontFamily: sans, fontSize: 8.5, letterSpacing: "0.12em", fill: C.steel }}>GROUPS</text>
          </svg>
          <div style={{ flex: 1 }}>
            {data.map((d, i) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: i < data.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: sans, fontSize: 12.5, color: C.taupe }}>
                  <span style={{ width: 10, height: 10, background: tones[i], borderRadius: 2, border: tones[i] === C.blush ? `1px solid ${C.slate}` : "none" }} />{d.name}
                </span>
                <span style={{ fontFamily: sans, fontSize: 12, color: C.steel, ...tnum }}>{rupee(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Horizontal store bars
  function StoreBars() {
    const data = A().stores;
    const max = Math.max(...data.map((d) => d.value));
    return (
      <Card>
        <CardHead title="Store-wise spend" />
        <div style={{ padding: "18px 20px" }}>
          {data.map((d, i) => (
            <div key={d.name} style={{ marginBottom: i < data.length - 1 ? 16 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                <span style={{ fontFamily: sans, fontSize: 12.5, fontWeight: d.preferred ? 600 : 500, color: C.taupe }}>
                  {d.name}{d.preferred && <span style={{ fontFamily: sans, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: C.roseDeep, marginLeft: 7 }}>PREFERRED</span>}
                </span>
                <span style={{ fontFamily: serif, fontSize: 15, color: C.taupe, ...tnum }}>{rupee(d.value)}</span>
              </div>
              <div style={{ height: 9, background: C.lineSoft, borderRadius: 5 }}>
                <div style={{ width: `${(d.value / max) * 100}%`, height: "100%", background: d.preferred ? C.rose : C.steel, borderRadius: 5 }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  function TopSavings() {
    const data = A().topSavings;
    return (
      <Card>
        <CardHead title="Top saving opportunities" />
        <div style={{ padding: "6px 18px 14px" }}>
          {data.map((d, i) => (
            <div key={d.item} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: i < data.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
              <div>
                <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 500, color: C.taupe }}>{d.item}</div>
                <div style={{ fontFamily: sans, fontSize: 11, color: C.steel, marginTop: 2 }}>Cheapest at {d.store}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: serif, fontSize: 18, color: C.rose, ...tnum }}>−{rupee(d.save)}</div>
                <Micro style={{ fontSize: 8.5, marginTop: 1 }}>per cycle</Micro>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  window.ScreenDashboard = function ScreenDashboard() {
    const s = A().summary;
    return (
      <div style={{ paddingBottom: 40 }}>
        <PageHead eyebrow="Analytics" title="Savings dashboard"
          sub="Where your grocery spend goes, and how much the optimizer is saving you each cycle."
          right={<div style={{ display: "flex", gap: 10 }}>
            <Btn kind="quiet">Analyze patterns</Btn>
            <Btn kind="ghost">Generate prediction</Btn>
            <Btn>Recommendation</Btn>
          </div>} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, paddingTop: 20 }}>
          <Metric label="Bills uploaded" value={s.bills} />
          <Metric label="Monthly spend" value={rupee(s.monthlySpend)} />
          <Metric label="Optimized spend" value={rupee(s.optimizedSpend)} />
          <Metric label="Monthly savings" value={rupee(s.monthlySavings)} accent />
          <Metric label="Lifetime savings" value={rupee(s.lifetimeSavings)} />
          <Metric label="Savings rate" value={s.savingsPct + "%"} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: 18, paddingTop: 18 }}>
          <SpendBars />
          <CategoryDonut />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, paddingTop: 18 }}>
          <StoreBars />
          <TopSavings />
        </div>
      </div>
    );
  };
})();
