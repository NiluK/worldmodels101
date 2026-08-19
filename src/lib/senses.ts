export type Sense = {
  id: string;
  name: string;
  /** What the thing actually predicts. Orders the map, left to right. */
  predicts: string;
  /** One-line definition. */
  gloss: string;
  /** The question that tells you whether someone means this one. */
  test: string;
  systems: string[];
  /** Who uses the word this way. */
  camp: string;
  chapter: number;
  /**
   * First-party footage only — official lab channels, verified via oEmbed.
   * Null where the sense genuinely has nothing to show, which is itself the
   * most useful thing about it.
   */
  video:
    | { id: string; title: string; source: string }
    | { none: string };
};

/**
 * The five things people mean by "world model", ordered by how abstract the
 * predicted object is: pixels, then geometry, then compact state, then
 * embeddings. The fifth is not a system you run at all, which is why it sits
 * off the axis.
 */
export const SENSES: Sense[] = [
  {
    id: "renderer",
    name: "The Renderer",
    predicts: "Pixels",
    gloss:
      "An action-conditioned generator of observations. You press a key, it produces the next frames. Persistence, where it exists, is learned through generation rather than guaranteed by explicit geometric state.",
    test:
      "Ask what holds the room together. If the answer is that the model learned to keep producing it, rather than that there is geometry, you are looking at a renderer.",
    systems: ["Genie 3", "Sora", "GameNGen"],
    camp: "Generative video labs",
    chapter: 8,
    video: {
      id: "PDKhUknuQDg",
      title: "Genie 3: Creating dynamic worlds that you can navigate in real-time",
      source: "Google DeepMind",
    },
  },
  {
    id: "simulator",
    name: "The Simulator",
    predicts: "Geometry & physics",
    gloss:
      "A queryable world structure (geometry, physical state, dynamics) where persistence is part of the contract rather than an emergent property.",
    test:
      "Could something compute against it? Collision meshes, physics, a scene you can export. Structure you can interrogate, not merely look at.",
    systems: ["Marble", "NVIDIA Cosmos *"],
    camp: "Spatial-intelligence and robotics labs. (*) Cosmos straddles this and the Renderer: NVIDIA describes Cosmos Predict as generative video, with Omniverse supplying explicit simulation.",
    chapter: 8,
    video: {
      id: "UslQB4LUueI",
      title: "Introducing Marble by World Labs",
      source: "World Labs",
    },
  },
  {
    id: "controller",
    name: "The Controller",
    predicts: "Compact state",
    gloss:
      "A compact model of next state and reward under actions, used to plan or to train a policy inside its own imagination. The classical model-based sense.",
    test:
      "Can you roll it forward under actions nobody has taken yet, and search over them? That is the job this one exists to do.",
    systems: ["Dreamer", "PlaNet", "Ha & Schmidhuber"],
    camp: "Reinforcement learning and control theory",
    chapter: 2,
    video: {
      none: "The Controller's output is a compact state vector, not a picture. What there is to see is the plan it produces, which is what the demo in Chapter 2 shows directly.",
    },
  },
  {
    id: "representation",
    name: "The Representation",
    predicts: "Embeddings",
    gloss:
      "Prediction of embeddings rather than observations, where the forecast is often training scaffolding and the learned features are the product.",
    test:
      "Is the prediction discarded once training ends? If the artefact you keep is a representation, this is the sense being used.",
    systems: ["V-JEPA 2", "I-JEPA"],
    camp: "Self-supervised representation learning",
    chapter: 7,
    video: {
      none: "V-JEPA 2 predicts representations and then throws the prediction away. There is no frame to render, and the absence is the whole argument: pixel-level detail was the thing it deliberately refused to spend capacity on.",
    },
  },
  {
    id: "implicit",
    name: "The Implicit Model",
    predicts: "Nothing. It is found, not run",
    gloss:
      "A claim about structure found inside a network trained for something else. There is no world-model interface to call; the assertion is about what a probe can recover from activations.",
    test:
      "Is the claim about what a system does, or about what is inside it? Only this sense is about the inside.",
    systems: ["Othello-GPT", "“does GPT have a world model?”"],
    camp: "Mechanistic interpretability",
    chapter: 9,
    video: {
      none: "There is no system running here to film. The evidence is a probe reading a board position out of a network's activations: a plot, not a demo.",
    },
  },
];

export const getSense = (id: string) => SENSES.find((s) => s.id === id);
