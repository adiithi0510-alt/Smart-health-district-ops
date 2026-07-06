
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1ot5Z7G6vAWPhP5R9Jle83zkiG5EEfnmxep2_lBbT84c/edit?gid=0#gid=0";
const AI_API_KEY = PropertiesService.getScriptProperties().getProperty('AI_API_KEY');
const AI_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const AI_MODEL = "llama-3.3-70b-versatile";

function callAI(promptText) {
  const payload = {
    model: AI_MODEL,
    messages: [{ role: "user", content: promptText }],
    response_format: { type: "json_object" }
  };
  const options = {
    method: "post",
    contentType: "application/json",
    headers: { "Authorization": "Bearer " + AI_API_KEY },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(AI_ENDPOINT, options);
  const data = JSON.parse(response.getContentText());
  try {
    return data.choices[0].message.content;
  } catch (e) {
    Logger.log("AI error: " + response.getContentText());
    return null;
  }
}

function testAI() {
  const testPrompt = "Say hello in one sentence, respond in json format as {\"message\": \"...\"}";
  const result = callAI(testPrompt);
  Logger.log(result);
}

function parseRawInput() {
  const ss = SpreadsheetApp.openByUrl(SHEET_URL);
  const rawSheet = ss.getSheetByName("RawInput");
  const stockSheet = ss.getSheetByName("StockLogs");
  const centresSheet = ss.getSheetByName("Centres");

  const rawData = rawSheet.getDataRange().getValues();
  const centreNames = centresSheet.getDataRange().getValues().slice(1).map(function(r) { return r[1]; });

  for (var i = 1; i < rawData.length; i++) {
    var row = rawData[i];
    if (row[3]) continue;

    var text = row[1];
    var prompt = "You are a multilingual data-entry parser for a rural health system in India. " +
      "Known centre names: " + centreNames.join(", ") + ". " +
      "Known medicines: Paracetamol, ORS, Amoxicillin, Insulin, IV Fluids, Oxygen Cylinders. " +
      "Extract structured data from this message: \"" + text + "\". " +
      "Return ONLY valid json in this exact shape, with no other text: " +
      "{\"centre_name\": \"<best match or null>\", \"medicine\": \"<best match or null>\", \"quantity\": <number or null>, \"urgency\": \"<low|medium|high>\", \"language_detected\": \"<language>\"}";

    var result = callAI(prompt);
    if (!result) continue;

    var parsed;
    try {
      parsed = JSON.parse(result);
    } catch (e) {
      Logger.log("Could not parse: " + result);
      continue;
    }

    rawSheet.getRange(i + 1, 3).setValue(row[2] || parsed.language_detected);
    rawSheet.getRange(i + 1, 4).setValue(JSON.stringify(parsed));

    if (parsed.centre_name && parsed.medicine && parsed.quantity != null) {
      var allCentres = centresSheet.getDataRange().getValues();
      var centreId = "UNKNOWN";
      for (var j = 1; j < allCentres.length; j++) {
        if (allCentres[j][1] === parsed.centre_name) {
          centreId = allCentres[j][0];
          break;
        }
      }
      stockSheet.appendRow([
        "LOG" + new Date().getTime(),
        centreId,
        parsed.medicine,
        parsed.quantity,
        "units",
        20,
        new Date(),
        "ai_parsed"
      ]);
    }
  }
}

function runStockAnalysis() {
  var ss = SpreadsheetApp.openByUrl(SHEET_URL);
  var stockSheet = ss.getSheetByName("StockLogs");
  var alertsSheet = ss.getSheetByName("Alerts");
  var centresSheet = ss.getSheetByName("Centres");

  var stockData = stockSheet.getDataRange().getValues().slice(1);
  var centreData = centresSheet.getDataRange().getValues().slice(1);

  var summaryLines = [];
  for (var i = 0; i < stockData.length; i++) {
    var r = stockData[i];
    summaryLines.push("centre=" + r[1] + ", medicine=" + r[2] + ", qty=" + r[3] + ", threshold=" + r[5] + ", date=" + r[6]);
  }
  var summary = summaryLines.join("\n");

  var centreListParts = [];
  for (var k = 0; k < centreData.length; k++) {
    centreListParts.push(centreData[k][0] + "=" + centreData[k][1]);
  }
  var centreList = centreListParts.join(", ");

  var prompt = "You are a supply-chain analyst AI for a district health department in India. " +
    "Centres: " + centreList + ". " +
    "Recent stock logs: " + summary + ". " +
    "Task 1: Identify medicines at risk of stock-out (quantity at or below threshold). " +
    "Task 2: For each at-risk centre+medicine, check if another centre has surplus of the SAME medicine that could be redistributed. " +
    "Task 3: Rank by urgency. " +
    "Return ONLY a json object with one key \"alerts\" containing an array, no other text, in this shape: " +
    "{\"alerts\":[{\"centre_id\": \"<id>\", \"medicine\": \"<name>\", \"risk_level\": \"<low|medium|high>\", \"message\": \"<one sentence explanation>\", \"recommendation\": \"<one sentence action>\"}]}";

  var result = callAI(prompt);
  if (!result) return;

  var parsedResult;
  try {
    parsedResult = JSON.parse(result);
  } catch (e) {
    Logger.log("Parse failed: " + result);
    return;
  }

  var alerts = parsedResult.alerts;

  for (var m = 0; m < alerts.length; m++) {
    var a = alerts[m];
    alertsSheet.appendRow([
      "ALT" + new Date().getTime() + m,
      a.centre_id,
      "stock_out",
      a.medicine,
      a.risk_level,
      a.message,
      a.recommendation,
      new Date()
    ]);
  }
}