// All demo content for the Ledger app, from the project's synthetic seed data.
window.APP = {
  nav: ["Buy", "Dashboard", "Receipts", "Recommendations"],

  // ---- Buy: predicted basket + per-item store comparisons ----
  basket: [
    {
      id: "milk", name: "Milk", cat: "Dairy", meta: "Amul · 1L", qty: 8, avg: 68,
      options: [
        { store: "Dmart",     offer: 67, disc: 4, fees: 25, stock: "In stock",  why: "Member price",     best: true },
        { store: "Blinkit",   offer: 68, disc: 6, fees: 35, stock: "In stock",  why: "10-min essentials" },
        { store: "BigBasket", offer: 69, disc: 3, fees: 0,  stock: "Low stock", why: "Slot delivery" },
      ],
    },
    {
      id: "rice", name: "Basmati Rice", cat: "Grains", meta: "India Gate · 10kg", qty: 1, avg: 920,
      options: [
        { store: "JioMart",   offer: 884, disc: 8, fees: 0,  stock: "In stock",  why: "Weekend mega sale", best: true },
        { store: "Dmart",     offer: 899, disc: 5, fees: 0,  stock: "In stock",  why: "Store special" },
        { store: "BigBasket", offer: 940, disc: 2, fees: 0,  stock: "In stock",  why: "List price" },
      ],
    },
    {
      id: "detergent", name: "Detergent Powder", cat: "Home Care", meta: "Surf Excel · 2kg", qty: 1, avg: 329,
      options: [
        { store: "BigBasket", offer: 301, disc: 12, fees: 0,  stock: "In stock", why: "Top deal", best: true },
        { store: "JioMart",   offer: 329, disc: 9,  fees: 0,  stock: "In stock", why: "Combo offer" },
        { store: "Dmart",     offer: 339, disc: 4,  fees: 25, stock: "In stock", why: "Store special" },
      ],
    },
  ],

  searchChips: ["Milk", "Basmati Rice", "Detergent", "Eggs", "Toor Dal", "Tomato"],

  // ---- Dashboard ----
  summary: {
    bills: 3, monthlySpend: 2780, optimizedSpend: 2543,
    monthlySavings: 237, lifetimeSavings: 1486, savingsPct: 8.5,
  },
  monthly: [
    { m: "Jan", actual: 2610, optimized: 2440 },
    { m: "Feb", actual: 2480, optimized: 2300 },
    { m: "Mar", actual: 2725, optimized: 2510 },
    { m: "Apr", actual: 2890, optimized: 2640 },
    { m: "May", actual: 2760, optimized: 2520 },
    { m: "Jun", actual: 2780, optimized: 2543 },
  ],
  categories: [
    { name: "Grains",     value: 980 },
    { name: "Dairy",      value: 620 },
    { name: "Home Care",  value: 360 },
    { name: "Vegetables", value: 290 },
    { name: "Pulses",     value: 230 },
  ],
  stores: [
    { name: "Dmart",          value: 2142, preferred: true },
    { name: "BigBasket",      value: 1918 },
    { name: "JioMart",        value: 1635 },
    { name: "Reliance Fresh", value: 1284 },
    { name: "Blinkit",        value: 486 },
  ],
  topSavings: [
    { item: "Detergent Powder", store: "BigBasket",      save: 28 },
    { item: "Basmati Rice",     store: "JioMart",        save: 15 },
    { item: "Eggs",             store: "Reliance Fresh", save: 8 },
  ],

  // ---- Receipts ----
  receipts: [
    { id: 101, store: "Dmart",          date: "2026-05-02", no: "DM-BLR-1001", type: "image",  total: 2142, items: ["Amul Gold Milk 1L", "Fortune Sunlite Oil 5L", "India Gate Basmati Rice 10kg"] },
    { id: 201, store: "BigBasket",      date: "2026-05-04", no: "BB-MUM-2001", type: "pdf",    total: 1918, items: ["Country Delight Milk 1L", "Brown Bread", "Eggs (12 pcs)"] },
    { id: 102, store: "Blinkit",        date: "2026-05-06", no: "BLK-BLR-1002", type: "image", total: 486,  items: ["Banana Robusta", "Tomato 2kg", "Nandini Curd 400g"] },
    { id: 103, store: "JioMart",        date: "2026-05-15", no: "JIO-BLR-1003", type: "pdf",    total: 1635, items: ["Tata Toor Dal 2kg", "Aashirvaad Atta 10kg", "Surf Excel Easy Wash 2kg"] },
    { id: 202, store: "Reliance Fresh", date: "2026-05-18", no: "RF-MUM-2002", type: "manual",  total: 1284, items: ["Fortune Sona Masoori 5kg", "Potato 3kg", "Onion 2kg"] },
  ],

  // ---- Recommendation ----
  recommendation: {
    strategy: "Multi-store optimized",
    bestSingleStore: "Dmart",
    singleStoreCost: 2638,
    multiStoreCost: 2543,
    expectedSpend: 2780,
    optimizedSpend: 2543,
    estimatedSaving: 237,
    savingsPct: 8.5,
    convenience: "Splitting between Dmart and JioMart captures the deepest offers while keeping deliveries to two outlets — within your two-stop convenience limit.",
    split: [
      { store: "Dmart",   items: ["Milk", "Basmati Rice"], cost: 1435 },
      { store: "JioMart", items: ["Detergent Powder", "Toor Dal"], cost: 1108 },
    ],
  },
};
