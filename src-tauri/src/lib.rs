use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use reqwest::Client;
use serde::Serialize;
use serde_json::Value;
use std::time::Duration;

const API_ORIGIN: &str = "https://android-api.duolingo.com";

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AccountSnapshot {
    user_id: u64,
    api_origin: &'static str,
    quests: Value,
    progress: Value,
    schema: Value,
    energy: Value,
    xp_summaries: Value,
}

fn user_id_from_jwt(jwt: &str) -> Result<u64, String> {
    if jwt.len() > 16_384 {
        return Err("The supplied session token is too long.".into());
    }
    let mut parts = jwt.split('.');
    let _header = parts.next().ok_or("Invalid session token format.")?;
    let payload = parts.next().ok_or("Invalid session token format.")?;
    let _signature = parts.next().ok_or("Invalid session token format.")?;
    if parts.next().is_some() {
        return Err("Invalid session token format.".into());
    }
    let decoded = URL_SAFE_NO_PAD
        .decode(payload)
        .map_err(|_| "Could not decode the session token payload.")?;
    let claims: Value = serde_json::from_slice(&decoded)
        .map_err(|_| "The session token payload is not valid JSON.")?;
    claims
        .get("sub")
        .and_then(Value::as_u64)
        .ok_or_else(|| "The token does not contain the numeric Duolingo user ID (sub).".into())
}

async fn fetch_json(client: &Client, jwt: &str, path: &str, query: &[(&str, &str)]) -> Result<Value, String> {
    let response = client
        .get(format!("{API_ORIGIN}{path}"))
        .bearer_auth(jwt)
        .query(query)
        .send()
        .await
        .map_err(|_| "Could not reach the Duolingo Android API. Check your connection.".to_string())?;
    let status = response.status();
    if !status.is_success() {
        return Err(match status.as_u16() {
            401 | 403 => "Duolingo rejected this session token. Reconnect with a current token.".into(),
            404 => "The Android API did not find this account resource.".into(),
            429 => "Duolingo is rate-limiting requests. Try again shortly.".into(),
            _ => format!("Duolingo API request failed (HTTP {}).", status.as_u16()),
        });
    }
    response
        .json::<Value>()
        .await
        .map_err(|_| "Duolingo returned a response that could not be read.".to_string())
}

#[tauri::command]
async fn connect_duolingo_account(jwt: String, ui_language: String, timezone: String, start_date: String, end_date: String) -> Result<AccountSnapshot, String> {
    let token = jwt.trim();
    if token.is_empty() {
        return Err("Paste a Duolingo session token to connect.".into());
    }
    let user_id = user_id_from_jwt(token)?;
    let client = Client::builder()
        .timeout(Duration::from_secs(25))
        .user_agent("DuolingoDesktop/0.1.0")
        .build()
        .map_err(|_| "Could not initialize the API client.".to_string())?;

    // These read-only routes and query parameters are present in the supplied
    // Android APK (defpackage.kci). No lesson-answer or purchase endpoints are called.
    let quests = fetch_json(&client, token, &format!("/users/{user_id}/quests"), &[("timezone", &timezone)]).await?;
    let progress = fetch_json(&client, token, &format!("/users/{user_id}/progress"), &[("ui_language", &ui_language), ("timezone", &timezone)]).await?;
    let schema = fetch_json(&client, token, &format!("/users/{user_id}/schema"), &[("ui_language", &ui_language), ("timezone", &timezone)]).await?;
    let energy = fetch_json(&client, token, &format!("/2017-06-30/users/{user_id}/energy-info"), &[]).await?;
    let xp_summaries = fetch_json(&client, token, &format!("/2017-06-30/users/{user_id}/xp_summaries"), &[("startDate", &start_date), ("endDate", &end_date)]).await?;

    Ok(AccountSnapshot {
        user_id,
        api_origin: API_ORIGIN,
        quests,
        progress,
        schema,
        energy,
        xp_summaries,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![connect_duolingo_account])
        .run(tauri::generate_context!())
        .expect("error while running Duolingo Desktop");
}
