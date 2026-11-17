// Velora: يحفظ تقييمات الزبائن ويعطي عدد "الزبائن السعيدين" ومتوسط التقييم
export class Stats {
  constructor(state) {
    this.sql = state.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS ratings (id INTEGER PRIMARY KEY AUTOINCREMENT, stars INTEGER NOT NULL, ts INTEGER NOT NULL)");
  }
  async fetch(req) {
    if (req.method === "POST") {
      let stars = 0;
      try { stars = Math.round(Number((await req.json()).stars)); } catch (e) {}
      if (!(stars >= 1 && stars <= 5)) return Response.json({ error: "bad rating" }, { status: 400 });
      this.sql.exec("INSERT INTO ratings (stars, ts) VALUES (?, ?)", stars, Date.now());
    }
    const r = this.sql.exec("SELECT COUNT(*) AS c, SUM(CASE WHEN stars >= 4 THEN 1 ELSE 0 END) AS h, AVG(stars) AS a FROM ratings").one();
    return Response.json({ count: r.c || 0, happy: r.h || 0, avg: r.a ? Math.round(r.a * 10) / 10 : 0 },
      { headers: { "cache-control": "no-store" } });
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/api/rating" && (req.method === "GET" || req.method === "POST")) {
      const stub = env.STATS.get(env.STATS.idFromName("global"));
      return stub.fetch(req);
    }
    return env.ASSETS.fetch(req);
  }
};
