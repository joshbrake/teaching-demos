# AI Fundamentals: From Models to Agents

An interactive 7-step tutorial that walks through core AI concepts — from what a model is, through how language models work, to agentic AI with tool use.

## The Concepts

**Act I: How Language Models Work**
1. **What Is a Model?** — Curve fitting demo showing linear, polynomial, and overfit models
2. **Tokens & Text** — Real-time tokenizer showing how text becomes subword pieces
3. **Next-Token Prediction** — Click to build sentences one probability at a time
4. **Temperature & Sampling** — See how temperature reshapes the probability distribution

**Act II: From Models to Agents**
5. **Attention** — Click tokens to see attention arcs and weights
6. **From Chat to Agents** — Step through the observe-think-act loop
7. **Tool Use** — Watch an agent choose and call tools to solve tasks

## Things to Try

1. In Step 1, add points in a straight line, then switch to "Overfit" with degree 12 — watch the curve go wild between points
2. In Step 2, type "Antidisestablishmentarianism" and count the tokens vs. "the cat sat"
3. In Step 3, always pick the *lowest* probability token and see what strange sentence you build
4. In Step 4, set temperature to 0.05 and sample 100 — compare to temperature 2.0
5. In Step 5, click "it" in "The cat sat on the mat because it was tired" — notice it attends strongly to "cat"
6. In Step 6, use Auto-play on the Research scenario and follow the agent's reasoning chain
7. In Step 7, go through all 4 tasks and notice how the agent picks different tools for each
8. Navigate with arrow keys for a presentation-style walkthrough
9. Resize the browser to see the responsive layout

## Extend with Claude Code

- Add a Step 8 covering RAG (retrieval-augmented generation)
- Make the tokenizer use real BPE vocabulary for more accurate results
- Add animated transitions between steps
- Create a quiz mode that tests understanding after each concept
- Add an embeddings visualization showing word similarity in 2D space
