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

const getAnimeImageURL = async (name: string): Promise<string | null> => {
  const response = await fetch(
    `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(name)}&limit=1`,
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
  circles: Circle[],
): Circle[] => {
  const placed: Circle[] = [];

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
          const dx = c.pos.x - x;
          const dy = c.pos.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return dist < c.radius + circle.radius;
        });

        if (!overlaps) {
          placed.push({ ...circle, pos: new Vector2(x, y) });
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

interface Circle extends Anime {
  radius: number;
  color: string;
  pos: Vector2;
  image?: HTMLImageElement;
}

const renderCircles = (circles: Circle[]) => {
  circles.forEach((circle) => {
    const { pos, radius, image } = circle;

    if (image) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const iw = image.width;
      const ih = image.height;
      const side = Math.min(iw, ih);
      const sx = (iw - side) / 2;
      const sy = (ih - side) / 2;

      ctx.drawImage(
        image,
        sx,
        sy,
        side,
        side,
        pos.x - radius,
        pos.y - radius,
        radius * 2,
        radius * 2,
      );

      ctx.restore();
    } else {
      drawCircle(ctx, pos, radius, circle.color, circle.color);
    }
  });
};

const main = async () => {
  const res: Response = await fetch("/data/anime-girls.json");
  const animeGirls: AnimeGirl[] = (await res.json());
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

  const SCALE = 0.13;

  const animeArr = Object.values(animeMap);

  const circles: Circle[] = [];

  for (const anime of animeArr) {
    const avgRank = anime.rank / anime.girls.length;
    const radius = Math.max(5, 512 - avgRank) * SCALE;
    const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    const translatedName = await translateText(anime.name);

    let image: HTMLImageElement | undefined;

    if (radius > 10) {
      const imageUrl = await getAnimeImageURL(translatedName);

      if (imageUrl) {
        image = new Image();
        image.src = imageUrl;
        await new Promise((resolve) => {
          image!.onload = resolve;
          image!.onerror = resolve;
        });
      }
    }

    circles.push({
      radius,
      color,
      pos: new Vector2(0, 0),
      image,
      ...anime,
    });
  }

  const packedCircles = packCircles(canvas.width, canvas.height, circles);

  renderCircles(packedCircles);

  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    console.log("mouse", mouseX, mouseY);

    const hoveredCircle = packedCircles.find((circle) => {
      const dx = circle.pos.x - mouseX;
      const dy = circle.pos.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) < circle.radius;
    });

    const popup = document.getElementById("hover-popup");
    if (!popup) {
      console.error("Hover popup element not found.");
      return;
    }

    if (hoveredCircle) {
      popup.style.display = "block";
      popup.style.left = `${event.clientX + 10}px`;
      popup.style.top = `${event.clientY + 10}px`;
      popup.innerHTML = `
        <h3>${hoveredCircle.name}</h3>
        <p>Rank: ${hoveredCircle.rank}</p>
        <p>Avg Rank: ${Math.floor(hoveredCircle.rank / hoveredCircle.girls.length)}</p>
        <p>Top girls: ${hoveredCircle.girls
          .sort((a, b) => {
            const parsedRankA = a.tournamentRank.split(" ")[0];
            const parsedRankB = b.tournamentRank.split(" ")[0];
            return Number(parsedRankA) - Number(parsedRankB);
          })
          .map((girl) => girl.girlName)
          .slice(0, 3)
          .join(", ")}</p>
       `;
    } else {
      popup.style.display = "none";
    }

    console.log("hovered", hoveredCircle?.name);
  });
};

main();
