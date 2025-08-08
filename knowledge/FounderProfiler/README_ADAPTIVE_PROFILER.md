
# Adaptive Entrepreneur Profiler — Implementation Notes

**Goal**: Identify the most likely sub-profile among 20 archetypes using an adaptive, psychologist-like interview with ~10–18 questions.

## Components
1. **profiles_config.json**
   - `dimensions`: 7 latent traits with range [-2, 2].
   - `profiles`: 20 sub-profiles with centroid values on each dimension.
2. **questions_bank.json**
   - 24 items. Each item targets exactly one dimension.
   - Options map to numeric values (-2..2). Each item has a `weight` (default 1.0).

## State Representation
Maintain a Gaussian belief over each dimension:
```python
belief = {
  dim_key: {"mu": 0.0, "sigma2": 1.0}  # prior mean 0, variance 1.0
  for dim_key in dimensions
}
```
(Use sigma2=1.5 if you want to be more uncertain initially.)

## Update Rule (Per Answer)
For a question targeting dimension `d` with response value `x` in [-2..2]:
- Treat the observation as `x` with noise variance `tau2 = (1.0 / item_weight)`.
- Update belief via 1D Gaussian conjugate update:
```python
posterior_sigma2 = 1 / (1/belief[d]["sigma2"] + 1/tau2)
posterior_mu = posterior_sigma2 * (belief[d]["mu"]/belief[d]["sigma2"] + x/tau2)
belief[d] = {"mu": posterior_mu, "sigma2": posterior_sigma2}
```

## From Dimensions → Profile Posterior
Compute a likelihood score for each profile `p` whose centroid vector is `c_p`:
Assume independent dims with variance `lambda2` (how sharply you want to snap to centroids; try 0.8). Use current belief means `mu_d`.

```python
def profile_loglik(p, belief, lambda2=0.8):
    ll = 0.0
    for d in dimensions:
        mu = belief[d]["mu"]
        c = p["centroid"][d]
        ll += -0.5 * ((mu - c)**2) / lambda2
    return ll
```

Turn into a normalized posterior with a softmax:
```python
post = softmax([profile_loglik(p) for p in profiles])
```

## Adaptive Question Selection (Entropy / Information Gain)
At each step:
1. Compute current profile posterior `post`.
2. For each **unused** question `q`:
   - For each option value `v ∈ {-2,-1,0,1,2}`:
     - Predict the updated belief for `q.dimension` as if the user chose `v`.
     - Compute the **hypothetical** profile posterior `post_v`.
   - Estimate expected entropy after asking `q`:
     - Assume a simple symmetric prior over options or derive a likelihood by distance between current `mu` and `v` (closer `v` more probable).
   - Pick the question with **minimum expected entropy**.
3. Ask that question.

**Pragmatic shortcut**: Instead of full entropy, pick the question targeting the dimension with the **largest posterior variance** (sigma2), breaking ties by which dimension most differentiates the **top-2** profiles.

## Stop Rule
- Stop if `max_posterior ≥ 0.90` (strict: 0.95) **or** after **18 questions**.
- Optionally require `margin ≥ 0.15` between top-1 and top-2 profiles.

## Output
Return:
```json
{
  "top_profile": "...",
  "confidence": 0.0,
  "alternatives": [{"profile":"...", "prob":0.0}],
  "dimension_estimates": {"vision_execution": 0.7, "...": -0.2},
  "asked_questions": ["Q3","Q11","Q8", "..."]
}
```
`confidence` is the posterior probability of `top_profile`.

## Calibration Tips
- If results feel too “jumpy”, increase `lambda2` (e.g., 1.2).
- If results converge too slowly, lower `tau2` for scenario questions (e.g., weight=1.2 → tau2≈0.83).
- Seed priors if you know the user context (e.g., operator-heavy roles).

## Ethical UX
- Explain purpose, estimated length (10–14 items), and allow skip.
- Use neutral wording; avoid leading answers.
- Show a brief summary with strengths and likely complementary partners at the end.
