# Pitch detection — research for post-submission iteration

## TL;DR

Our overhead-aerial vision call is the wrong tool for pitch. A single nadir-down image has almost no parallax to work with, and shadow-based geometry on Google Static Maps is impractical because Google bakes the imagery from passes with varying sun angles and doesn't expose acquisition metadata. The Solar API already returns per-segment `pitchDegrees` and was trained against high-resolution aerial DSMs with a published ~5° error envelope (Satellite Sunroof, NeurIPS 2024) — that's at or below the granularity of a 1:12 enum bucket. The fastest, biggest accuracy win post-submission is **stop asking the LLM for pitch and read it from `roofSegmentStats[].pitchDegrees` instead**, area-weighted across the segments inside our subject polygon, then bucket to the nearest x:12 enum. Vision becomes a tie-breaker / fallback for properties where Solar returns no segments.

**Ranked recommendation:**
1. Solar API `pitchDegrees` (area-weighted, bucketed) as primary. ~1 hour of work, deterministic, free under our existing key.
2. Vision LLM as fallback only when Solar coverage is missing or `imageryQuality` is `LOW`.
3. Street View Static API as a third rail for the small set of properties that fail both — extract a side-elevation photo and run a separate vision prompt aimed at the gable triangle.
4. USGS 3DEP LiDAR as the "ground truth" calibration set — too heavy for live inference, but invaluable for measuring whether option 1 actually works on our 5 example properties before we trust it on the 5 test properties.

---

## 1. Google Solar API `roofSegmentStats`

The Solar API's `buildingInsights.findClosest` response returns a `solarPotential.roofSegmentStats[]` array. Each element includes:

- `pitchDegrees` — angle of the roof plane relative to the ground. 0 = flat, 90 = vertical wall. **Decimal degrees, not a ratio.**
- `azimuthDegrees` — compass bearing the segment faces.
- `stats.areaMeters2` — slope-corrected surface area of that segment.
- `stats.groundAreaMeters2` — footprint (ground projection) of that segment. The ratio `areaMeters2 / groundAreaMeters2 ≈ 1/cos(pitchDegrees)` gives a sanity check on the pitch field.
- `planeHeightAtCenterMeters`, `center`, `boundingBox` — fully define the plane.

Conversion to x:12 enum: `pitch_x_in_12 = round(12 * tan(pitchDegrees * π/180))`. Reference points: 4:12 = 18.43°, 5:12 = 22.62°, 6:12 = 26.57°, 7:12 = 30.26°, 8:12 = 33.69°, 9:12 = 36.87°, 10:12 = 39.81°, 12:12 = 45.00°.

Houses with multiple segments (cross-gable, hip-and-gable mixes) need an aggregation rule. Recommended: **area-weighted mean of `pitchDegrees` across segments whose center lies inside the subject polygon we already use for the Solar fence**, then bucket. For dominant-pitch homes that's identical to picking the mode; for genuinely mixed pitches it produces a reasonable scalar, and we can also surface the per-segment list in the report.

**Accuracy claim.** Google's own NeurIPS 2024 paper "Satellite Sunroof" describes the underlying model as producing **~5° roof pitch error** (with ~1m DSM MAE) when trained against aerial DSM ground truth. 5° is roughly the width of one 1:12 bucket near 4–6:12 pitches, so we should expect ±1 enum step in the worst case but rarely worse. That matches our observed error pattern (off by 2:12 on Copper Lilly and Nixa, off by 1:12 on Cape Coral and Orland) — except we're currently leaving that signal on the table because we never read it.

**Catch:** Solar API's `imageryQuality` enum (`HIGH` / `MEDIUM` / `LOW`) is the proxy for whether `pitchDegrees` is trustworthy. The same Satellite Sunroof paper distinguishes "RGB+DSM" (stereo input available, US/EU/AU urban) from "RGB-only" (single-view, expanded coverage) — and the 5° figure is from the RGB+DSM regime. Our existing pipeline already checks `imageryQuality`; we should reuse that gate for pitch the same way we do for area.

Sources: [buildingInsights.findClosest reference](https://developers.google.com/maps/documentation/solar/reference/rest/v1/buildingInsights/findClosest), [Solar API concepts](https://developers.google.com/maps/documentation/solar/concepts), [Satellite Sunroof (arXiv 2408.14400)](https://arxiv.org/abs/2408.14400), [Satellite Sunroof on research.google](https://research.google/pubs/satellite-sunroof-high-res-digital-surface-models-and-roof-segmentation-for-global-solar-mapping/).

## 2. Why overhead vision is weak for pitch

Pitch is a *vertical* dimension. A nadir-down (true overhead) photograph has zero parallax — every roof of the same footprint looks identical regardless of pitch. Three indirect cues remain:

- **Shadow length.** Solar altitude θ → object height h via `h = shadow_length × tan(θ)`. From rake-edge height + eave-to-ridge run you can recover pitch. The geometry is well documented (Apollo Mapping, USGS shadow-length references). The blocker for us is that **Google Static Maps doesn't return imagery acquisition timestamp or sun position**, and the mosaic is composited from passes with different illumination — so we can't trust an LLM to estimate shadow length and combine it with a known sun altitude. This works on raw single-acquisition imagery (Maxar, Planet, county orthos) where the metadata is in the sidecar, not on Google's tiles.
- **Texture / shingle-row spacing.** Steeper roofs compress shingle courses in the overhead view. Real but subtle, and confounded by zoom level and shingle type.
- **Roof archetype priors.** Florida ranch = usually 4:12–6:12. Steep New England colonial = 8:12+. The LLM is almost certainly using this — which explains why our 6:12 guesses cluster around the national mean and miss the actual extremes (Copper Lilly 8:12, Nixa 8:12).

Bottom line: overhead-only pitch is fundamentally weak, and our 1/5 hit rate is consistent with what the literature would predict.

Sources: [Apollo Mapping — Shadows and Angles](https://apollomapping.com/blog/shadows-angles-measuring-object-heights-satellite-imagery), [Geography Realm — measuring object heights from satellite imagery](https://www.geographyrealm.com/shadows-angles-measuring-object-heights-satellite-imagery/), [USGS / WestCOG shadow length equations (PDF)](https://westcog.org/wp-content/uploads/2019/07/Summary-of-Significant-Equation-for-Determining-Shadow-Lengthrev.pdf).

## 3. Oblique / multi-angle imagery sources

- **Google Street View Static API.** Programmatic, reliable in suburbia, ~$7/1000 requests. Gives a ground-level oblique that often shows a gable end clearly — perfect for measuring rise/run on the triangular face. Worth a separate vision prompt designed for that view. [Street View Static API overview](https://developers.google.com/maps/documentation/streetview/overview).
- **Bing Maps Bird's Eye.** Was the best free oblique source; Microsoft removed the consumer toggle in 2023 and discontinued the Bing Maps REST Services in 2024. Effectively unavailable for new pipelines. [Discontinued Services discussion (OSM forum)](https://community.openstreetmap.org/t/discontinued-services-bing-maps-rest-services/117308), [Maps Blog — Bird's Eye in static API (2019, now superseded)](https://blogs.bing.com/maps/2019-11/more-birds-eye-imagery-has-been-released-and-static-maps-api-support-added/).
- **Apple Look Around.** No public API. Out.
- **County GIS / pictometry orthos.** Many counties (Harris TX, Cook IL) publish high-resolution orthos; a few publish oblique pictometry. No standard programmatic interface — would need per-county scrapers. Useful for calibration on the test set, not at runtime.
- **Nearmap, EagleView, Hover, Vexcel.** Commercial; bounty rule #1 forbids them.

The pragmatic choice for runtime is **Google Street View Static** as a fallback whenever Solar `imageryQuality < HIGH`.

## 4. LiDAR / DEM data

USGS 3DEP has baseline LiDAR for ~99% of the US as of FY2025, in LAZ format on AWS Open Data. To compute roof pitch from a point cloud:

1. Bound the query by the building polygon (we already have one from Solar).
2. Filter to roof points (classification 6 in standard LAS schemes, or DSM − DTM > 2.5m).
3. Run RANSAC plane segmentation (pyRANSAC-3D, PDAL filters) — each plane gives a normal vector, and `pitch = arccos(normal·ẑ)`.
4. Aggregate planes by area weight, identical to the Solar approach.

Realistic complexity: **a day of work for a working prototype, a week for a robust one**, plus latency (LAZ tiles are big, tens of MB per square km). 3DEP's data is not point-query friendly — it's tiled. For our use case it's overkill at runtime but **excellent as ground truth** for validating the Solar API approach: we can compute "true" pitch on our 5 example + 5 test properties offline, then trust Solar going forward if it agrees within ±5°.

Sources: [USGS 3DEP overview](https://www.usgs.gov/3d-elevation-program/about-3dep-products-services), [USGS 3DEP on AWS Open Data](https://registry.opendata.aws/usgs-lidar/), [pyRANSAC-3D (GitHub)](https://github.com/leomariga/pyRANSAC-3D), [PDAL tutorial — basic LiDAR handling](https://paulojraposo.github.io/pages/PDAL_tutorial.html).

## 5. Hybrid architecture

```
For each address:
  solar = buildingInsights(lat, lng)
  if solar.imageryQuality in {HIGH, MEDIUM} and solar.roofSegmentStats:
      pitch_deg = area_weighted_mean(seg.pitchDegrees for seg in subject_segments)
      pitch_enum = round(12 * tan(pitch_deg))
      source = "solar"
  else:
      streetview = fetchStreetView(address, fov=60)  # gable-finder prompt
      pitch_enum = vision.estimatePitchFromOblique(streetview) or vision.estimatePitchFromOverhead(aerial)
      source = "vision"
```

Disagreement policy (when we want to run both for confidence):
- If Solar and vision agree within 1 enum step → use Solar, log agreement.
- If they disagree by 2+ steps → use Solar, **flag the property** in the PDF as "pitch confidence: medium," and surface both numbers. This mirrors our Solar fence policy on area (PLOG-006).
- If `imageryQuality = LOW` and vision disagrees by 2+ → use vision, flag as "pitch confidence: low."

This is small, principled, and matches what we already do for area.

## 6. Known accuracy benchmarks

- **Google's own published number:** ~5° pitch MAE under RGB+DSM, NeurIPS 2024 paper. ([arXiv 2408.14400](https://arxiv.org/abs/2408.14400))
- **Roof type classification** (gable vs hip vs flat — easier than pitch enum) hits ~80% on CNN methods on 10cm orthos. ([ResearchGate — Deep learning roof type classification](https://www.researchgate.net/publication/352829968_DEEP_LEARNING_BASED_ROOF_TYPE_CLASSIFICATION_USING_VERY_HIGH_RESOLUTION_AERIAL_IMAGERY))
- **DeepRoof** (UMass, used by some solar designers) reports 91% true positive rate on solar suitability — but that's a binary, not a pitch number. ([pv-magazine summary](https://pv-magazine-usa.com/2019/08/12/using-machine-learning-and-cheap-satellite-data-to-design-rooftop-solar-power/))
- We have not found a published number for **LLM vision pitch enum accuracy from a single overhead aerial**. Our 1/5 ≈ 20% is consistent with chance-corrected guessing among the 4–8:12 range that covers most US residential.

Realistic ceiling: a hybrid Solar + Street View + vision system should comfortably hit **4/5 within ±1 enum step** on the calibration set, and **3/5 exact match**, before we touch LiDAR. Exact match on enum is genuinely hard — published pitches are themselves often rounded, and many real roofs sit between buckets (a 22° roof is "really" 5:12 by our rounding rule but listings might say 4:12 or 5:12).

---

## What to do Sunday morning

1. Read `solarPotential.roofSegmentStats` from our existing cached Solar responses for the 5 example properties. (Already on disk in `intermediate/<slug>/solar.json`.)
2. Compute area-weighted `pitchDegrees`, bucket to enum, compare to references. Expected outcome based on Google's own ~5° MAE: 4–5 of 5 within ±1 step, 3+ exact.
3. If that holds, swap the vision pitch call for the Solar-derived value, keep vision as fallback, and ship.
4. Optional follow-up: USGS 3DEP-based ground truth notebook for the 10 calibration properties (5 example + 5 test) so future regressions are catchable.
