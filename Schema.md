# Sheet Schema

This project's database is a single Google Sheet (`SmartHealth_DB`) with four tabs. Column order matters — the Apps Script code reads columns by position (A, B, C...), so keep headers in exactly this order if reproducing this setup.

---

## Tab: `Centres`

| Column | Field | Type | Notes |
|---|---|---|---|
| A | `centre_id` | Text | Unique ID, e.g. `C1`. Also the table's key. |
| B | `centre_name` | Text | e.g. `PHC Kanakapura` |
| C | `type` | Text | `PHC` or `CHC` |
| D | `taluk` | Text | Local administrative area name |
| E | `beds_total` | Number | Total bed capacity |
| F | `beds_occupied` | Number | Currently occupied beds |
| G | `doctor_present` | Boolean | `TRUE` / `FALSE` |
| H | `last_updated` | DateTime | Can be left blank |

**Sample rows:**

```
C1  PHC Kanakapura   PHC  Kanakapura   10  6   TRUE
C2  CHC Ramanagara    CHC  Ramanagara   25  20  TRUE
C3  PHC Channapatna   PHC  Channapatna  8   3   FALSE
C4  CHC Magadi        CHC  Magadi       20  14  TRUE
```

---

## Tab: `StockLogs`

| Column | Field | Type | Notes |
|---|---|---|---|
| A | `log_id` | Text | Unique ID, e.g. `L1` or auto-generated `LOG<timestamp>` |
| B | `centre_id` | Text | Must match a `centre_id` from `Centres` |
| C | `medicine` | Text | e.g. `Paracetamol`, `ORS`, `Amoxicillin`, `Insulin`, `IV Fluids`, `Oxygen Cylinders` |
| D | `quantity` | Number | Current stock count |
| E | `unit` | Text | e.g. `units` |
| F | `threshold` | Number | Quantity below which stock is considered at risk |
| G | `date` | DateTime | When this entry was logged |
| H | `source` | Text | `manual` or `ai_parsed` |

**Sample rows (to trigger a meaningful AI analysis):**

```
L1  C1  Paracetamol  6   units  20  2026-07-06  manual
L2  C2  Paracetamol  80  units  20  2026-07-06  manual
L3  C3  ORS          10  units  15  2026-07-06  manual
L4  C4  ORS          60  units  15  2026-07-06  manual
```

This pattern (one centre critically low, another with surplus of the *same* medicine) is what lets the AI generate a redistribution recommendation, not just a shortage warning.

---

## Tab: `Alerts`

| Column | Field | Type | Notes |
|---|---|---|---|
| A | `alert_id` | Text | Auto-generated, e.g. `ALT<timestamp>` |
| B | `centre_id` | Text | Which centre this alert concerns |
| C | `type` | Text | Currently always `stock_out` |
| D | `medicine` | Text | Medicine the alert is about |
| E | `risk_level` | Text | `high`, `medium`, or `low` |
| F | `message` | Text | One-sentence AI-generated explanation |
| G | `recommendation` | Text | One-sentence AI-generated action |
| H | `created_at` | DateTime | Auto-filled when the alert is written |

**This tab is written entirely by `runStockAnalysis()` — do not populate it manually.**

---

## Tab: `RawInput`

| Column | Field | Type | Notes |
|---|---|---|---|
| A | `input_id` | Text | Unique ID, e.g. `IN1` |
| B | `raw_text` | Text | The original free-text message, any language |
| C | `language_guess` | Text | Auto-filled by `parseRawInput()` |
| D | `parsed_json` | Text | Auto-filled — the structured JSON the AI extracted |
| E | `timestamp` | DateTime | Optional, can be left blank |

**You only ever fill in columns A and B manually.** Columns C and D are populated automatically once `parseRawInput()` runs.

**Sample row:**

```
IN1  Kanakapura PHC mein paracetamol bahut kam hai, sirf 5 bache hain  (blank)  (blank)
```

---

## Quick Setup Checklist

1. Create tabs in this exact order: `Centres`, `StockLogs`, `Alerts`, `RawInput`
2. Type headers in row 1 of each tab, exactly as listed above, in column order
3. Add the 4 sample `Centres` rows first — everything else references these
4. Add a few `StockLogs` rows following the shortage/surplus pattern shown above
5. Add one `RawInput` row with a multilingual test message
6. Run `parseRawInput`, then `runStockAnalysis`, and check `StockLogs` and `Alerts` for new AI-generated rows
