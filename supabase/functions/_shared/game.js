// content/worlds.json
var worlds_default = {
  version: 1,
  view: {
    logicalWidth: 420,
    minLogicalHeight: 420,
    groundRatio: 0.76,
    maxPixelRatio: 2,
    dogX: 90,
    safeTopRatio: 0.0587
  },
  loop: {
    hz: 60,
    maxStepsPerFrame: 5
  },
  physics: {
    gravity: 2350,
    jumpVelocity: -780,
    doubleJumpVelocity: -700,
    jumpBuffer: 0.12,
    coyoteTime: 0.08,
    hold: {
      gravityScale: 0.55,
      maxSeconds: 0.18
    }
  },
  dog: {
    hitbox: {
      x0: -20,
      x1: 40,
      y0: -56,
      y1: -6
    },
    biscuitReach: 32,
    mouth: {
      x: 10,
      y: -32
    }
  },
  scoring: {
    unitsPerMetre: 10,
    biscuit: 5,
    smash: 25,
    nearMiss: 10
  },
  nearMiss: {
    gap: 5,
    slowMo: 0.2,
    timeScale: 0.35,
    slowMoCooldown: 4
  },
  crash: {
    endDelay: 0.9
  },
  continue: {
    countdown: 5,
    prices: [50, 100, 200],
    grace: 2,
    clearAhead: 420
  },
  endless: {
    perThousand: 3,
    maxSpeed: 520
  },
  worldTransition: {
    speedLerpSeconds: 1,
    fadeSeconds: 0.8
  },
  chase: {
    window: 300,
    enterSeconds: 0.8,
    exitSeconds: 1.2
  },
  spawner: {
    spawnAhead: 60,
    firstObstacleAt: 0.9,
    introSeconds: 20,
    introGapScale: 1.45,
    breatherEvery: 45,
    breatherSeconds: 3,
    pairGap: [40, 110],
    carryOver: 0.5,
    validatorStep: 6,
    biscuits: {
      chance: 0.25,
      arcCount: 5,
      spacing: 30,
      breatherSpacing: 90,
      arcChance: 0.55,
      lowLineChance: 0.3,
      arcHeight: 128,
      arcHalfWidth: 112,
      arcLift: 40,
      lowY: -28,
      highY: -150,
      lineAfter: 120,
      highAfter: 150,
      goldenArcChance: 0.08,
      flierLineY: -26
    }
  },
  meter: {
    blocks: 8,
    growBy: 4,
    maxBlocks: 40,
    fillDuringPower: false
  },
  powerups: {
    zoomies: {
      duration: 6,
      speedMultiplier: 1.55,
      graceAfter: 0.6,
      color: "#FF4FA0",
      maxDuration: 10
    },
    magnet: {
      duration: 8,
      radius: 320,
      pullSpeed: 900,
      color: "#3A86F0",
      maxDuration: 14
    },
    shield: {
      invulnerableAfterHit: 1.2,
      color: "#2FD0C0",
      maxLevelBubbles: 2,
      maxInvulnerable: 2
    },
    frisbee: {
      duration: 4,
      maxDuration: 7,
      glideY: -150,
      riseSeconds: 0.3,
      graceAfter: 0.9,
      landingClear: 0.8,
      color: "#FFC61A"
    },
    sniff: {
      duration: 15,
      maxDuration: 25,
      goldenMultiplier: 3,
      color: "#8A5CF6"
    },
    upgrades: {
      maxLevel: 5,
      costs: [250, 600, 1200, 2500, 5e3]
    }
  },
  obstacles: {
    hydrant: {
      w: 28,
      h: 44,
      inset: 4
    },
    cone: {
      w: 30,
      h: 36,
      inset: 6
    },
    puddle: {
      w: 56,
      h: 10,
      inset: 6
    },
    fence: {
      w: 58,
      h: 38,
      inset: 3
    },
    cat: {
      w: 40,
      h: 34,
      inset: 5
    },
    skateboarder: {
      w: 40,
      h: 50,
      inset: 5,
      extraSpeed: 90
    },
    manhole: {
      w: 54,
      h: 10,
      inset: 6
    },
    crab: {
      w: 38,
      h: 24,
      inset: 4,
      extraSpeed: 40
    },
    sandcastle: {
      w: 50,
      h: 40,
      inset: 4
    },
    seagull: {
      w: 36,
      h: 22,
      inset: 3,
      fly: 100,
      extraSpeed: 70
    },
    owl: {
      w: 32,
      h: 28,
      inset: 3,
      fly: 92,
      extraSpeed: 50
    },
    bin: {
      w: 32,
      h: 50,
      inset: 3
    },
    fox: {
      w: 48,
      h: 30,
      inset: 5,
      extraSpeed: 110
    },
    parcel: {
      w: 30,
      h: 26,
      inset: 4
    },
    snowman: {
      w: 34,
      h: 46,
      inset: 5
    },
    snowball: {
      w: 30,
      h: 30,
      inset: 5,
      extraSpeed: 90
    },
    mixer: {
      w: 46,
      h: 40,
      inset: 5
    },
    girder: {
      w: 56,
      h: 14,
      inset: 3,
      fly: 96,
      extraSpeed: 40
    },
    pumpkin: {
      w: 34,
      h: 30,
      inset: 4
    },
    bat: {
      w: 34,
      h: 20,
      inset: 3,
      fly: 98,
      extraSpeed: 80
    },
    ghost: {
      w: 32,
      h: 40,
      inset: 5,
      extraSpeed: 40
    },
    crater: {
      w: 52,
      h: 12,
      inset: 4
    },
    alienCat: {
      w: 34,
      h: 36,
      inset: 4,
      extraSpeed: 30
    },
    clump: {
      w: 26,
      h: 20,
      inset: 3,
      extraSpeed: 160
    }
  },
  worlds: [
    {
      id: "bark-park",
      name: "Bark Park",
      at: 0,
      speed: 290,
      gap: [1.2, 1.9],
      enabled: true,
      theme: "park",
      obstacles: {
        hydrant: 2,
        cone: 1,
        puddle: 1
      },
      patterns: {
        single: 1
      },
      twist: null,
      chase: {
        boss: "mower",
        name: "The mower",
        minion: null,
        minionWeight: 0,
        fight: {
          w: 112,
          stomp: {
            x0: 12,
            x1: 100,
            top: 52
          },
          attacks: [["clump"], ["clump", "clump"], ["clump", "clump", "clump"]]
        }
      },
      gate: null,
      about: {
        colour: "#5fbf4a",
        obstacles: "Hydrants, cones, puddles",
        twist: "Learn to jump and double jump",
        boss: "The park keeper's ride-on mower"
      },
      platforms: null
    },
    {
      id: "city-streets",
      name: "City Streets",
      at: 1500,
      speed: 330,
      gap: [1.1, 1.8],
      enabled: true,
      theme: "city",
      obstacles: {
        fence: 1,
        cat: 1,
        skateboarder: 1,
        manhole: 1.2
      },
      patterns: {
        single: 3,
        pair: 1
      },
      twist: null,
      chase: {
        boss: "van",
        name: "The mail van",
        minion: "parcel",
        minionWeight: 2.5,
        fight: {
          w: 144,
          stomp: {
            x0: 36,
            x1: 140,
            top: 66
          },
          attacks: [["parcel"], ["parcel", "parcel"], ["parcel", "parcel", "parcel"]]
        }
      },
      gate: null,
      about: {
        colour: "#a2648c",
        obstacles: "Fences, cats, skateboarders",
        twist: "Open manholes you must jump. Rooftops to run along",
        boss: "The mail van throwing parcels"
      },
      platforms: {
        every: [10, 16],
        seconds: [2.5, 4],
        height: 100,
        leadIn: 0.4
      }
    },
    {
      id: "sunny-beach",
      name: "Sunny Beach",
      at: 4e3,
      speed: 365,
      gap: [1, 1.7],
      enabled: true,
      theme: "beach",
      obstacles: {
        crab: 1.2,
        sandcastle: 1,
        seagull: 1
      },
      patterns: {
        single: 3,
        pair: 1.2,
        flier: 1
      },
      twist: {
        kind: "waves",
        every: [7, 12],
        seconds: 1.6,
        slow: 0.75,
        ease: 0.35,
        leadIn: 0.35,
        after: 0.9
      },
      chase: {
        boss: "kingCrab",
        name: "King Crab",
        minion: "crab",
        minionWeight: 2.5,
        fight: {
          w: 124,
          stomp: {
            x0: 24,
            x1: 104,
            top: 52
          },
          attacks: [["crab"], ["crab", "sandcastle"], ["crab", "crab", "sandcastle"]]
        }
      },
      gate: null,
      about: {
        colour: "#2fa7d8",
        obstacles: "Crabs, sandcastles, seagulls",
        twist: "Waves wash in and slow you down",
        boss: "King Crab snapping behind you"
      },
      platforms: null
    },
    {
      id: "midnight-run",
      name: "Midnight Run",
      at: 7500,
      speed: 405,
      gap: [1, 1.6],
      enabled: true,
      theme: "night",
      obstacles: {
        owl: 1,
        bin: 1,
        fox: 1.2
      },
      patterns: {
        single: 3,
        pair: 1.5,
        flier: 1,
        triple: 0.6
      },
      twist: {
        kind: "lamps",
        darkness: 0.62,
        pool: 115
      },
      chase: {
        boss: "foxPack",
        name: "The fox pack",
        minion: "fox",
        minionWeight: 2.5,
        fight: {
          w: 170,
          stomp: {
            x0: 56,
            x1: 120,
            top: 46
          },
          attacks: [["fox"], ["fox", "bin"], ["fox", "fox", "bin"]]
        }
      },
      gate: null,
      about: {
        colour: "#3a3584",
        obstacles: "Owls, wheelie bins, foxes",
        twist: "Only lamp posts light the path. Rooftops to run along",
        boss: "A fox pack running alongside"
      },
      platforms: {
        every: [8, 13],
        seconds: [3, 4.5],
        height: 100,
        leadIn: 0.4
      }
    },
    {
      id: "snowy-peaks",
      name: "Snowy Peaks",
      at: 12e3,
      speed: 420,
      gap: [0.95, 1.6],
      enabled: true,
      theme: "snow",
      obstacles: {
        snowman: 1,
        snowball: 1.1
      },
      patterns: {
        single: 3,
        pair: 1.5,
        flier: 1,
        triple: 0.6
      },
      twist: {
        kind: "ice",
        every: [5, 9],
        seconds: [1.2, 2.2],
        jumpScale: 0.86,
        leadIn: 0.3
      },
      chase: {
        boss: "avalanche",
        name: "The avalanche",
        minion: "snowball",
        minionWeight: 2.5,
        fight: {
          w: 166,
          stomp: {
            x0: 40,
            x1: 126,
            top: 72
          },
          attacks: [["snowball"], ["snowball", "snowman"], ["snowball", "snowball", "snowman"]]
        }
      },
      gate: null,
      platforms: null,
      about: {
        colour: "#8fb8e8",
        obstacles: "Snowmen, rolling snowballs",
        twist: "Ice patches: jumps from ice are lower",
        boss: "An avalanche"
      }
    },
    {
      id: "building-site",
      name: "Building Site",
      at: 17500,
      speed: 445,
      gap: [0.95, 1.5],
      enabled: true,
      theme: "site",
      obstacles: {
        mixer: 1,
        cone: 0.6,
        girder: 0.8
      },
      patterns: {
        single: 3,
        pair: 1.5,
        flier: 1,
        triple: 0.6
      },
      twist: {
        kind: "belts",
        every: [6, 10],
        seconds: 1.4,
        fast: 1.3,
        slow: 0.75,
        fastChance: 0.5,
        ease: 0.35,
        leadIn: 0.35,
        after: 0.9
      },
      chase: {
        boss: "wreckingBall",
        name: "The wrecking ball",
        minion: "cone",
        minionWeight: 2,
        fight: {
          w: 150,
          stomp: {
            x0: 80,
            x1: 144,
            top: 40
          },
          attacks: [["girder"], ["cone", "girder"], ["mixer", "cone", "girder"]]
        }
      },
      gate: null,
      platforms: null,
      about: {
        colour: "#f2a93b",
        obstacles: "Cement mixers, swinging girders",
        twist: "Conveyor belts speed you up or slow you down",
        boss: "A wrecking ball"
      }
    },
    {
      id: "haunted-hollow",
      name: "Haunted Hollow",
      at: 24e3,
      speed: 470,
      gap: [0.9, 1.5],
      enabled: true,
      theme: "haunted",
      obstacles: {
        pumpkin: 1,
        ghost: 1,
        bat: 0.8
      },
      patterns: {
        single: 3,
        pair: 1.5,
        flier: 1,
        triple: 0.5
      },
      twist: {
        kind: "ghosts",
        minAlpha: 0.18,
        period: 1.6,
        solidWithin: 190
      },
      chase: {
        boss: "ghostHound",
        name: "The Ghost Hound",
        minion: "ghost",
        minionWeight: 2,
        fight: {
          w: 172,
          stomp: {
            x0: 42,
            x1: 142,
            top: 68
          },
          attacks: [["ghost"], ["ghost", "pumpkin"], ["ghost", "ghost", "pumpkin"]]
        }
      },
      gate: null,
      platforms: null,
      about: {
        colour: "#7b5a9c",
        obstacles: "Pumpkins, bats, ghosts",
        twist: "Ghosts fade in and out (solid when close)",
        boss: "The Ghost Hound"
      }
    },
    {
      id: "moon-walkies",
      name: "Moon Walkies",
      at: 32e3,
      speed: 495,
      gap: [0.9, 1.4],
      enabled: true,
      theme: "moon",
      obstacles: {
        crater: 1,
        alienCat: 1
      },
      patterns: {
        single: 3,
        pair: 1.5,
        triple: 0.6
      },
      twist: {
        kind: "lowGravity",
        gravityScale: 0.75
      },
      chase: {
        boss: "ufo",
        name: "The UFO",
        minion: "alienCat",
        minionWeight: 2,
        fight: {
          w: 162,
          stomp: {
            x0: 24,
            x1: 138,
            top: 82
          },
          attacks: [
            ["alienCat"],
            ["crater", "alienCat"],
            ["alienCat", "crater", "alienCat"],
            ["alienCat", "alienCat", "crater", "alienCat"]
          ]
        }
      },
      gate: null,
      chaseEvery: 4e3,
      platforms: null,
      about: {
        colour: "#7d7f99",
        obstacles: "Craters, alien cats",
        twist: "Low gravity: long floaty jumps",
        boss: "A UFO every 4,000 points"
      }
    }
  ],
  comingSoon: [],
  tutorial: {
    jumpClears: 2,
    doubleClears: 2,
    gapScale: 1.7,
    biscuitLineSeconds: 2,
    coach: {
      jump: {
        title: "Tap to jump",
        text: "Tap anywhere just before you reach the obstacle."
      },
      double: {
        title: "Tap again in the air",
        text: "A second tap mid-jump is a double jump. You'll need it for these."
      },
      biscuits: {
        title: "Eat biscuits",
        text: "Each biscuit fills one block of the power meter. Fill all 8 for a power-up!"
      },
      oops: {
        title: "Oops!",
        text: "No harm done while you learn. Tap a little earlier."
      },
      done: {
        title: "You're ready!",
        text: "Now it counts. Run as far as you can!"
      }
    }
  },
  fight: {
    window: 900,
    hits: 3,
    enterSeconds: 1,
    warnSeconds: 0.8,
    afterAttack: 0.5,
    tiredSeconds: 2.6,
    hurtSeconds: 0.5,
    returnSeconds: 1,
    leaveSeconds: 1.4,
    frontFromRight: 150,
    stompBounce: -640,
    beatBonus: 250,
    flawlessBonus: 100,
    bones: 5,
    coach: {
      dodge: {
        title: "Boss fight!",
        text: "Dodge its attacks. Watch for the red !"
      },
      stomp: {
        title: "Jump on its head!",
        text: "It's tired. Land on top of it to hit it."
      },
      hit: {
        title: "Hit!",
        text: "Again! Hit it 3 times to knock it out."
      },
      win: {
        title: "Knocked out!",
        text: "+250 points and Golden Bones."
      },
      tip: "Tip: when a boss gets tired, jump on its head. Three hits knocks it out."
    }
  },
  bigBark: {
    _: "Big Bark (M7): saved up from missions and the Pup Pass; at most perRun used in a run. Clears every obstacle on screen.",
    perRun: 1
  }
};

// game/config.ts
var worldPhysics = /* @__PURE__ */ new WeakMap();
function physicsFor(cfg, world) {
  const tw = world?.twist;
  if (!world || tw?.kind !== "lowGravity") return cfg.physics;
  const hit = worldPhysics.get(world);
  if (hit && hit.base === cfg.physics) return hit.p;
  const p = { ...cfg.physics, gravity: cfg.physics.gravity * tw.gravityScale };
  worldPhysics.set(world, { base: cfg.physics, p });
  return p;
}
function loadGameConfig(overrides) {
  const base = JSON.parse(JSON.stringify(worlds_default));
  return overrides ? { ...base, ...overrides } : base;
}
function playableWorlds(cfg) {
  const out = [];
  for (const w of cfg.worlds) {
    if (!w.enabled) break;
    out.push(w);
  }
  return out;
}

// game/physics.ts
function newDog() {
  return { y: 0, vy: 0, grounded: true, jumps: 0, buffer: 0, coyote: 0, held: 0 };
}
function timeToGround(d, p, floor = 0) {
  if (d.grounded) return 0;
  const disc = d.vy * d.vy - 2 * p.gravity * (d.y - floor);
  return (-d.vy + Math.sqrt(Math.max(0, disc))) / p.gravity;
}
function tryJump(d, p, floor, jumpScale) {
  if (d.grounded || d.coyote > 0) {
    d.vy = p.jumpVelocity * jumpScale;
    d.grounded = false;
    d.coyote = 0;
    d.jumps = 1;
    d.held = 0;
    return "ground";
  }
  if (d.jumps < 2) {
    const falling = d.vy > 0;
    if (falling && timeToGround(d, p, floor) <= d.buffer) return null;
    d.vy = p.doubleJumpVelocity;
    d.jumps = 2;
    d.held = 0;
    return "double";
  }
  return null;
}
function stepDog(d, p, dt, pressed, env = {}) {
  const floor = env.floor ?? 0;
  const holding = env.holding ?? false;
  const jumpScale = env.jumpScale ?? 1;
  let jumped = null;
  let landed = false;
  if (pressed) d.buffer = p.jumpBuffer;
  if (d.grounded && d.y < floor) leaveGround(d, p);
  if (d.buffer > 0) {
    jumped = tryJump(d, p, floor, jumpScale);
    if (jumped) d.buffer = 0;
  }
  if (!d.grounded) {
    const held = holding && d.vy < 0 && d.held < p.hold.maxSeconds;
    if (held) d.held += dt;
    d.vy += p.gravity * (held ? p.hold.gravityScale : 1) * dt;
    d.y += d.vy * dt;
    d.coyote = Math.max(0, d.coyote - dt);
    if (d.y >= floor) {
      d.y = floor;
      d.vy = 0;
      d.grounded = true;
      d.jumps = 0;
      landed = true;
      if (d.buffer > 0) {
        jumped = tryJump(d, p, floor, jumpScale);
        d.buffer = 0;
      }
    }
  }
  d.buffer = Math.max(0, d.buffer - dt);
  return { jumped, landed };
}
function leaveGround(d, p) {
  if (!d.grounded) return;
  d.grounded = false;
  d.coyote = p.coyoteTime;
  d.jumps = 1;
}
function maxAirTime(h, p, dt) {
  const d = { y: -h, vy: 0, grounded: true, jumps: 0, buffer: 0, coyote: 0, held: 0 };
  stepDog(d, p, dt, true, { holding: true });
  let k = 1;
  let doubled = false;
  while (!d.grounded && k < 1e3) {
    const press = !doubled && d.vy >= 0;
    if (press) doubled = true;
    stepDog(d, p, dt, press, { holding: true });
    k++;
  }
  return k * dt;
}
function dogBox(dogX, y, hb) {
  return { x0: dogX + hb.x0, x1: dogX + hb.x1, y0: y + hb.y0, y1: y + hb.y1 };
}
function obstacleBox(x, def) {
  const bottom = -(def.fly ?? 0);
  return {
    x0: x + def.inset,
    x1: x + def.w - def.inset,
    y0: bottom - def.h + def.inset,
    y1: bottom
  };
}
function overlaps(a, b) {
  return a.x1 > b.x0 && a.x0 < b.x1 && a.y1 > b.y0 && a.y0 < b.y1;
}

// game/powerups.ts
var TIMED_POWERS = ["zoomies", "magnet", "frisbee", "sniff"];
function newPowerState(levels = {}) {
  return {
    meter: 0,
    fills: 0,
    zoomies: 0,
    magnet: 0,
    frisbee: 0,
    sniff: 0,
    shield: 0,
    grace: 0,
    full: { zoomies: 0, magnet: 0, frisbee: 0, sniff: 0 },
    levels: { ...levels }
  };
}
function powerLevel(levels, kind, cfg) {
  const l = Math.floor(levels[kind] ?? 0);
  return Math.max(0, Math.min(cfg.powerups.upgrades.maxLevel, Number.isFinite(l) ? l : 0));
}
function powerDuration(kind, level, cfg) {
  const d = cfg.powerups[kind];
  const max = cfg.powerups.upgrades.maxLevel;
  const l = Math.max(0, Math.min(max, level));
  return d.duration + (d.maxDuration - d.duration) * l / max;
}
function shieldSafeTime(level, cfg) {
  const s = cfg.powerups.shield;
  const max = cfg.powerups.upgrades.maxLevel;
  const l = Math.max(0, Math.min(max, level));
  return s.invulnerableAfterHit + (s.maxInvulnerable - s.invulnerableAfterHit) * l / max;
}
function shieldBubbles(level, cfg) {
  return level >= cfg.powerups.upgrades.maxLevel ? cfg.powerups.shield.maxLevelBubbles : 1;
}
function activate(s, kind, cfg) {
  const level = powerLevel(s.levels, kind, cfg);
  if (kind === "shield") s.shield = shieldBubbles(level, cfg);
  else {
    const d = powerDuration(kind, level, cfg);
    s[kind] = d;
    s.full[kind] = d;
  }
  return { kind, active: true };
}
function isOn(s, kind) {
  return kind === "shield" ? s.shield > 0 : s[kind] > 0;
}
function pickPower(s, rng) {
  const all = ["zoomies", "magnet", "shield", "frisbee", "sniff"];
  const options = all.filter((k) => !isOn(s, k));
  if (!options.length) return "zoomies";
  return options[rng.int(options.length)];
}
function meterNeeded(s, cfg) {
  const m = cfg.meter;
  return Math.max(m.blocks, Math.min(m.maxBlocks, m.blocks + m.growBy * s.fills));
}
function eatBiscuit(s, gold, rng, cfg) {
  if (gold) return activate(s, "zoomies", cfg);
  if (!cfg.meter.fillDuringPower && (s.zoomies > 0 || s.magnet > 0 || s.frisbee > 0)) return null;
  s.meter++;
  if (s.meter < meterNeeded(s, cfg)) return null;
  s.meter = 0;
  s.fills++;
  return activate(s, pickPower(s, rng), cfg);
}
function tickPowers(s, dt, cfg) {
  const ended = [];
  s.grace = Math.max(0, s.grace - dt);
  for (const k of TIMED_POWERS) {
    if (s[k] <= 0) continue;
    s[k] -= dt;
    if (s[k] > 0) continue;
    s[k] = 0;
    if (k === "zoomies") s.grace = Math.max(s.grace, cfg.powerups.zoomies.graceAfter);
    if (k === "frisbee") s.grace = Math.max(s.grace, cfg.powerups.frisbee.graceAfter);
    ended.push({ kind: k, active: false });
  }
  return ended;
}
function resolveHit(s, cfg) {
  if (s.zoomies > 0) return "smash";
  if (s.grace > 0 || s.frisbee > 0) return "pass";
  if (s.shield > 0) {
    s.shield--;
    s.grace = shieldSafeTime(powerLevel(s.levels, "shield", cfg), cfg);
    return "shield";
  }
  return "crash";
}
function speedMultiplier(s, cfg) {
  return s.zoomies > 0 ? cfg.powerups.zoomies.speedMultiplier : 1;
}
function goldenScale(s, cfg) {
  return s.sniff > 0 ? cfg.powerups.sniff.goldenMultiplier : 1;
}

// game/scoring.ts
function metres(dist, cfg) {
  return Math.floor(dist / cfg.scoring.unitsPerMetre);
}
function score(p, cfg) {
  return metres(p.dist, cfg) + p.biscuits * cfg.scoring.biscuit + p.smashes * cfg.scoring.smash + (p.nearMisses ?? 0) * cfg.scoring.nearMiss;
}

// game/rng.ts
var Rng = class {
  s;
  constructor(seed) {
    this.s = seed >>> 0 || 2654435769;
  }
  /** 0 ≤ n < 1 */
  next() {
    let t = this.s = this.s + 1831565813 >>> 0;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  range(a, b) {
    return a + this.next() * (b - a);
  }
  int(n) {
    return Math.floor(this.next() * n);
  }
  chance(p) {
    return this.next() < p;
  }
  /** Picks a key with probability proportional to its weight. */
  weighted(weights) {
    const entries = Object.entries(weights);
    const total = entries.reduce((s, [, w]) => s + Math.max(0, w), 0);
    let r = this.next() * total;
    for (const [k, w] of entries) {
      r -= Math.max(0, w);
      if (r < 0) return k;
    }
    return entries[entries.length - 1][0];
  }
};

// game/spawner.ts
var MAX_DOUBLE_DELAY = 40;
var LEDGE_LANDING_SECONDS = 1.1;
function findClearPlan(pattern, cfg, opts) {
  const dt = 1 / cfg.loop.hz;
  const p = opts.physics ?? cfg.physics;
  const hb = cfg.dog.hitbox;
  const dogX = cfg.view.dogX;
  const ready = Math.max(0, Math.ceil(opts.ready));
  const n = pattern.length;
  const bx0 = new Float64Array(n);
  const bx1 = new Float64Array(n);
  const by0 = new Float64Array(n);
  const by1 = new Float64Array(n);
  const vStep = new Float64Array(n);
  const drift = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const def = cfg.obstacles[pattern[i].type];
    const b = obstacleBox(pattern[i].x, def);
    bx0[i] = b.x0;
    bx1[i] = b.x1;
    by0[i] = b.y0;
    by1[i] = b.y1;
    drift[i] = (def.extraSpeed ?? 0) * dt;
    vStep[i] = opts.speed * dt + drift[i];
  }
  const gx0 = dogX + hb.x0;
  const gx1 = dogX + hb.x1;
  const ice = opts.ice ?? [];
  const iceScale = opts.iceJumpScale ?? 1;
  const feetX = dogX + (hb.x0 + hb.x1) / 2;
  const groundStep = opts.speed * dt;
  const onIce = (k) => {
    for (const r of ice) {
      const off = groundStep * k;
      if (feetX >= r.x0 - off && feetX <= r.x1 - off) return true;
    }
    return false;
  };
  const hit = (k, y) => {
    const dy0 = y + hb.y0;
    const dy1 = y + hb.y1;
    for (let i = 0; i < n; i++) {
      const off = vStep[i] * k + drift[i];
      if (gx1 > bx0[i] - off && gx0 < bx1[i] - off && dy1 > by0[i] && dy0 < by1[i]) return true;
    }
    return false;
  };
  const anyAhead = (k) => {
    for (let i = 0; i < n; i++) if (bx1[i] - (vStep[i] * k + drift[i]) >= gx0) return true;
    return false;
  };
  const xOverlap = (k) => {
    for (let i = 0; i < n; i++) {
      const off = vStep[i] * k + drift[i];
      if (gx1 > bx0[i] - off && gx0 < bx1[i] - off) return true;
    }
    return false;
  };
  let passK = 0;
  while (anyAhead(passK) && passK < 2e3) passK++;
  let groundHitK = Infinity;
  let xOverlapK = Infinity;
  for (let k = 0; k <= passK; k++) {
    if (xOverlapK === Infinity && xOverlap(k)) xOverlapK = k;
    if (hit(k, 0)) {
      groundHitK = k;
      break;
    }
  }
  if (xOverlapK < ready) return null;
  if (groundHitK === Infinity) return { jump: null, double: null, land: ready };
  const latest = Math.min(groundHitK, passK + 1);
  const earliest = Math.max(ready, latest - 60);
  const dog = newDog();
  const simulate = (j, d2) => {
    dog.y = 0;
    dog.vy = 0;
    dog.grounded = true;
    dog.jumps = 0;
    dog.buffer = 0;
    dog.coyote = 0;
    dog.held = 0;
    for (let k = j; k < j + 400; k++) {
      stepDog(
        dog,
        p,
        dt,
        k === j || k === d2,
        ice.length && onIce(k) ? { jumpScale: iceScale } : {}
      );
      if (k > passK) {
        if (dog.grounded) return k;
      } else if (hit(k, dog.y)) return null;
    }
    return null;
  };
  let best = null;
  for (let j = earliest; j < latest; j++) {
    const land = simulate(j, -1);
    if (land !== null && (!best || land < best.land)) best = { jump: j, double: null, land };
  }
  if (best) return best;
  for (let j = earliest; j < latest; j++) {
    if (best && j > (best.jump ?? j) + 4) break;
    for (let dd = 2; dd <= MAX_DOUBLE_DELAY; dd += 2) {
      const land = simulate(j, j + dd);
      if (land !== null && (!best || land < best.land)) best = { jump: j, double: j + dd, land };
    }
  }
  return best;
}
function iceOpts(patches, dist) {
  if (!patches.length) return {};
  return {
    ice: patches.map((r) => ({ x0: r.wx0 - dist, x1: r.wx1 - dist })),
    iceJumpScale: Math.min(...patches.map((r) => r.jumpScale))
  };
}
var Spawner = class {
  constructor(cfg, seed, viewW) {
    this.cfg = cfg;
    this.rng = new Rng(seed);
    this.viewW = viewW;
    this.nextAt = viewW * cfg.spawner.firstObstacleAt;
    this.nextBreather = cfg.spawner.breatherEvery;
  }
  cfg;
  rng;
  nextAt;
  nextBreather;
  /** Absolute step at which the dog has landed from the last placed pattern. */
  readyStep = 0;
  viewW;
  nextWave = Infinity;
  waveWorld = "";
  nextLedge = Infinity;
  ledgeWorld = "";
  nextIce = Infinity;
  iceWorld = "";
  /** Ice patches placed so far that may still be under or ahead of the dog (world x). */
  icePatches = [];
  /** The latest ledge: no fliers near it, and nothing in the landing zone up to clearTo. */
  ledge = null;
  /** After a continue: nothing new until world x `wx` (the cleared stretch stays clear). */
  holdUntil(wx, readyStep = 0) {
    this.nextAt = Math.max(this.nextAt, wx);
    this.readyStep = readyStep;
  }
  /** Call once per step after `dist` advances. Returns anything that should appear now. */
  /** Golden-biscuit multiplier for the batch being made (Super Sniff). */
  goldenScale = 1;
  update(s) {
    this.goldenScale = s.goldenScale ?? 1;
    const sc = this.cfg.spawner;
    const spawnEdge = s.dist + this.viewW + sc.spawnAhead;
    if (this.nextAt > spawnEdge) return null;
    const tut = s.tutorial ?? null;
    if (tut === "biscuits") {
      const len = this.cfg.tutorial.biscuitLineSeconds * s.speed;
      const b = this.cfg.spawner.biscuits;
      const biscuits2 = [];
      for (let x = 20; x < len; x += b.spacing * 1.5)
        biscuits2.push({ wx: this.nextAt + x, y: b.lowY, gold: false });
      this.nextAt += len;
      this.readyStep = 0;
      return { obstacles: [], biscuits: biscuits2, plan: null, pattern: "breather" };
    }
    if (s.fight) return this.fightUpdate(s, s.fight.attack, spawnEdge);
    if (!tut && s.time >= this.nextBreather) {
      this.nextBreather += sc.breatherEvery;
      const len = sc.breatherSeconds * s.speed;
      const biscuits2 = this.breatherBiscuits(this.nextAt, len);
      this.nextAt += len;
      return { obstacles: [], biscuits: biscuits2, plan: null, pattern: "breather" };
    }
    if (s.clear && this.nextAt < s.clear.wx1 && this.nextAt + 300 > s.clear.wx0) {
      const len = s.clear.wx1 - this.nextAt;
      const biscuits2 = this.breatherBiscuits(this.nextAt, len);
      this.nextAt = s.clear.wx1;
      return { obstacles: [], biscuits: biscuits2, plan: null, pattern: "breather" };
    }
    const tw = s.world.twist;
    if (!tut && tw?.kind === "waves") {
      if (this.waveWorld !== s.world.id) {
        this.waveWorld = s.world.id;
        this.nextWave = s.time + this.rng.range(tw.every[0], tw.every[1]);
      } else if (s.time >= this.nextWave) {
        this.nextWave = s.time + this.rng.range(tw.every[0], tw.every[1]);
        return this.makeWave(tw, s);
      }
    }
    if (!tut && tw?.kind === "belts") {
      if (this.waveWorld !== s.world.id) {
        this.waveWorld = s.world.id;
        this.nextWave = s.time + this.rng.range(tw.every[0], tw.every[1]);
      } else if (s.time >= this.nextWave) {
        this.nextWave = s.time + this.rng.range(tw.every[0], tw.every[1]);
        return this.makeBelt(tw, s);
      }
    }
    if (!tut && tw?.kind === "ice") {
      if (this.iceWorld !== s.world.id) {
        this.iceWorld = s.world.id;
        this.nextIce = s.time + this.rng.range(tw.every[0], tw.every[1]);
      } else if (s.time >= this.nextIce) {
        this.nextIce = s.time + this.rng.range(tw.every[0], tw.every[1]);
        const wx0 = this.nextAt + tw.leadIn * s.speed;
        const wx1 = wx0 + this.rng.range(tw.seconds[0], tw.seconds[1]) * s.speed;
        const patch = { wx0, wx1, jumpScale: tw.jumpScale };
        this.icePatches.push(patch);
        return { obstacles: [], biscuits: [], plan: null, pattern: "ice", ice: patch };
      }
    }
    while (this.icePatches.length && this.icePatches[0].wx1 < s.dist) this.icePatches.shift();
    const pf = s.minion ? null : s.world.platforms;
    if (!tut && pf) {
      if (this.ledgeWorld !== s.world.id) {
        this.ledgeWorld = s.world.id;
        this.nextLedge = s.time + this.rng.range(pf.every[0], pf.every[1]);
      } else if (s.time >= this.nextLedge && (!this.ledge || this.nextAt >= this.ledge.clearTo)) {
        this.nextLedge = s.time + this.rng.range(pf.every[0], pf.every[1]);
        return this.makeLedge(pf, s);
      }
    }
    const intro = s.time < sc.introSeconds;
    const base = this.nextAt;
    const x0 = base - s.dist;
    const ready = this.readyStep - s.step;
    const ice = iceOpts(this.icePatches, s.dist);
    const physics = physicsFor(this.cfg, s.world);
    const nextPhysics = physicsFor(this.cfg, s.nextWorld);
    const check = (pat) => {
      const plan2 = findClearPlan(pat, this.cfg, { speed: s.speed, ready, physics, ...ice });
      if (!plan2) return null;
      if (nextPhysics !== physics && !findClearPlan(pat, this.cfg, {
        speed: s.nextSpeed ?? s.speed,
        ready: 0,
        physics: nextPhysics,
        ...ice
      }))
        return null;
      const zone = tw?.kind === "waves" ? [s.speed * tw.slow] : tw?.kind === "belts" ? [s.speed * tw.slow, s.speed * tw.fast] : [];
      for (const v of [s.world.speed, s.nextSpeed, ...zone])
        if (v && v !== s.speed && !findClearPlan(pat, this.cfg, { speed: v, ready: 0, physics, ...ice }))
          return null;
      return plan2;
    };
    let kind = intro || tut ? "single" : this.rng.weighted(s.world.patterns);
    const L = this.ledge;
    const nearLedge = !!L && base < L.clearTo && base + 400 > L.wx0;
    if (nearLedge && kind === "flier") kind = "single";
    let pattern;
    let plan;
    if (tut === "double") {
      kind = "pair";
      const needsDouble = (p) => p && p.double !== null ? p : null;
      pattern = this.makePattern(kind, x0, s);
      plan = needsDouble(check(pattern));
      for (let tries = 0; !plan && tries < 24; tries++) {
        kind = tries % 2 ? "triple" : "pair";
        pattern = this.makePattern(kind, x0, s);
        plan = needsDouble(check(pattern));
      }
    } else {
      pattern = this.makePattern(kind, x0, s);
      plan = check(pattern);
      for (let tries = 0; !plan && tries < 3; tries++) {
        pattern = this.makePattern(kind, x0, s);
        plan = check(pattern);
      }
    }
    if (!plan && kind !== "single") {
      kind = "single";
      pattern = this.makePattern(kind, x0, s);
      plan = check(pattern);
    }
    if (plan && nearLedge) {
      const last2 = pattern[pattern.length - 1];
      const endW = last2.x + this.cfg.obstacles[last2.type].w + s.dist;
      if (endW > L.wx1) {
        this.nextAt = Math.max(this.nextAt, L.clearTo);
        return null;
      }
    }
    if (!plan) {
      this.nextAt += 24;
      return null;
    }
    this.readyStep = s.step + plan.land + 1;
    const obstacles = pattern.map((o) => ({ type: o.type, wx: o.x + s.dist }));
    const start = obstacles[0].wx;
    const last = obstacles[obstacles.length - 1];
    const end = last.wx + this.cfg.obstacles[last.type].w;
    let [g0, g1] = s.world.gap;
    const scale = tut ? this.cfg.tutorial.gapScale : intro ? sc.introGapScale : 1;
    g0 *= scale;
    g1 *= scale;
    this.nextAt = start + this.rng.range(g0, g1) * s.speed;
    this.nextAt = Math.max(this.nextAt, end + 60);
    const biscuits = this.patternBiscuits(kind, start, end).filter((b) => b.wx < this.nextAt - 40);
    return {
      obstacles,
      biscuits,
      plan: {
        jump: plan.jump === null ? null : s.step + plan.jump,
        double: plan.double === null ? null : s.step + plan.double
      },
      pattern: kind
    };
  }
  pool(s, ground) {
    const pool = {};
    const last = s.worldsSoFar.length - 1;
    for (const [i, w] of s.worldsSoFar.entries()) {
      let scale = 1;
      for (let k = i; k < last; k++) scale *= this.cfg.spawner.carryOver;
      if (!scale) continue;
      for (const [k, v] of Object.entries(w.obstacles)) {
        if (ground && this.cfg.obstacles[k].fly) continue;
        pool[k] = (pool[k] ?? 0) + v * scale;
      }
    }
    const m = s.minion;
    if (m && !(ground && this.cfg.obstacles[m.type].fly))
      pool[m.type] = (pool[m.type] ?? 0) + m.weight;
    return pool;
  }
  makePattern(kind, x0, s) {
    const ground = this.pool(s, true);
    if (kind === "flier") {
      const flier = this.pool(s, false);
      const fliers = Object.keys(flier).filter((k) => this.cfg.obstacles[k].fly);
      if (fliers.length)
        return [{ type: fliers[this.rng.int(fliers.length)], x: x0 }];
      kind = "single";
    }
    const n = kind === "pair" ? 2 : kind === "triple" ? 3 : 1;
    const out = [];
    let x = x0;
    for (let i = 0; i < n; i++) {
      const type = this.rng.weighted(ground);
      out.push({ type, x });
      x += this.cfg.obstacles[type].w + this.rng.range(...this.cfg.spawner.pairGap);
    }
    return out;
  }
  patternBiscuits(kind, start, end) {
    const b = this.cfg.spawner.biscuits;
    const out = [];
    if (kind === "flier") {
      for (let i = 0; i < 4; i++)
        out.push({ wx: start - 30 + i * b.spacing, y: b.flierLineY, gold: false });
      return out;
    }
    if (!this.rng.chance(b.chance)) return out;
    const r = this.rng.next();
    if (r < b.arcChance) {
      const mid = (start + end) / 2;
      const golden = this.rng.chance(b.goldenArcChance * this.goldenScale);
      const half = Math.floor(b.arcCount / 2);
      for (let i = -half; i <= half; i++) {
        const dx = i * b.spacing;
        const q = dx / b.arcHalfWidth;
        const h = Math.max(0, b.arcHeight * (1 - q * q));
        out.push({ wx: mid + dx, y: -h - b.arcLift, gold: golden && i === 0 });
      }
    } else if (r < b.arcChance + b.lowLineChance) {
      const n = 3 + this.rng.int(3);
      for (let i = 0; i < n; i++)
        out.push({ wx: end + b.lineAfter + i * b.spacing, y: b.lowY, gold: false });
    } else {
      for (let i = 0; i < 3; i++)
        out.push({ wx: end + b.highAfter + i * b.spacing, y: b.highY, gold: false });
    }
    return out;
  }
  /**
   * A ledge: the rooftop of a low building, with biscuits along the top. Obstacles keep
   * spawning on the ground underneath as usual (ground ones only); after it ends, the
   * ground stays clear long enough for any jump off its edge to land.
   */
  makeLedge(pf, s) {
    const wx0 = this.nextAt + pf.leadIn * s.speed;
    const wx1 = wx0 + this.rng.range(pf.seconds[0], pf.seconds[1]) * s.speed;
    const hb = this.cfg.dog.hitbox;
    const tw = s.world.twist;
    const zone = tw?.kind === "belts" ? tw.fast : 1;
    const fastest = Math.max(s.speed, s.nextSpeed ?? 0) * zone + this.maxExtraSpeed();
    const air = maxAirTime(pf.height, physicsFor(this.cfg, s.world), 1 / this.cfg.loop.hz);
    const clearTo = wx1 + (hb.x1 - hb.x0) + fastest * (air + LEDGE_LANDING_SECONDS);
    this.ledge = { wx0, wx1, clearTo };
    const b = this.cfg.spawner.biscuits;
    const biscuits = [];
    const mid = (wx0 + wx1) / 2;
    const golden = this.rng.chance(b.goldenArcChance * 2 * this.goldenScale);
    for (let x = wx0 + 50; x < wx1 - 30; x += b.spacing * 1.5)
      biscuits.push({ wx: x, y: -pf.height + b.lowY, gold: false });
    if (golden && biscuits.length) {
      let k = 0;
      for (let i = 1; i < biscuits.length; i++)
        if (Math.abs(biscuits[i].wx - mid) < Math.abs(biscuits[k].wx - mid)) k = i;
      biscuits[k].gold = true;
    }
    return {
      obstacles: [],
      biscuits,
      plan: null,
      pattern: "ledge",
      ledge: { wx0, wx1, h: pf.height, theme: s.world.theme }
    };
  }
  maxExtraSpeed() {
    let m = 0;
    for (const d of Object.values(this.cfg.obstacles)) m = Math.max(m, d.extraSpeed ?? 0);
    return m;
  }
  /**
   * Boss fight: keep up with the spawn edge, and place an attack when asked, proven
   * clearable like any pattern (or wait a moment and try again).
   */
  fightUpdate(s, attack, edge) {
    if (!attack) {
      this.nextAt = Math.max(this.nextAt, edge);
      return null;
    }
    const x0 = this.nextAt - s.dist;
    const pattern = [];
    let x = x0;
    for (const type of attack) {
      pattern.push({ type, x });
      x += this.cfg.obstacles[type].w + this.cfg.spawner.pairGap[1];
    }
    const plan = findClearPlan(pattern, this.cfg, {
      speed: s.speed,
      ready: this.readyStep - s.step,
      physics: physicsFor(this.cfg, s.world)
    });
    if (!plan) {
      this.nextAt += 24;
      return null;
    }
    this.readyStep = s.step + plan.land + 1;
    const obstacles = pattern.map((o) => ({ type: o.type, wx: o.x + s.dist }));
    const lastO = obstacles[obstacles.length - 1];
    this.nextAt = lastO.wx + this.cfg.obstacles[lastO.type].w + 60;
    return {
      obstacles,
      biscuits: [],
      plan: {
        jump: plan.jump === null ? null : s.step + plan.jump,
        double: plan.double === null ? null : s.step + plan.double
      },
      pattern: "attack"
    };
  }
  /** A conveyor belt: clear running at a faster or slower speed, with a line of biscuits. */
  makeBelt(tw, s) {
    const mul = this.rng.chance(tw.fastChance) ? tw.fast : tw.slow;
    const wx0 = this.nextAt + tw.leadIn * s.speed;
    const wx1 = wx0 + tw.seconds * s.speed * mul;
    const b = this.cfg.spawner.biscuits;
    const biscuits = [];
    for (let x = wx0 + 40; x < wx1 - 30; x += b.breatherSpacing)
      biscuits.push({ wx: x, y: b.lowY, gold: false });
    this.nextAt = wx1 + tw.after * s.speed;
    return {
      obstacles: [],
      biscuits,
      plan: null,
      pattern: "wave",
      wave: { wx0, wx1, slow: mul, belt: true }
    };
  }
  /** A wave: clear water to run through (slowly), with a low line of biscuits. */
  makeWave(tw, s) {
    const wx0 = this.nextAt + tw.leadIn * s.speed;
    const wx1 = wx0 + tw.seconds * s.speed * tw.slow;
    const b = this.cfg.spawner.biscuits;
    const biscuits = [];
    for (let x = wx0 + 40; x < wx1 - 30; x += b.breatherSpacing)
      biscuits.push({ wx: x, y: b.lowY, gold: false });
    this.nextAt = wx1 + tw.after * s.speed;
    return {
      obstacles: [],
      biscuits,
      plan: null,
      pattern: "wave",
      wave: { wx0, wx1, slow: tw.slow }
    };
  }
  breatherBiscuits(start, len) {
    const b = this.cfg.spawner.biscuits;
    const out = [];
    for (let x = 40; x < len - 40; x += b.breatherSpacing) {
      const p = x / len * 2 % 1;
      const tri = p < 0.5 ? p * 2 : 2 - p * 2;
      const wave = tri * tri * (3 - 2 * tri);
      out.push({ wx: start + x, y: b.lowY - wave * 70, gold: false });
    }
    return out;
  }
};

// game/worlds.ts
function worldIndexForScore(score2, worlds) {
  let i = 0;
  while (i + 1 < worlds.length && score2 >= worlds[i + 1].at) i++;
  return i;
}
function gateTarget(index, all, score2 = 0) {
  const next = all[index + 1]?.at;
  if (next !== void 0) return next;
  const cur = all[index];
  if (!cur) return null;
  if (cur.gate != null) return cur.gate;
  if (cur.chaseEvery) {
    const k = Math.floor(Math.max(0, score2 - cur.at) / cur.chaseEvery) + 1;
    return cur.at + k * cur.chaseEvery;
  }
  return null;
}

// game/run.ts
var Run = class {
  cfg;
  seed;
  worlds = [];
  dt;
  spawner;
  opts;
  state = "running";
  step = 0;
  time = 0;
  dist = 0;
  prevDist = 0;
  speed;
  worldIndex = 0;
  dog = newDog();
  prevDogY = 0;
  runPhase = 0;
  obstacles = [];
  biscuits = [];
  /** Waves on the path (world x); in one, the speed eases down to `slow`. */
  /** Speed zones: waves (Sunny Beach) and conveyor belts (Building Site, `belt`). */
  waves = [];
  /** Rooftop ledges in play (City Streets, Midnight Run). */
  ledges = [];
  /** World x the Frisbee biscuit line has been laid up to. */
  glideLineTo = 0;
  /** Ice patches in play (Snowy Peaks). */
  ice = [];
  /** Current wave speed multiplier (1 out of the water). */
  waveMul = 1;
  /** The multiplier waveMul is easing toward (1 outside a zone). */
  zoneWant = 1;
  inWave = false;
  lastSlow = 1;
  power = newPowerState();
  /** Gate chase in progress: the boss chasing, and the score that escapes it. */
  chase = null;
  /** When the last chase ended (run time), so the boss can drop back on screen. */
  chaseEnded = null;
  escapes = 0;
  escaped = [];
  beaten = [];
  fightTip = false;
  /** Boss fight in progress, if any. */
  fight = null;
  fightAttack = null;
  fightAttackIds = [];
  coachUsed = false;
  viewW;
  continues = 0;
  hitBy = null;
  nearMisses = 0;
  jumps = 0;
  powerupsUsed = 0;
  golden = 0;
  cleared = {};
  /** The last score target a chase started for (targets only go up). */
  lastChased = -1;
  /** Tutorial progress (null when this isn't a tutorial run). */
  tutorial = null;
  biscuitsEaten = 0;
  smashes = 0;
  score = 0;
  crashTime = 0;
  events = [];
  fx = [];
  pressed = false;
  taps = /* @__PURE__ */ new Set();
  tapSpeed = 0;
  nextId = 1;
  scoreOffset = 0;
  constructor(cfg, seed, viewW, opts = {}) {
    this.cfg = cfg;
    this.seed = seed;
    this.opts = opts;
    this.power = newPowerState(opts.powerLevels);
    this.worlds = playableWorlds(cfg);
    this.dt = 1 / cfg.loop.hz;
    this.spawner = new Spawner(cfg, seed, viewW);
    this.viewW = viewW;
    const sw = Math.min(Math.max(0, opts.startWorld ?? 0), this.worlds.length - 1);
    this.worldIndex = sw;
    this.scoreOffset = this.worlds[sw].at;
    this.speed = this.worlds[sw].speed;
    if (opts.tutorial) {
      this.tutorial = { step: "jump", count: 0, doubled: false };
      this.emit("tutorial", { step: "jump", oops: false });
    }
  }
  get tutorialActive() {
    return !!this.tutorial && this.tutorial.step !== "done";
  }
  tutorialStep(step) {
    this.tutorial = { step, count: 0, doubled: false };
    this.emit("tutorial", { step, oops: false });
  }
  /** An obstacle went past untouched: counts toward the jump and double-jump steps. */
  tutorialCleared() {
    const t = this.tutorial;
    if (!t || t.step === "done" || t.step === "biscuits") return;
    const T = this.cfg.tutorial;
    if (t.step === "jump") {
      if (++t.count >= T.jumpClears) this.tutorialStep("double");
    } else if (t.doubled && ++t.count >= T.doubleClears) this.tutorialStep("biscuits");
  }
  /**
   * The speed to run at: the world's own, except in the last world past its gate (or from
   * its start, if it has no gate), where it keeps climbing with score up to a cap
   * (content/worlds.json "endless").
   */
  targetSpeed(score2 = this.score) {
    const w = this.world;
    const from = w.gate ?? w.at;
    if (this.worldIndex < this.worlds.length - 1 || score2 <= from) return w.speed;
    const e = this.cfg.endless;
    return Math.min(e.maxSpeed, w.speed + e.perThousand * (score2 - from) / 1e3);
  }
  get world() {
    return this.worlds[this.worldIndex];
  }
  /** Effective scroll speed including Zoomies. */
  get scrollSpeed() {
    return this.speed * speedMultiplier(this.power, this.cfg) * this.waveMul;
  }
  press() {
    this.record("p");
    if (this.state === "running") this.pressed = true;
  }
  /** The jump is being held down (only counts with hold to jump higher on). */
  holding = false;
  /** Hold starts or ends (recorded, so a replay holds exactly as the player did). */
  setHolding(on) {
    if (on === this.holding) return;
    this.record(on ? "h" : "u");
    this.holding = on;
  }
  /** Big Barks used this run. */
  barksUsed = 0;
  /** Big Barks still usable this run (saved ones, up to the per-run limit). */
  get barksLeft() {
    return Math.max(0, Math.min(this.opts.bigBarks ?? 0, this.cfg.bigBark.perRun) - this.barksUsed);
  }
  /**
   * Big Bark: knocks away every obstacle on screen. Only while running, and only as many
   * times as barksLeft allows. Recorded, so replays and the boards' checks match.
   */
  bigBark() {
    if (this.state !== "running" || this.barksLeft <= 0) return false;
    this.record("b");
    this.barksUsed++;
    let cleared = 0;
    for (const o of this.obstacles)
      if (!o.dead && o.wx - this.dist < this.viewW + 20) {
        this.knock(o);
        cleared++;
        const y = -(o.def.fly ?? 0) - o.def.h / 2;
        this.fx.push({ type: "poof", x: o.wx - this.dist + o.def.w / 2, y });
      }
    this.fx.push({ type: "bark", x: this.cfg.view.dogX + 20, y: this.dog.y - 40 });
    this.emit("bark", { cleared, left: this.barksLeft });
    return true;
  }
  /** Updates so far, in every state (the clock that inputs are recorded against). */
  ticks = 0;
  /**
   * Everything the player did, as [tick, code]: p press, h/u hold on/off, r revive,
   * d decline, b Big Bark. With the seed and options this replays the run exactly
   * (game/replay.ts).
   */
  inputs = [];
  record(code, tick = this.ticks) {
    this.inputs.push([tick, code]);
  }
  /** The bot taps from inside update(); recorded as if tapped just before it. */
  botPress() {
    this.pressed = true;
    this.record("p", this.ticks - 1);
  }
  summary() {
    return {
      score: this.score,
      metres: metres(this.dist, this.cfg),
      biscuits: this.biscuitsEaten,
      smashes: this.smashes,
      world: this.worldIndex,
      worldName: this.world.name,
      seconds: Math.round(this.time * 10) / 10,
      seed: this.seed,
      escapes: this.escapes,
      escaped: [...this.escaped],
      beaten: [...this.beaten],
      fightTip: this.fightTip,
      caughtBy: this.chase?.name ?? null,
      hitBy: this.hitBy,
      continues: this.continues,
      nearMisses: this.nearMisses,
      jumps: this.jumps,
      powerups: this.powerupsUsed,
      golden: this.golden,
      cleared: { ...this.cleared }
    };
  }
  emit(type, data) {
    this.events.push({ type, data });
  }
  update() {
    this.ticks++;
    const dt = this.dt;
    this.prevDist = this.dist;
    this.prevDogY = this.dog.y;
    for (const o of this.obstacles) o.pwx = o.wx;
    for (const b of this.biscuits) {
      b.pwx = b.wx;
      b.py = b.y;
    }
    this.updateKnocked(dt);
    if (this.state === "ended" || this.state === "offer") return;
    if (this.state === "crashed") {
      this.crashTime += dt;
      if (this.crashTime >= this.cfg.crash.endDelay) {
        const C = this.cfg.continue;
        if (this.continues < C.prices.length) {
          this.state = "offer";
          this.emit("continue", {
            price: C.prices[this.continues],
            index: this.continues,
            countdown: C.countdown
          });
        } else this.end();
      }
      return;
    }
    this.step++;
    this.time += dt;
    const target = this.targetSpeed();
    if (this.speed !== target) {
      const prev = this.worlds[Math.max(0, this.worldIndex - 1)].speed;
      const rate = Math.abs(target - prev) / this.cfg.worldTransition.speedLerpSeconds || 1e9;
      const d = target - this.speed;
      this.speed += Math.sign(d) * Math.min(Math.abs(d), rate * dt);
    }
    const dogWX = this.dist + this.cfg.view.dogX;
    const wave = this.waves.find((w) => dogWX >= w.wx0 && dogWX <= w.wx1);
    const twist = this.world.twist;
    const ease = twist?.kind === "waves" || twist?.kind === "belts" ? twist.ease : 0.35;
    const want = wave ? wave.slow : 1;
    this.zoneWant = want;
    const step = dt / ease * Math.abs(1 - (wave?.slow ?? this.lastSlow));
    this.waveMul += Math.sign(want - this.waveMul) * Math.min(Math.abs(want - this.waveMul), step);
    if (wave && !this.inWave && !wave.belt) this.fx.push({ type: "splash" });
    if (wave) this.lastSlow = wave.slow;
    this.inWave = !!wave;
    if (this.waves.length && this.waves[0].wx1 < this.dist - 200) this.waves.shift();
    const v = this.scrollSpeed;
    this.dist += v * dt;
    this.runPhase += dt * v / 24;
    const batch = this.spawner.update({
      step: this.step,
      dist: this.dist,
      time: this.time,
      world: this.world,
      worldsSoFar: this.worlds.slice(0, this.worldIndex + 1),
      speed: this.speed,
      // Patterns must stay clearable at the speed they may meet: the next world's, or a
      // little further up the endless ramp (500 points is far more than a pattern's life).
      nextSpeed: this.worlds[this.worldIndex + 1]?.speed ?? this.targetSpeed(this.score + 500),
      nextWorld: this.worlds[this.worldIndex + 1],
      goldenScale: goldenScale(this.power, this.cfg),
      clear: this.landingClear(),
      tutorial: this.tutorialActive ? this.tutorial.step : null,
      fight: this.fightOn() ? { attack: this.fightAttack } : void 0,
      minion: this.chase && !this.fight && this.world.chase.minion ? { type: this.world.chase.minion, weight: this.world.chase.minionWeight } : void 0
    });
    if (batch) {
      if (batch.pattern === "attack") {
        this.fightAttack = null;
        this.fightAttackIds = batch.obstacles.map((_, i) => this.nextId + i);
      }
      for (const o of batch.obstacles) {
        this.obstacles.push({
          id: this.nextId++,
          type: o.type,
          def: this.cfg.obstacles[o.type],
          wx: o.wx,
          pwx: o.wx,
          ph: this.spawner.rng.next() * Math.PI * 2,
          dead: false,
          soft: this.power.zoomies > 0,
          minGap: Infinity,
          passed: false,
          kx: 0,
          ky: 0,
          kvx: 0,
          kvy: 0,
          rot: 0
        });
      }
      if (batch.wave) this.waves.push(batch.wave);
      if (batch.ledge) this.ledges.push(batch.ledge);
      if (batch.ice) this.ice.push(batch.ice);
      const glide2 = this.glideSpan();
      for (const b0 of batch.biscuits) {
        const b = glide2 && b0.wx > glide2.wx0 && b0.wx < glide2.wx1 ? { ...b0, y: glide2.y } : b0;
        this.biscuits.push({ ...b, pwx: b.wx, py: b.y, ph: b.wx * 0.37 % (Math.PI * 2) });
      }
    }
    const glide = this.glideSpan();
    if (glide) {
      const sp = this.cfg.spawner.biscuits.spacing * 1.5;
      let x = Math.max(this.glideLineTo, glide.wx0 + 60);
      for (; x < glide.wx1 - 20; x += sp)
        this.biscuits.push({
          wx: x,
          y: glide.y,
          gold: false,
          pwx: x,
          py: glide.y,
          ph: x * 0.37 % (Math.PI * 2)
        });
      this.glideLineTo = x;
    } else this.glideLineTo = 0;
    if (this.opts.autoplay) this.autoplay();
    const slip = this.iceUnderDog();
    const prevY = this.dog.y;
    const r = this.power.frisbee > 0 ? this.glide(dt) : stepDog(this.dog, physicsFor(this.cfg, this.world), dt, this.pressed, {
      floor: this.floorUnderDog(),
      holding: !!this.opts.holdToJump && this.holding,
      jumpScale: slip?.jumpScale ?? 1
    });
    if (r.landed && slip) this.fx.push({ type: "skid" });
    this.checkStomp(prevY);
    if (this.ice.length && this.ice[0].wx1 < this.dist - 300) this.ice.shift();
    if (this.ledges.length && this.ledges[0].wx1 < this.dist - 300) this.ledges.shift();
    this.pressed = false;
    if (r.jumped) {
      this.jumps++;
      if (r.jumped === "double" && this.tutorial?.step === "double") this.tutorial.doubled = true;
      this.fx.push({ type: r.jumped === "ground" ? "jump" : "double" });
    }
    if (r.landed && !r.jumped) this.fx.push({ type: "land" });
    const dogX = this.cfg.view.dogX;
    const db = dogBox(dogX, this.dog.y, this.cfg.dog.hitbox);
    for (const o of this.obstacles) {
      if (o.dead) continue;
      if (o.def.extraSpeed) o.wx -= o.def.extraSpeed * dt;
      const ob = obstacleBox(o.wx - this.dist, o.def);
      if (!overlaps(db, ob)) {
        this.checkNearMiss(o, db, ob);
        continue;
      }
      if (this.tutorialActive) {
        this.knock(o);
        this.fx.push({ type: "pop", x: dogX + 8, y: this.dog.y - 36 });
        this.emit("tutorial", { step: this.tutorial.step, oops: true });
        continue;
      }
      const outcome = this.opts.invincible || o.soft ? "smash" : resolveHit(this.power, this.cfg);
      if (outcome === "pass") continue;
      if (outcome === "crash") {
        this.hitBy = o.type;
        this.state = "crashed";
        this.crashTime = 0;
        this.fx.push({ type: "crash" });
        return;
      }
      this.knock(o);
      const fy = -(o.def.fly ?? 0) - o.def.h / 2;
      if (outcome === "smash") {
        if (!this.opts.invincible) this.smashes++;
        this.fx.push({ type: "smash", x: o.wx - this.dist + o.def.w / 2, y: fy });
      } else {
        if (this.fight) this.fight.flawless = false;
        this.fx.push({ type: "pop", x: dogX + 8, y: this.dog.y - 36 });
        if (this.power.shield <= 0) this.emit("power", { kind: "shield", active: false });
      }
    }
    const mx = dogX + this.cfg.dog.mouth.x;
    const my = this.dog.y + this.cfg.dog.mouth.y;
    const mag = this.power.magnet > 0 ? this.cfg.powerups.magnet : null;
    const reach = this.cfg.dog.biscuitReach;
    const kept = [];
    for (const b of this.biscuits) {
      let sx = b.wx - this.dist;
      if (mag) {
        const dx = mx - sx;
        const dy = my - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < mag.radius && d > 1) {
          const k = Math.min(1, mag.pullSpeed * dt / d);
          b.wx += dx * k;
          b.y += dy * k;
          sx = b.wx - this.dist;
        }
      }
      const ex = mx - sx;
      const ey = my - b.y;
      if (ex * ex + ey * ey < reach * reach) {
        this.biscuitsEaten++;
        const pe = eatBiscuit(this.power, b.gold, this.spawner.rng, this.cfg);
        this.fx.push({ type: "eat", x: sx, y: b.y, gold: b.gold });
        this.emit("biscuit", { count: this.biscuitsEaten, meter: this.power.meter, gold: b.gold });
        if (b.gold) this.golden++;
        if (pe) {
          if (pe.active) this.powerupsUsed++;
          if (pe.active && this.tutorial?.step === "biscuits") this.tutorialStep("done");
          this.emit("power", pe);
        }
        continue;
      }
      if (sx > -40) kept.push(b);
    }
    this.biscuits = kept;
    for (const e of tickPowers(this.power, dt, this.cfg)) this.emit("power", e);
    this.score = this.scoreOffset + score(
      {
        dist: this.dist,
        biscuits: this.biscuitsEaten,
        smashes: this.smashes,
        nearMisses: this.nearMisses
      },
      this.cfg
    );
    this.updateChase();
    this.updateFight(dt);
    const wi = worldIndexForScore(this.score, this.worlds);
    if (wi > this.worldIndex) {
      this.worldIndex = wi;
      this.emit("world", { index: wi, id: this.world.id, name: this.world.name });
    }
  }
  /** The surface under the dog: a ledge's top if the dog is over one and above it, else 0. */
  floorUnderDog() {
    const hb = this.cfg.dog.hitbox;
    const x = this.dist + this.cfg.view.dogX;
    for (const l of this.ledges)
      if (x + hb.x1 > l.wx0 + 8 && x + hb.x0 < l.wx1 - 8 && this.dog.y <= -l.h + 0.5) return -l.h;
    return 0;
  }
  /**
   * Frisbee Fetch: rise to the glide height and hold it; taps do nothing. When it ends the
   * dog falls with one jump left (a double jump), covered by the power's grace.
   */
  glide(dt) {
    const fr = this.cfg.powerups.frisbee;
    const d = this.dog;
    d.y += (fr.glideY - d.y) * Math.min(1, dt / fr.riseSeconds * 3);
    d.vy = 0;
    d.grounded = false;
    d.jumps = 1;
    d.coyote = 0;
    d.buffer = 0;
    d.held = 0;
    return { jumped: null, landed: false };
  }
  /** World-x span the dog will glide over (Frisbee Fetch), and the biscuit height there. */
  glideSpan() {
    if (this.power.frisbee <= 0) return null;
    const fr = this.cfg.powerups.frisbee;
    const x = this.dist + this.cfg.view.dogX;
    return {
      wx0: x,
      wx1: x + this.power.frisbee * this.scrollSpeed,
      y: fr.glideY + this.cfg.dog.mouth.y
    };
  }
  /**
   * Where the dog comes down after Frisbee Fetch (world x): no new obstacles there, so the
   * landing is always safe. Padded for Zoomies starting or stopping during the glide.
   */
  landingClear() {
    if (this.power.frisbee <= 0) return void 0;
    const fr = this.cfg.powerups.frisbee;
    const x = this.dist + this.cfg.view.dogX;
    const slow = this.speed * this.waveMul;
    const fast = this.speed * this.cfg.powerups.zoomies.speedMultiplier * Math.max(1, this.waveMul);
    return {
      wx0: x + this.power.frisbee * slow - 150,
      wx1: x + (this.power.frisbee + fr.graceAfter + fr.landingClear) * fast
    };
  }
  /** The ice patch under the middle of the dog's feet, if any (same rule as the spawner). */
  iceUnderDog() {
    const hb = this.cfg.dog.hitbox;
    const x = this.dist + this.cfg.view.dogX + (hb.x0 + hb.x1) / 2;
    return this.ice.find((r) => x >= r.wx0 && x <= r.wx1);
  }
  /** Scrapes past an obstacle without touching it: +10 and a moment of slow motion. */
  checkNearMiss(o, db, ob) {
    if (o.passed) return;
    if (ob.x1 > db.x0 && ob.x0 < db.x1) {
      o.minGap = Math.min(o.minGap, Math.max(ob.y0 - db.y1, db.y0 - ob.y1));
      return;
    }
    if (ob.x1 > db.x0) return;
    o.passed = true;
    this.cleared[o.type] = (this.cleared[o.type] ?? 0) + 1;
    this.tutorialCleared();
    if (o.minGap > this.cfg.nearMiss.gap || o.soft) return;
    if (this.power.zoomies > 0 || this.power.grace > 0) return;
    this.nearMisses++;
    this.fx.push({ type: "nearMiss", x: this.cfg.view.dogX, y: this.dog.y - 60 });
  }
  end() {
    this.state = "ended";
    this.emit("run:end", this.summary());
  }
  /** "Keep running?" accepted: clear what's just ahead, back on your feet, brief grace. */
  revive() {
    if (this.state !== "offer") return;
    this.record("r");
    this.continues++;
    if (this.fight) this.fight.flawless = false;
    const C = this.cfg.continue;
    const dogX = this.cfg.view.dogX;
    for (const o of this.obstacles)
      if (!o.dead && o.wx - this.dist < dogX + C.clearAhead) this.knock(o);
    this.dog = newDog();
    this.taps.clear();
    this.power.grace = Math.max(this.power.grace, C.grace);
    this.spawner.holdUntil(this.dist + this.cfg.view.dogX + C.clearAhead);
    this.state = "running";
    this.fx.push({ type: "revive" });
  }
  /** "Keep running?" declined or timed out. */
  decline() {
    if (this.state !== "offer") return;
    this.record("d");
    this.end();
  }
  /**
   * Starts a boss chase in the last stretch before a target; passing the target escapes it.
   * Bosses with a `fight` fight instead (see updateFight); passing the target ends that too.
   */
  updateChase() {
    const c = this.chase;
    if (c && this.score >= c.target) {
      this.endChase();
      if (this.fight && this.fight.phase !== "beaten") {
        if (this.fight.coach && this.fight.hits === 0) this.fightTip = true;
        this.fightPhase("leave");
        this.fightEmit("leave");
      }
      return;
    }
    if (c) return;
    const target = gateTarget(this.worldIndex, this.worlds, this.score);
    if (target === null || target <= this.lastChased) return;
    const def = this.world.chase;
    const window = def.fight ? this.cfg.fight.window : this.cfg.chase.window;
    if (this.score < target - window || this.score >= target) return;
    this.lastChased = target;
    this.chase = { boss: def.boss, name: def.name, target, since: this.time };
    this.emit("chase", { active: true, boss: def.boss, name: def.name, escaped: false });
    if (def.fight) {
      const coach = !!this.opts.coachFight && !this.coachUsed;
      this.coachUsed ||= coach;
      const behind = -def.fight.w - 40;
      this.fight = {
        boss: def.boss,
        name: def.name,
        def: def.fight,
        phase: "enter",
        t: 0,
        bx: behind,
        bx0: behind,
        hits: 0,
        // A boss that comes back (the UFO) starts one attack further along each time.
        attacks: Math.min(
          this.escaped.filter((b) => b === def.boss).length,
          def.fight.attacks.length - 1
        ),
        flawless: true,
        coach,
        clearFor: 0,
        toldStomp: false
      };
      this.fightEmit("start");
    }
  }
  /** The chase is over (escaped or knocked out): counts as an escape either way. */
  endChase() {
    const c = this.chase;
    if (!c) return;
    this.chase = null;
    if (!this.fight) this.chaseEnded = { boss: c.boss, at: this.time };
    this.escapes++;
    this.escaped.push(c.boss);
    this.emit("chase", { active: false, boss: c.boss, name: c.name, escaped: true });
  }
  /** The fight is running (not knocked out or leaving): only its attacks spawn. */
  fightOn() {
    const p = this.fight?.phase;
    return !!p && p !== "beaten" && p !== "leave";
  }
  fightEmit(step) {
    const f = this.fight;
    this.emit("fight", {
      step,
      boss: f.boss,
      hits: f.hits,
      need: this.cfg.fight.hits,
      coach: f.coach
    });
  }
  fightPhase(p) {
    const f = this.fight;
    f.phase = p;
    f.t = 0;
    f.bx0 = f.bx;
  }
  /** Where the boss stands to attack (its left edge). */
  get fightFront() {
    return this.viewW - this.cfg.fight.frontFromRight;
  }
  /** The tired boss's position `t` seconds into its drift back past the dog. */
  tiredX(t) {
    const f = this.fight;
    const behind = -f.def.w - 40;
    return this.fightFront + (behind - this.fightFront) * Math.min(1, t / this.cfg.fight.tiredSeconds);
  }
  /**
   * The fight, one step: the boss overtakes you, warns, attacks (through the spawner, so
   * every attack is proven clearable), tires and drifts back past you (stomp it!), then
   * returns to the front and goes again, until it's knocked out or you reach the target.
   */
  updateFight(dt) {
    const f = this.fight;
    if (!f) return;
    const F = this.cfg.fight;
    const ease = (k) => {
      const r = 1 - Math.min(1, k);
      return 1 - r * r * r;
    };
    f.t += dt;
    switch (f.phase) {
      case "enter":
        f.bx = f.bx0 + (this.fightFront - f.bx0) * ease(f.t / F.enterSeconds);
        if (f.t >= F.enterSeconds) {
          this.fightPhase("warn");
          this.fightEmit("dodge");
        }
        break;
      case "warn":
        f.bx = this.fightFront;
        if (f.t >= F.warnSeconds) {
          const list = f.def.attacks;
          this.fightAttack = [...list[Math.min(f.attacks, list.length - 1)]];
          this.fightAttackIds = [];
          f.attacks++;
          f.clearFor = 0;
          this.fightPhase("attack");
        }
        break;
      case "attack": {
        f.bx = this.fightFront;
        const hb = this.cfg.dog.hitbox;
        const dogL = this.cfg.view.dogX + hb.x0;
        const passed = !this.fightAttack && this.fightAttackIds.every((id) => {
          const o = this.obstacles.find((x) => x.id === id);
          return !o || o.dead || o.wx - this.dist + o.def.w < dogL - 4;
        });
        f.clearFor = passed ? f.clearFor + dt : 0;
        if (f.clearFor >= F.afterAttack) {
          this.fightPhase("tired");
          if (!f.toldStomp) {
            f.toldStomp = true;
            this.fightEmit("stomp");
          }
        }
        break;
      }
      case "tired":
        f.bx = this.tiredX(f.t);
        if (f.t >= F.tiredSeconds) this.fightPhase("return");
        break;
      case "hurt":
        if (f.t >= F.hurtSeconds) this.fightPhase("return");
        break;
      case "return":
        f.bx = f.bx0 + (this.fightFront - f.bx0) * ease(f.t / F.returnSeconds);
        if (f.t >= F.returnSeconds) this.fightPhase("warn");
        break;
      case "beaten":
      case "leave":
        f.bx += (f.phase === "beaten" ? 260 : 420) * dt;
        if (f.t >= F.leaveSeconds) this.fight = null;
        break;
    }
  }
  /** A falling dog that crosses the tired boss's top while over it stomps it. */
  checkStomp(prevY) {
    const f = this.fight;
    if (!f || f.phase !== "tired") return;
    const d = this.dog;
    if (!this.stompHits(prevY, d.y, d.vy, f.bx, f)) return;
    const F = this.cfg.fight;
    d.y = -f.def.stomp.top;
    d.vy = F.stompBounce;
    d.grounded = false;
    d.jumps = 1;
    d.coyote = 0;
    d.buffer = 0;
    this.taps.clear();
    f.hits++;
    this.fx.push({ type: "stomp", x: this.cfg.view.dogX, y: d.y });
    if (f.hits >= F.hits) {
      this.scoreOffset += F.beatBonus + (f.flawless ? F.flawlessBonus : 0);
      this.beaten.push(f.boss);
      this.fightPhase("beaten");
      this.fightEmit("win");
      this.endChase();
      const land = this.stepsToLand();
      const v = this.scrollSpeed;
      this.spawner.holdUntil(
        this.dist + this.cfg.view.dogX + (land * this.dt + 0.6) * v + 60,
        this.step + land
      );
    } else {
      this.fightPhase("hurt");
      this.fightEmit("hit");
    }
  }
  /**
   * Bot: if the dog would land on (or fly into) an obstacle, the step to double jump on
   * that avoids it until it lands; null when no tap is needed or none helps.
   */
  rescueTap() {
    const p = physicsFor(this.cfg, this.world);
    const hb = this.cfg.dog.hitbox;
    const dogX = this.cfg.view.dogX;
    const v = this.scrollSpeed;
    const dt = this.dt;
    const live = this.obstacles.filter((o) => !o.dead && o.wx - this.dist < dogX + 700);
    if (!live.length) return null;
    const hits = (k) => {
      const d = { ...this.dog };
      for (let i = 0; i < 300; i++) {
        stepDog(d, p, dt, i === k);
        const db = dogBox(dogX, d.y, hb);
        for (const o of live) {
          const x = o.wx - this.dist - (v + (o.def.extraSpeed ?? 0)) * dt * (i + 1);
          if (overlaps(db, obstacleBox(x, o.def))) return true;
        }
        if (d.grounded && (k === null || i > k)) return false;
      }
      return false;
    };
    if (!hits(null)) return null;
    for (let k = 0; k < 90; k++) if (!hits(k)) return k;
    return null;
  }
  /** Steps until the dog lands if nobody taps (physics as in this world). */
  stepsToLand() {
    const d = { ...this.dog };
    const p = physicsFor(this.cfg, this.world);
    let n = 0;
    while (!d.grounded && n < 600) {
      stepDog(d, p, this.dt, false);
      n++;
    }
    return n;
  }
  stompHits(prevY, y, vy, bx, f) {
    const top = -f.def.stomp.top;
    if (vy <= 0 || prevY > top || y < top) return false;
    const hb = this.cfg.dog.hitbox;
    const dogX = this.cfg.view.dogX;
    return dogX + hb.x1 >= bx + f.def.stomp.x0 && dogX + hb.x0 <= bx + f.def.stomp.x1;
  }
  /** Bot: the tap (steps from now) that lands the dog on the tired boss, if any. */
  planStomp() {
    const f = this.fight;
    const p = physicsFor(this.cfg, this.world);
    const dt = this.dt;
    for (let k = 0; k < 150; k++) {
      const d = { ...this.dog };
      for (let i = 0; i < 240; i++) {
        if (f.t + i * dt >= this.cfg.fight.tiredSeconds) break;
        const prev = d.y;
        stepDog(d, p, dt, i === k);
        if (this.stompHits(prev, d.y, d.vy, this.tiredX(f.t + i * dt), f)) return k;
        if (i > k && d.grounded) break;
      }
    }
    return null;
  }
  /**
   * Bot: whenever the dog is on the ground with nothing scheduled, plan taps for the next
   * group of obstacles from the live state, using the same validator as the spawner.
   */
  autoplay() {
    if (this.fight?.phase === "tired" && this.opts.botStomps !== false) {
      if (this.dog.grounded && this.taps.size === 0) {
        const k = this.planStomp();
        if (k !== null) this.taps.add(this.step + k);
      }
      if (this.taps.delete(this.step)) this.botPress();
      return;
    }
    if (!this.dog.grounded && this.dog.jumps < 2 && this.taps.size === 0) {
      const k = this.rescueTap();
      if (k !== null) this.taps.add(this.step + k);
    }
    if (this.dog.grounded && this.scrollSpeed !== this.tapSpeed) this.taps.clear();
    const easing = this.waveMul !== this.zoneWant;
    if (this.taps.size === 0 && this.dog.grounded && !easing) {
      this.tapSpeed = this.scrollSpeed;
      const dogX = this.cfg.view.dogX;
      const hb = this.cfg.dog.hitbox;
      const ahead = this.obstacles.filter((o) => !o.dead && o.wx - this.dist + o.def.w - o.def.inset > dogX + hb.x0).sort((a, b) => a.wx - b.wx);
      const v = this.scrollSpeed;
      const arrive = (x, o) => (x - dogX) / (v + (o.def.extraSpeed ?? 0));
      ahead.sort((a, b) => arrive(a.wx - this.dist, a) - arrive(b.wx - this.dist, b));
      const horizon = 0.75 * this.cfg.physics.gravity / physicsFor(this.cfg, this.world).gravity;
      const group = [];
      const cuts = [];
      let end = -Infinity;
      for (const o of ahead) {
        const x = o.wx - this.dist;
        const t = arrive(x, o);
        if (group.length && t - end > horizon) break;
        if (group.length && t - end > 160 / v) cuts.push(group.length);
        group.push({ type: o.type, x });
        end = Math.max(end, arrive(x + o.def.w, o));
      }
      cuts.push(group.length);
      const ice = iceOpts(this.ice, this.dist);
      const physics = physicsFor(this.cfg, this.world);
      if (group.length && group[0].x - dogX < 520) {
        let plan = null;
        for (let i = cuts.length - 1; i >= 0 && !plan; i--)
          plan = findClearPlan(group.slice(0, cuts[i]), this.cfg, {
            speed: v,
            ready: 0,
            physics,
            ...ice
          });
        for (let n = group.length - 1; n > 0 && !plan; n--) {
          const p = findClearPlan(group.slice(0, n), this.cfg, {
            speed: v,
            ready: 0,
            physics,
            ...ice
          });
          if (p) {
            if ((p.jump ?? 0) <= 1) plan = p;
            break;
          }
        }
        const base = this.step;
        if (plan?.jump != null) this.taps.add(base + plan.jump);
        if (plan?.double != null) this.taps.add(base + plan.double);
      }
    }
    if (this.taps.delete(this.step)) this.botPress();
    for (const t of this.taps) if (t < this.step) this.taps.delete(t);
  }
  knock(o) {
    o.dead = true;
    o.kvx = 220 + this.spawner.rng.next() * 160;
    o.kvy = -(500 + this.spawner.rng.next() * 200);
  }
  updateKnocked(dt) {
    for (const o of this.obstacles) {
      if (!o.dead) continue;
      o.kx += o.kvx * dt;
      o.kvy += 1400 * dt;
      o.ky += o.kvy * dt;
      o.rot += dt * 10;
    }
    this.obstacles = this.obstacles.filter((o) => o.wx - this.dist + o.kx > -140 && o.ky < 600);
  }
};

// game/replay.ts
var Replayer = class {
  run;
  k = 0;
  inputs;
  constructor(cfg, r) {
    this.run = new Run(cfg, r.seed, r.viewW, { ...r.opts });
    this.inputs = [...r.inputs].sort((a, b) => a[0] - b[0]);
  }
  get done() {
    return this.run.state === "ended";
  }
  /** One update. `keep`: leave this step's fx and events on the run (for drawing). */
  step(keep = false) {
    const run = this.run;
    if (keep) {
      run.events.length = 0;
      run.fx.length = 0;
    }
    while (this.k < this.inputs.length && this.inputs[this.k][0] <= run.ticks) {
      const code = this.inputs[this.k][1];
      if (code === "p") run.press();
      else if (code === "h") run.setHolding(true);
      else if (code === "u") run.setHolding(false);
      else if (code === "r") run.revive();
      else if (code === "d") run.decline();
      else if (code === "b") run.bigBark();
      this.k++;
    }
    run.update();
    if (!keep) {
      run.events.length = 0;
      run.fx.length = 0;
    }
  }
};
function replay(cfg, r, maxTicks = r.ticks + 600) {
  const p = new Replayer(cfg, r);
  while (!p.done && p.run.ticks < maxTicks) p.step();
  return p.run;
}

// content/names.json
var names_default = {
  maxLength: 16,
  reportsToHide: 3,
  blocked: [
    "fuck",
    "fuk",
    "shit",
    "cunt",
    "twat",
    "wank",
    "bollock",
    "bastard",
    "bitch",
    "piss",
    "cock",
    "dick",
    "prick",
    "knob",
    "pussy",
    "slut",
    "whore",
    "tits",
    "boob",
    "arse",
    "asshole",
    "dildo",
    "porn",
    "sex",
    "nazi",
    "hitler",
    "rape",
    "kill",
    "suicide",
    "admin",
    "moderator",
    "official",
    "dobiedash"
  ],
  allowed: [
    "cocker",
    "essex",
    "sussex",
    "middlesex",
    "dickens",
    "scunthorpe",
    "shitzu",
    "shihtzu",
    "peacock",
    "hancock",
    "skillet",
    "skills"
  ]
};

// logic/names.ts
var LEET = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "@": "a",
  $: "s",
  "!": "i"
};
function squash(name) {
  return [...name.toLowerCase()].map((ch) => LEET[ch] ?? ch).filter((ch) => /[a-z]/.test(ch)).join("");
}
function nameProblem(raw) {
  const name = raw.trim();
  if (!name) return "empty";
  if ([...name].length > names_default.maxLength) return "long";
  let s = squash(name);
  for (const ok of names_default.allowed) s = s.split(ok).join("");
  const single = s.replace(/(.)\1+/g, "$1");
  if (names_default.blocked.some((w) => s.includes(w) || single.includes(w))) return "word";
  if (!/^[\p{L}\p{N} .'-]+$/u.test(name)) return "chars";
  return null;
}
var NAME_PROBLEM_TEXT = {
  empty: "Give your dog a name.",
  long: `Names can be up to ${names_default.maxLength} characters.`,
  chars: "Letters, numbers and spaces only.",
  word: "That name isn't allowed. Try another."
};

// game/server.ts
function configFingerprint(cfg = loadGameConfig()) {
  const json = JSON.stringify(cfg);
  let h = 2166136261;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(36);
}
export {
  configFingerprint,
  loadGameConfig,
  nameProblem,
  replay
};
