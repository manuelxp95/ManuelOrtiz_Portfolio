import type { Project, ProjectContext } from "@/domain/types";

/**
 * Featured and professional work first. Legacy prose is kept verbatim until the
 * Roadmap P10 copy rewrite; see docs/legacy-content/projects.md.
 */
export const projects: Project[] = [
  {
    id: "sopa",
    name: "SOPA — Tale of the Stolen Potato",
    year: 2025,
    context: "professional",
    summary:
      "Commercial narrative adventure by Studio Bando, released on PC and all three consoles.",
    description:
      "A captivating and poignant journey into the depths of human connection and the legacy we leave behind, inspired by Miyazaki, Coco, and The Little Prince. Narrative adventure with puzzles published by Studio Bando on 6 October 2025.",
    role: "Unity Developer (Intern)",
    responsibilities: [
      "Implemented new features that sped up production.",
      "Built optimization-oriented tooling within the Unity production pipeline.",
    ],
    stack: ["Unity", "C#"],
    genres: ["Adventure", "Narrative", "Puzzle"],
    platforms: ["PC (Steam)", "Xbox", "PlayStation", "Nintendo Switch"],
    links: [
      {
        kind: "store",
        label: "SOPA on Steam",
        url: "https://store.steampowered.com/app/1935330/Sopa__Tale_of_the_Stolen_Potato/",
      },
    ],
    thumbnail: {
      src: "/images/works/sopa_00.png",
      alt: "SOPA key art: a boy in a poncho standing before giant purple spirit figures, including a fox, under a starry sky",
      width: 1920,
      height: 1080,
    },
    media: [
      {
        src: "/images/works/sopa_01.jpg",
        alt: "SOPA screenshot: a grandmother in an apron smiles at the boy in a sunlit kitchen",
        width: 1625,
        height: 912,
      },
      {
        src: "/images/works/sopa_02.jpg",
        alt: "SOPA screenshot: a glowing pantry aisle lined with shelves of groceries",
        width: 1292,
        height: 729,
      },
      {
        src: "/images/works/sopa_03.jpg",
        alt: "SOPA screenshot: the boy walks through a wooden market run by frog merchants",
        width: 1270,
        height: 740,
      },
      {
        src: "/images/works/sopa_04.jpg",
        alt: "SOPA screenshot: the boy walks across a sunlit tiled courtyard toward an open doorway",
        width: 1280,
        height: 720,
      },
    ],
    tags: ["game-dev"],
    impact:
      "Shipped on Steam, Xbox, PlayStation and Nintendo Switch; covered by Digital Trends, VICE and The Indie Council.",
    featured: true,
  },
  {
    id: "psx-robbery",
    name: "PSXRobbery",
    year: 2023,
    context: "coursework",
    summary:
      "Short film made entirely in Unreal Engine as the Epic Bootcamp 2023: Animation capstone.",
    description:
      "A roughly 30-second short film produced entirely in Unreal Engine in one month, as the final project of the Epic Bootcamp 2023: Animation (LATAM edition, UT-HUB with Epic Games). Shows Sequencer work, lighting and cinematics.",
    responsibilities: [],
    stack: ["Unreal Engine", "Sequencer"],
    genres: ["Short film"],
    platforms: [],
    links: [
      {
        kind: "video",
        label: "Watch PSXRobbery on YouTube",
        url: "https://www.youtube.com/watch?v=V_bPS9pHbRU",
      },
    ],
    media: [],
    tags: ["cinematics"],
    featured: false,
  },
  {
    id: "yolov8-detection",
    name: "YOLOv8 object detection",
    context: "personal",
    summary:
      "Object detection system built on computer vision workflows in Python.",
    description:
      "Object detection system using YOLOv8 with computer vision workflows in Python.",
    responsibilities: [],
    stack: ["Python", "YOLOv8"],
    genres: [],
    platforms: [],
    links: [
      {
        kind: "notebook",
        label: "YOLOv8 detection notebook on Google Colab",
        url: "https://colab.research.google.com/drive/15bXLWi8pqNmxfKM7DrrdxQ2UeP7YW_xA",
      },
    ],
    media: [],
    tags: ["ai"],
    featured: false,
  },
  {
    id: "rtb",
    name: "Revolución Tecnobotánica",
    year: 2023,
    context: "game-jam",
    summary:
      "Game created during the ADVA game jam, applying knowledge in UE5.",
    description:
      'In "Revolución Tecnobotánica," the player embarks on an adventure where they must obtain enough Chayannets and use them to shut down the Mother Cyberplant. Along the way, all the other Cyberplant daughters will try to prevent it from happening. The goal is to collect all the Chayannets, reach the Mother Cyberplant, and save the world.',
    responsibilities: [],
    stack: ["Unreal Engine 5"],
    genres: ["Platformer", "Casual"],
    platforms: ["Windows"],
    links: [
      {
        kind: "itch",
        label: "Revolución Tecnobotánica on itch.io",
        url: "https://elithne.itch.io/revolucion-tecnobotanica",
      },
    ],
    thumbnail: {
      src: "/images/works/RTB_00.jpg",
      alt: "Revolución Tecnobotánica title screen: hand-drawn hero in a green jacket beside the Play, Options, Credits and Exit menu",
      width: 1920,
      height: 1080,
    },
    media: [
      {
        src: "/images/works/RTB_01.jpg",
        alt: "Revolución Tecnobotánica screenshot: pink stone platforms floating in front of a laundry building, with lives and coin counter",
        width: 1058,
        height: 601,
      },
      {
        src: "/images/works/RTB_02.jpg",
        alt: "Revolución Tecnobotánica screenshot: a row of spinning coins beside a lava river and a mountain backdrop",
        width: 1919,
        height: 1079,
      },
      {
        src: "/images/works/RTB_03.jpg",
        alt: "Revolución Tecnobotánica screenshot: the player walks down a pink corridor toward coins and a potted cyberplant enemy",
        width: 1919,
        height: 1079,
      },
    ],
    tags: ["game-dev"],
    featured: true,
  },
  {
    id: "pbd",
    name: "Path Between Dimensions",
    year: 2023,
    context: "game-jam",
    summary:
      "Project with a theme of dimension change developed in Unity Engine.",
    description:
      'Project in 2.5D dimension shift carried out in Unity Engine for the GameDev.tv JAM. The theme was "Life in 2 dimension".',
    responsibilities: [],
    stack: ["Unity"],
    genres: ["Platformer", "Casual"],
    platforms: ["Windows"],
    links: [
      {
        kind: "itch",
        label: "Path Between Dimensions on itch.io",
        url: "https://ortizmanuel.itch.io/path-between-dimensions",
      },
    ],
    thumbnail: {
      src: "/images/works/pbd_01.png",
      alt: "Path Between Dimensions title screen: a small white character on grey voxel terrain next to a pink Play button",
      width: 1046,
      height: 571,
    },
    media: [
      {
        src: "/images/works/pbd_02.png",
        alt: "Path Between Dimensions screenshot: the character stands on a grey stone pillar above a misty gap",
        width: 1042,
        height: 580,
      },
      {
        src: "/images/works/pbd_03.png",
        alt: "Path Between Dimensions screenshot: the level shifted into its magenta dimension, platforms seen in silhouette",
        width: 1335,
        height: 760,
      },
    ],
    tags: ["game-dev"],
    featured: true,
  },
  {
    id: "bolas-locas",
    name: "Bolas Locas",
    year: 2022,
    context: "coursework",
    summary: "My first game in Unreal Engine 5",
    description:
      "My first game in Unreal Engine 5. Score all the balls you can to win!",
    responsibilities: [],
    stack: ["Unreal Engine 5"],
    genres: ["Puzzle", "Casual"],
    platforms: ["Windows", "macOS", "Linux"],
    links: [
      {
        kind: "repo",
        label: "Bolas Locas source on GitHub",
        url: "https://github.com/manuelxp95/BolasLocas-Unreal5.1",
      },
    ],
    thumbnail: {
      src: "/images/works/bolas_locas.png",
      alt: "Bolas Locas title over a pink arena with orange rotating bars and blue and pink balls",
      width: 1280,
      height: 750,
    },
    media: [
      {
        src: "/images/works/bolas_locas01.png",
        alt: "Bolas Locas difficulty screen: the player character faces Easy, Medium, Hard and Impossible options",
        width: 1280,
        height: 750,
      },
      {
        src: "/images/works/bolas_locas02.png",
        alt: "Bolas Locas gameplay: the character in the arena with a 0/10 ball counter",
        width: 1280,
        height: 750,
      },
    ],
    tags: ["game-dev"],
    featured: false,
  },
  {
    id: "clicker-test",
    name: "Clicker Test",
    year: 2022,
    context: "coursework",
    summary: "My first clicker made entirely in Unity!",
    description: "My first clicker made entirely in Unity!",
    responsibilities: [],
    stack: ["Unity"],
    genres: ["Clicker", "Action", "Casual"],
    platforms: ["Windows", "macOS", "Linux"],
    links: [
      {
        kind: "web-build",
        label: "Play Clicker Test on Unity Play",
        url: "https://play.unity.com/mg/other/webgl-builds-254626",
      },
    ],
    thumbnail: {
      src: "/images/works/clicker_test.png",
      alt: "Clicker Test title over a low-poly valley with a red target and a gold coin",
      width: 949,
      height: 519,
    },
    media: [
      {
        src: "/images/works/clicker_test_01.png",
        alt: "Clicker Test difficulty screen with Easy, Medium and Hard buttons against a blue sky",
        width: 949,
        height: 519,
      },
      {
        src: "/images/works/clicker_test_02.png",
        alt: "Clicker Test gameplay: coins, shields and crates scattered over a low-poly hill with time and score counters",
        width: 949,
        height: 519,
      },
    ],
    tags: ["game-dev"],
    featured: false,
  },
  {
    id: "meteoritos",
    name: "Meteoritos",
    year: 2022,
    context: "coursework",
    summary: "Asteroids but NO!",
    description:
      "Have you played Asteroids (1976)? well... this is worse! BUT IN GODOT!",
    responsibilities: [],
    stack: ["Godot"],
    genres: ["Action", "Casual"],
    platforms: ["Windows"],
    links: [
      {
        kind: "repo",
        label: "Meteoritos source on GitHub",
        url: "https://github.com/manuelxp95/Repo_cenit",
      },
    ],
    thumbnail: {
      src: "/images/works/meteoritos.png",
      alt: "Meteoritos title screen: a red and white spaceship in a purple nebula with shield energy bar and minimap",
      width: 632,
      height: 351,
    },
    media: [
      {
        src: "/images/works/meteoritos_01.png",
        alt: "Meteoritos screenshot: the spaceship alone in deep space, captioned Explore the deep space",
        width: 632,
        height: 351,
      },
      {
        src: "/images/works/meteoritos_02.png",
        alt: "Meteoritos screenshot: the spaceship fires lasers at an exploding enemy",
        width: 632,
        height: 351,
      },
      {
        src: "/images/works/meteoritos_03.png",
        alt: "Meteoritos screenshot: a red meteor shower warning with the remaining-meteor counter",
        width: 632,
        height: 351,
      },
    ],
    tags: ["game-dev"],
    featured: false,
  },
  {
    id: "frusting-path",
    name: "Frusting Path",
    year: 2022,
    context: "coursework",
    summary:
      "My first Casual game in Unity! You will have to choose and explode!",
    description:
      "Choose a card and travel with Larry (THE COCK) in a path totally unfair. Do your best to try to get as far as possible!",
    responsibilities: [],
    stack: ["Unity"],
    genres: ["Casual"],
    platforms: ["Windows", "macOS", "Linux"],
    links: [
      {
        kind: "repo",
        label: "Frusting Path source on GitHub",
        url: "https://github.com/manuelxp95/Programming-Theory-Repo",
      },
      {
        kind: "web-build",
        label: "Play Frusting Path on Unity Play",
        url: "https://play.unity.com/mg/other/webgl-builds-198309",
      },
    ],
    thumbnail: {
      src: "/images/works/frusting_path.png",
      alt: "Frusting Path gameplay: Larry the low-poly rooster on a dirt path with health bar and step counter",
      width: 886,
      height: 485,
    },
    media: [
      {
        src: "/images/works/frusting_path01.jpg",
        alt: "Frusting Path screenshot: Larry at the start of the path, captioned Try your best!",
        width: 1280,
        height: 720,
      },
      {
        src: "/images/works/frusting_path02.jpg",
        alt: "Frusting Path screenshot: Larry explodes on a red tile, captioned Don't explode!",
        width: 1280,
        height: 720,
      },
      {
        src: "/images/works/frusting_path03.jpg",
        alt: "Frusting Path screenshot: rainbow sparkles around Larry on a green tile, captioned With magical powers!",
        width: 1280,
        height: 720,
      },
    ],
    tags: ["game-dev"],
    featured: false,
  },
  {
    id: "road-to-carpincho",
    name: "Road to Carpincho",
    year: 2022,
    context: "coursework",
    summary: "A action game 2D, cross the road if you can.",
    description:
      "This is a adventure game in with you can play as a carpincho, inspired in similar games like Frogger but a little touch of action. You must be the fastest in the road, if you want reunite with your family.",
    responsibilities: [],
    stack: ["Godot"],
    genres: ["Action", "Casual"],
    platforms: ["Windows", "macOS", "Linux", "iOS", "Android"],
    links: [
      {
        kind: "repo",
        label: "Road to Carpincho source on GitHub",
        url: "https://github.com/manuelxp95/RoadToCarpincho",
      },
    ],
    thumbnail: {
      src: "/images/works/road_to_carpincho.png",
      alt: "Road to Carpincho pixel-art title screen: a capybara in a forest with Start, Scores and Exit buttons",
      width: 1279,
      height: 748,
    },
    media: [
      {
        src: "/images/works/road_to_carpincho_01.png",
        alt: "Road to Carpincho gameplay: the capybara waits to cross two roads with red cars",
        width: 1279,
        height: 748,
      },
      {
        src: "/images/works/road_to_carpincho_02.png",
        alt: "Road to Carpincho high-score table in a wooden frame",
        width: 1279,
        height: 748,
      },
      {
        src: "/images/works/road_to_carpincho_03.png",
        alt: "Road to Carpincho gameplay: the capybara dodges cars and a hunter with a machete",
        width: 1279,
        height: 748,
      },
    ],
    tags: ["game-dev"],
    featured: false,
  },
  {
    id: "saltarina",
    name: "Saltarina",
    year: 2021,
    context: "coursework",
    summary: "A game plataformer like Mario",
    description:
      "Saltarina it's a game platformer totally inspired in others games like Mario and Ori. This one is my first game completely playable. Made with love",
    responsibilities: [],
    stack: ["Godot"],
    genres: ["Platformer"],
    platforms: ["Windows", "macOS", "Linux", "iOS", "Android"],
    links: [
      {
        kind: "repo",
        label: "Saltarina source on GitHub",
        url: "https://github.com/manuelxp95/PSaltarina",
      },
    ],
    thumbnail: {
      src: "/images/works/saltarina.png",
      alt: "Saltarina main menu: a purple rabbit on a grassy platform beside New Game, Level Select and Exit buttons",
      width: 1282,
      height: 749,
    },
    media: [
      {
        src: "/images/works/saltarina_01.png",
        alt: "Saltarina gameplay: the purple rabbit on floating platforms with spikes, carrots and coins",
        width: 1275,
        height: 717,
      },
      {
        src: "/images/works/saltarina_02.png",
        alt: "Saltarina gameplay: the rabbit in a dark grey night level next to a row of coins",
        width: 1275,
        height: 717,
      },
    ],
    tags: ["game-dev"],
    featured: false,
  },
];

export const projectContextLabels: Record<ProjectContext, string> = {
  professional: "Professional",
  "game-jam": "Game jam",
  coursework: "Course project",
  personal: "Personal project",
};
