# Pulse dashboard redesign

Updated to match the supplied dashboard sketch.

## Changed
- Top settings/account controls with centered date + history selector.
- Three prominent clickable score rings: Strain, Sleep Score, Recovery.
- Sleep Score is the largest center ring.
- Daily Brief recommendation card driven by the selected day's scores.
- Four metric tiles: Steps, Heart Rate, HRV, Resting Heart Rate.
- Score-detail modals with explanations and contributing data.
- 14-day history picker.
- Settings modal with adjustable sleep goal and wearable connection control.
- Responsive mobile layout.

## Existing data behavior preserved
- HRV, resting heart rate, sleep, workouts, recovery baseline logic, and wearable sync use the existing project data layer.
- Steps and general heart-rate readings are demo-only for now because the existing connected-data schema does not expose those two metrics. Connected mode shows them as unavailable instead of fabricating readings.

## Validation note
The source was updated successfully. A full production build could not be run in the editing environment because project dependencies were not installed and dependency installation timed out. No dependency or package manifest changes were required for this redesign.
