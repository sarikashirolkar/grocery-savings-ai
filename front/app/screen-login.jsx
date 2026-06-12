// Login screen — Ledger-style split sign-in.
(function () {
  const { C, sans, serif, tnum, rupee, Micro, Btn } = window.LX;

  window.ScreenLogin = function ScreenLogin({ onLogin }) {
    const [email, setEmail] = React.useState("demo@grocerysavings.ai");
    const [pw, setPw] = React.useState("Demo@12345");

    const field = (label, value, set, type) => (
      <label style={{ display: "block", marginBottom: 16 }}>
        <Micro style={{ fontSize: 9.5, marginBottom: 7 }}>{label}</Micro>
        <input type={type || "text"} value={value} onChange={(e) => set(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${C.line}`, borderRadius: 4, background: C.card,
            padding: "12px 14px", fontFamily: sans, fontSize: 14, color: C.taupe, outline: "none" }} />
      </label>
    );

    return (
      <div style={{ minHeight: "100vh", background: C.canvas, display: "grid", gridTemplateColumns: "1.1fr 1fr", fontFamily: sans }}>
        {/* Left — brand panel */}
        <div style={{ background: C.taupe, padding: "56px 60px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: C.card, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 10, height: 10, background: C.rose, borderRadius: 2 }} />
            </div>
            <span style={{ fontFamily: serif, fontSize: 22, fontWeight: 600, color: C.card }}>Grocery Savings</span>
            <span style={{ fontFamily: sans, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", color: C.blush, border: `1px solid rgba(255,219,218,0.4)`, borderRadius: 3, padding: "2px 5px" }}>AI</span>
          </div>
          <div>
            <h1 style={{ fontFamily: serif, fontSize: 44, fontWeight: 500, color: C.card, lineHeight: 1.1, letterSpacing: "-0.01em", margin: 0 }}>
              Predict the basket.<br /><span style={{ color: C.blush, fontStyle: "italic" }}>Price every outlet.</span>
            </h1>
            <p style={{ fontFamily: sans, fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: "18px 0 0", maxWidth: 380 }}>
              Upload a receipt, and we forecast your next shop and route it to the cheapest stores — saving an average of 8.5% a cycle.
            </p>
          </div>
          <div style={{ display: "flex", gap: 36 }}>
            {[["8.5%", "avg. saved / cycle"], ["5", "outlets compared"], ["₹1,486", "lifetime saved"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontFamily: serif, fontSize: 24, color: C.card, ...tnum }}>{v}</div>
                <div style={{ fontFamily: sans, fontSize: 10.5, color: "rgba(255,255,255,0.55)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
          <div style={{ width: "100%", maxWidth: 360 }}>
            <Micro style={{ color: C.rose }}>Demo workspace</Micro>
            <h2 style={{ fontFamily: serif, fontSize: 30, fontWeight: 500, color: C.taupe, margin: "10px 0 26px", letterSpacing: "-0.01em" }}>Sign in to continue</h2>
            <form onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
              {field("Email", email, setEmail)}
              {field("Password", pw, setPw, "password")}
              <Btn style={{ width: "100%", padding: "13px 0", marginTop: 6 }}>Sign in</Btn>
            </form>
            <p style={{ fontFamily: sans, fontSize: 11.5, color: C.steel, marginTop: 18, lineHeight: 1.5 }}>
              Seeded account is pre-filled. Use it to explore the predicted basket, comparisons, and savings dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  };
})();
