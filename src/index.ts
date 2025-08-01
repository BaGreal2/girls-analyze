const app = document.getElementById("app");

if (!app) {
  throw new Error("App element not found");
}

interface AnimeGirl {
  girlName: string;
  tournamentRank: string;
  worldRank: number;
  animeName: string;
}

fetch("/data/anime-girls.json")
  .then((res) => res.json())
  .then((animeGirls: AnimeGirl[]) => {
    console.log("animeGirls", animeGirls[0]);

    app.innerHTML = `
      <h1
        style="text-align: center; font-size: 2rem; color: #333;"
      >
      ${animeGirls[0].girlName}
      </h1>
      <p style="text-align: center; color: #666;">
        Tournament Rank: ${animeGirls[0].tournamentRank}<br />
        World Rank: ${animeGirls[0].worldRank}<br />
        Anime: ${animeGirls[0].animeName}
      </p>
    `;
  })
  .catch((err) => {
    console.error("Failed to load JSON:", err);
  });
