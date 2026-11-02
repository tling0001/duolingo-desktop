use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use reqwest::Client;
use serde::Serialize;
use serde_json::{json, Value};
use std::time::Duration;
const API_ORIGIN:&str="https://android-api.duolingo.com";
#[derive(Debug,Serialize)]
#[serde(rename_all="camelCase")]
struct AccountSnapshot{user_id:u64,api_origin:&'static str,quests:Value,progress:Value,schema:Value,energy:Value,xp_summaries:Value}
#[derive(Debug,Serialize)]
#[serde(rename_all="camelCase")]
struct AuthenticatedAccount{jwt:String,snapshot:AccountSnapshot}
fn user_id_from_jwt(jwt:&str)->Result<u64,String>{
 if jwt.len()>16384{return Err("The supplied session token is too long.".into());}
 let mut p=jwt.split('.');let _h=p.next().ok_or("Invalid session token format.")?;let payload=p.next().ok_or("Invalid session token format.")?;let _s=p.next().ok_or("Invalid session token format.")?;
 if p.next().is_some(){return Err("Invalid session token format.".into());}
 let decoded=URL_SAFE_NO_PAD.decode(payload).map_err(|_|"Could not decode the session token payload.")?;
 let claims:Value=serde_json::from_slice(&decoded).map_err(|_|"The session token payload is not valid JSON.")?;
 claims.get("sub").and_then(Value::as_u64).ok_or_else(||"The token does not contain the numeric Duolingo user ID (sub).".into())
}
async fn fetch_json(client:&Client,jwt:&str,path:&str,query:&[(&str,&str)])->Result<Value,String>{
 let response=client.get(format!("{API_ORIGIN}{path}")).bearer_auth(jwt).query(query).send().await.map_err(|_|"Could not reach the Duolingo Android API. Check your connection.".to_string())?;
 let status=response.status();if !status.is_success(){return Err(match status.as_u16(){401|403=>"Duolingo rejected this session token. Reconnect with a current token.".into(),404=>"The Android API did not find this account resource.".into(),429=>"Duolingo is rate-limiting requests. Try again shortly.".into(),_=>format!("Duolingo API request failed (HTTP {}).",status.as_u16())});}
 response.json::<Value>().await.map_err(|_|"Duolingo returned a response that could not be read.".to_string())
}
async fn fetch_account_snapshot(client:&Client,token:&str,ui_language:&str,timezone:&str,start_date:&str,end_date:&str)->Result<AccountSnapshot,String>{
 let user_id=user_id_from_jwt(token)?;
 let quests=fetch_json(client,token,&format!("/users/{user_id}/quests"),&[("timezone",timezone)]).await?;
 let progress=fetch_json(client,token,&format!("/users/{user_id}/progress"),&[("ui_language",ui_language),("timezone",timezone)]).await?;
 let schema=fetch_json(client,token,&format!("/users/{user_id}/schema"),&[("ui_language",ui_language),("timezone",timezone)]).await?;
 let energy=fetch_json(client,token,&format!("/2017-06-30/users/{user_id}/energy-info"),&[]).await?;
 let xp_summaries=fetch_json(client,token,&format!("/2017-06-30/users/{user_id}/xp_summaries"),&[("startDate",start_date),("endDate",end_date)]).await?;
 Ok(AccountSnapshot{user_id,api_origin:API_ORIGIN,quests,progress,schema,energy,xp_summaries})
}
// APK confirms POST /2017-06-30/login with identifier/password/distinctId.
// The response model is absent from the decompilation: only a JWT that can
// authenticate against the known read-only routes is accepted as a login.
fn find_jwt(v:&Value)->Option<String>{match v{
 Value::Object(m)=>{for k in ["jwt","sessionJwt","session_jwt","authToken","auth_token","token"]{if let Some(Value::String(t))=m.get(k){if t.matches('.').count()==2&&t.len()<16384{return Some(t.clone());}}}m.values().find_map(find_jwt)},
 Value::Array(a)=>a.iter().find_map(find_jwt),_=>None}}
#[tauri::command]
async fn login_duolingo_email(identifier:String,password:String,distinct_id:String,ui_language:String,timezone:String,start_date:String,end_date:String)->Result<AuthenticatedAccount,String>{
 let identifier=identifier.trim();if identifier.is_empty()||password.is_empty(){return Err("Enter your account identifier and password.".into());}
 if identifier.len()>320||password.len()>4096||distinct_id.len()>128{return Err("The sign-in details exceed the supported length.".into());}
 if distinct_id.trim().is_empty(){return Err("Could not create this device's sign-in identifier. Try again.".into());}
 let client=Client::builder().timeout(Duration::from_secs(30)).user_agent("DuolingoDesktop/0.1.0").build().map_err(|_|"Could not initialize the sign-in connection.".to_string())?;
 let response=client.post(format!("{API_ORIGIN}/2017-06-30/login")).json(&json!({"identifier":identifier,"password":password,"distinctId":distinct_id})).send().await.map_err(|_|"Could not reach Duolingo sign-in. Check your connection and try again.".to_string())?;
 let status=response.status();if !status.is_success(){return Err(match status.as_u16(){400|401|403=>"Duolingo could not sign you in. Check your email/username and password, then try again.".into(),429=>"Duolingo is temporarily limiting sign-in attempts. Wait a moment and try again.".into(),_ if status.is_server_error()=>format!("Duolingo sign-in is temporarily unavailable (HTTP {}).",status.as_u16()),_=>format!("Duolingo sign-in was rejected (HTTP {}).",status.as_u16())});}
 let body=response.json::<Value>().await.map_err(|_|"Duolingo responded to sign-in, but the response format was not recognized.".to_string())?;
 let jwt=find_jwt(&body).ok_or_else(||"Duolingo accepted the sign-in request but did not return a recognizable session JWT. No account session was created in this app.".to_string())?;
 let snapshot=fetch_account_snapshot(&client,&jwt,&ui_language,&timezone,&start_date,&end_date).await.map_err(|_|"Duolingo returned a token, but it could not be verified as an active account session. Try again.".to_string())?;
 Ok(AuthenticatedAccount{jwt,snapshot})
}
#[tauri::command]
async fn connect_duolingo_account(jwt:String,ui_language:String,timezone:String,start_date:String,end_date:String)->Result<AccountSnapshot,String>{
 let token=jwt.trim();if token.is_empty(){return Err("Paste a Duolingo session token to connect.".into());}
 let client=Client::builder().timeout(Duration::from_secs(25)).user_agent("DuolingoDesktop/0.1.0").build().map_err(|_|"Could not initialize the API client.".to_string())?;
 fetch_account_snapshot(&client,token,&ui_language,&timezone,&start_date,&end_date).await
}
#[cfg_attr(mobile,tauri::mobile_entry_point)]
pub fn run(){tauri::Builder::default().invoke_handler(tauri::generate_handler![connect_duolingo_account,login_duolingo_email]).run(tauri::generate_context!()).expect("error while running Duolingo Desktop");}
