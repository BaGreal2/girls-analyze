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
    renderLeastAccurateGirls(animeGirls);
  })
  .catch((err) => {
    console.error("Failed to load JSON:", err);
  });

async function translateText(text: string) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data[0][0][0];
}

async function getCharacterImageURL(name: string): Promise<string | null> {
  const response = await fetch(
    `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(name)}&limit=1`,
  );
  const data = await response.json();
  if (data.data && data.data.length > 0) {
    return data.data[0].images.jpg.image_url;
  }
  return null;
}

async function renderLeastAccurateGirls(animeGirls: AnimeGirl[]) {
  const leastAccurateGirls = animeGirls
    .sort((a, b) => {
      const rankA = Number(a.tournamentRank.split(" ")[0]);
      const rankDiffA = Math.abs(rankA - a.worldRank);
      const rankB = Number(b.tournamentRank.split(" ")[0]);
      const rankDiffB = Math.abs(rankB - b.worldRank);
      return rankDiffB - rankDiffA;
    })
    .slice(0, 10);

  for (const girl of leastAccurateGirls) {
    const card = document.createElement("div");
    card.className = "girl-card";

    const title = document.createElement("h4");
    title.textContent = girl.girlName;

    const subtitle = document.createElement("p");
    subtitle.textContent = `From: ${girl.animeName}`;

    const ranks = document.createElement("p");
    ranks.innerHTML = `Tournament: ${girl.tournamentRank}<br> World: ${girl.worldRank}`;

    const image = document.createElement("img");
    image.alt = girl.girlName;
    image.style.width = "200px";
    image.style.borderRadius = "6px";

    try {
      const translatedName = await translateText(girl.girlName);
      const imageUrl = await getCharacterImageURL(translatedName);
      image.src = imageUrl ?? "";
    } catch (err) {
      console.error(`Error loading image for ${girl.girlName}`, err);
    }

    card.appendChild(image);
    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(ranks);
    app?.appendChild(card);

    await new Promise((r) => setTimeout(r, 350));
  }
}
