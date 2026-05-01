## Problem

Three concrete sources of "fake data" right now:

1. **Doctor Reports page** (`DoctorReports.tsx`) imports `mockPatients` and `generateCohortTrend` from `mockDoctorData.ts`. Every chart, KPI, and table on that page is hardcoded mock data — none of it reflects the doctor's actual patients.

2. **Doctor sees no real patients anywhere** — `PatientList`, `DoctorOverview`, and `TrainingPrescriptions` already query real Supabase data via `fetchPatients(doctorProfileId)`, but that function only returns rows from `patient_doctor_assignments`. **There is no UI for a doctor to add/enroll a patient**, so the table is always empty, which makes the dashboard look broken or "fake".

3. **AI Insights Dashboard ("AI Lab")** reads from bandit singletons that persist to a single global `localStorage` key (`epsilonGreedyBandit`, `attentionBandit`, …). This means:
   - Data is shared across every account on the same browser (User A's progress shows up for User B).
   - On a fresh login the values are inherited from whoever last used the device → looks like fake/random data.
   - Bandit state is not tied to the authenticated `user.id`.

## Fix

### 1. Doctor Reports — use real cohort data
- Remove the `mockPatients` / `generateCohortTrend` imports.
- Fetch real patients via `fetchPatients(doctorProfileId)` (already used by other pages).
- Compute cohort KPIs (avg score, improving/declining counts, condition distribution, domain averages, patient bar chart) from the real array.
- For the cohort trend line chart, build it from the real `game_sessions` of all assigned patients (group by week, average score). Add a new helper `fetchCohortTrend(doctorProfileId)` in `doctorDataService.ts`.
- Empty state: when the doctor has 0 patients, show a friendly "No patients enrolled yet — add one from the Patients tab" card instead of broken charts.

### 2. Add Patient enrollment flow (the missing piece)
The reason the doctor's dashboard looks empty is that nothing creates rows in `patient_doctor_assignments`. We need a real way to do this.

- Add an **"Add Patient" button** to the top of `PatientList.tsx` that opens a dialog.
- The dialog accepts: patient email, condition (mild / moderate / severe), risk level (low / medium / high), notes.
- On submit, a new helper `assignPatientByEmail(doctorProfileId, email, ...)` in `doctorDataService.ts`:
  1. Looks up the patient in `profiles` by email.
  2. If found, inserts a row into `patient_doctor_assignments` (status=`active`) and returns success.
  3. If not found, returns a clear error: "No patient account found with that email. Ask them to sign up first."
- After success, refresh the patient list. The patient now appears across Overview, Patients, Reports, and Training Plans.
- Also surface "Remove from caseload" on the patient card / profile (sets `status='inactive'`), so doctors can unenroll.

Note: this is the simplest reliable flow given the existing schema and RLS. We are not adding cross-table email lookups in RLS; the doctor only ever inserts into `patient_doctor_assignments` (already allowed by their existing INSERT policy).

### 3. AI Lab — make bandit data per-user (and remove the cross-user bleed)
This is the root cause of the "fake-looking" AI numbers.

- Change every bandit's `STORAGE_KEY` from a static string to a function that namespaces by the current Supabase user id, e.g. `bandit:${userId}:epsilonGreedy`. A small shared helper `getUserScopedKey(name)` in `src/lib/bandit/storage.ts` will read `supabase.auth.getUser()` once at app startup and cache the id.
- On login: rehydrate every bandit from its user-scoped key. On logout: reset all bandit instances in memory.
- On `AppLayout` mount, call a new `bandits.bindToUser(userId)` that loads the per-user state for all 12 bandits. This ensures User A logging in gets only their own data.
- AI Insights Dashboard already reads `getStats()` from those instances, so once per-user binding is in place the charts automatically show only the current user's real adaptation history. Empty state ("No data yet — play games!") already exists and will naturally appear for new users.

### 4. Cleanup
- Keep `AVAILABLE_GAMES` from `mockDoctorData.ts` (it's a static game catalog, not fake metrics) — but move it into `src/lib/gameCatalog.ts` and delete the rest of `mockDoctorData.ts` so no future page can accidentally import mock patients.
- Update the one remaining import in `TrainingPrescriptions.tsx`.

## Files to change

- `src/pages/Doctor/DoctorReports.tsx` — replace mock with real fetch + empty state
- `src/pages/Doctor/PatientList.tsx` — add "Add Patient" dialog and remove action
- `src/lib/doctorDataService.ts` — add `assignPatientByEmail`, `unassignPatient`, `fetchCohortTrend`
- `src/lib/bandit/storage.ts` (new) — user-scoped storage helper + `bindToUser` / `resetAll`
- `src/lib/bandit/*.ts` (12 files) — switch each `STORAGE_KEY` constant to the helper
- `src/components/Layout/AppLayout.tsx` — call `bandits.bindToUser(user.id)` on login
- `src/context/AuthContext.tsx` — call `bandits.resetAll()` on logout
- `src/lib/gameCatalog.ts` (new) — extract `AVAILABLE_GAMES`
- `src/pages/Doctor/TrainingPrescriptions.tsx` — update import
- `src/lib/mockDoctorData.ts` — delete

## Outcome

- Doctor logs in → sees an empty dashboard with a clear "Add Patient" CTA (no fake numbers).
- Doctor adds a real patient by email → that patient and their actual game sessions appear across Overview, Patients, Reports, and can be assigned a Training Plan.
- AI Lab → shows ONLY the current logged-in user's bandit history. New users see "No data yet — play games!". Different users on the same browser no longer see each other's data.
- Nothing else breaks: existing patient-side flows (games, dashboard, analytics) continue to work because they already query Supabase by `auth.uid()`.
