export type Definition = {
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
   * Sourced either from the lab that built the system or from the researcher
   * who authored the work, speaking. Every id is checked against YouTube's
   * oEmbed endpoint for channel and title before it ships; commentary
   * reuploads are rejected.
   */
  video: {
    id: string;
    title: string;
    source: string;
    /**
     * A demo's thumbnail IS the content, so use it. A lecture's thumbnail is
     * whatever slide the frame grab landed on, which is arbitrary at best and
     * actively misleading at worst, so talks get a designed card instead.
     */
    kind: "demo" | "talk";
  };
};

/**
 * The five things people mean by "world model".
 *
 * Called definitions rather than senses throughout. "Definition" is the correct
 * linguistic term for a distinct meaning of a word, but this chapter is about
 * observation and perception, so "the five senses" reads as a pun nobody
 * wrote. Not "components" either: these do not assemble into one system, and
 * the encoder/dynamics/controller trio in Chapter 2 already owns that word., ordered by how abstract the
 * predicted object is: pixels, then geometry, then compact state, then
 * embeddings. The fifth is not a system you run at all, which is why it sits
 * off the axis.
 */
export const DEFINITIONS: Definition[] = [
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
      kind: "demo",
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
      kind: "demo",
    },
  },
  {
    id: "controller",
    name: "The Controller",
    predicts: "Compact state",
    gloss:
      "A compact model of next state and reward under actions, used to plan or to train a policy inside its own imagination. The classical model-based definition.",
    test:
      "Can you roll it forward under actions nobody has taken yet, and search over them? That is the job this one exists to do.",
    systems: ["Dreamer", "PlaNet", "Ha & Schmidhuber"],
    camp: "Reinforcement learning and control theory",
    chapter: 2,
    video: {
      id: "oDlBtTcX0g0",
      title: "Dreamer 4: diamonds from offline experience",
      source: "Danijar Hafner",
      kind: "demo",
    },
  },
  {
    id: "representation",
    name: "The Representation",
    predicts: "Embeddings",
    gloss:
      "Prediction of embeddings rather than observations, where the forecast is often training scaffolding and the learned features are the product.",
    test:
      "Is the prediction discarded once training ends? If the artefact you keep is a representation, this is the definition being used.",
    systems: ["V-JEPA 2", "I-JEPA"],
    camp: "Self-supervised representation learning",
    chapter: 7,
    video: {
      id: "yUmDRxV0krg",
      title: "Self-Supervised Learning, JEPA, World Models, and the future of AI",
      source: "Yann LeCun · Harvard CMSA",
      kind: "talk",
    },
  },
  {
    id: "implicit",
    name: "The Implicit Model",
    predicts: "Nothing. It is found, not run",
    gloss:
      "A claim about structure found inside a network trained for something else. There is no world-model interface to call; the assertion is about what a probe can recover from activations.",
    test:
      "Is the claim about what a system does, or about what is inside it? Only this definition is about the inside.",
    systems: ["Othello-GPT", "“does GPT have a world model?”"],
    camp: "Mechanistic interpretability",
    chapter: 9,
    video: {
      id: "n6Dcl6Uf73s",
      title: "A Whirlwind Tour of Mechanistic Interpretability",
      source: "Neel Nanda · metauni",
      kind: "talk",
    },
  },
];

export const getDefinition = (id: string) => DEFINITIONS.find((s) => s.id === id);
