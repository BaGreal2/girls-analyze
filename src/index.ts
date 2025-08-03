import { drawCircle, drawText } from "./primitives.js";
import { Vector2 } from "./vector2.js";

const app = document.getElementById("app");
const canvas = document.getElementById("canvas") as HTMLCanvasElement;

if (!app || !canvas) {
  throw new Error("App or canvas element not found.");
}

canvas.width = app.clientWidth;
canvas.height = app.clientHeight;
const ctx = canvas.getContext("2d");

if (!ctx) {
  throw new Error("App element or canvas context not found.");
}

const translateText = async (
  text: string,
  from: string = "ru",
  to: string = "en",
) => {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data[0][0][0];
};

const getCharacterImageURL = async (name: string): Promise<string | null> => {
  const response = await fetch(
    `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(name)}&limit=1`,
  );
  const data = await response.json();
  if (data.data && data.data.length > 0) {
    return data.data[0].images.jpg.image_url;
  }
  return null;
};

const packCircles = (
  width: number,
  height: number,
  circles: {
    name: string;
    radius: number;
    color: string;
    x: number;
    y: number;
  }[],
) => {
  const placed: {
    name: string;
    radius: number;
    color: string;
    x: number;
    y: number;
  }[] = [];

  for (const circle of circles) {
    let placedSuccessfully = false;
    const step = Math.max(4, Math.floor(circle.radius));

    for (
      let y = circle.radius;
      y <= height - circle.radius && !placedSuccessfully;
      y += step
    ) {
      for (
        let x = circle.radius;
        x <= width - circle.radius && !placedSuccessfully;
        x += step
      ) {
        const overlaps = placed.some((c) => {
          const dx = c.x - x;
          const dy = c.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return dist < c.radius + circle.radius;
        });

        if (!overlaps) {
          placed.push({ ...circle, x, y });
          placedSuccessfully = true;
        }
      }
    }

    if (!placedSuccessfully) {
      console.warn(`Could not place circle: ${circle.name}`);
    }
  }

  return placed;
};

interface AnimeGirl {
  girlName: string;
  tournamentRank: string;
  worldRank: number;
  animeName: string;
}

interface Anime {
  name: string;
  rank: number;
  girls: AnimeGirl[];
}

type AnimeMap = Record<string, Anime>;

const main = async () => {
  const res: Response = await fetch("/data/anime-girls.json");
  const animeGirls: AnimeGirl[] = await res.json();
  const animeMap: AnimeMap = animeGirls.reduce((acc, curr) => {
    const { animeName } = curr;
    if (!acc[animeName]) {
      acc[animeName] = {
        name: animeName,
        rank: 0,
        girls: [],
      };
    }

    acc[animeName].girls.push(curr);
    return acc;
  }, {} as AnimeMap);

  Object.values(animeMap).forEach((anime) => {
    const animeRank = anime.girls.reduce((acc, curr) => {
      const parsedRank = Number(curr.tournamentRank.split(" ")[0]);
      return acc + parsedRank;
    }, 0);
    anime.rank = animeRank;
  });

  const sortedAnime = Object.values(animeMap).sort((a, b) => {
    const avgRankA = a.rank / a.girls.length;
    const avgRankB = b.rank / b.girls.length;

    return avgRankA - avgRankB;
  });

  const SCALE = 0.2;

  const circles = sortedAnime.map((anime) => {
    const avgRank = anime.rank / anime.girls.length;
    const radius = Math.max(5, 512 - avgRank) * SCALE;
    const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    return {
      name: anime.name,
      radius,
      color,
      x: 0,
      y: 0,
    };
  });

  const packedCircles = packCircles(canvas.width, canvas.height, circles);

  packedCircles.forEach((circle) => {
    drawCircle(
      ctx,
      new Vector2(circle.x, circle.y),
      circle.radius,
      circle.color,
      circle.color,
    );
  });

  console.log("Packed circles:", packedCircles);
};

main();
