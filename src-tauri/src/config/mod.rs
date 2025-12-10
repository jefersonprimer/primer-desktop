use dotenvy::dotenv;
use serde::Deserialize;
use std::env;
use chrono::Duration;

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
    pub database_url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct JwtConfig {
    pub jwt_secret: String,
    pub refresh_token: Duration,
    pub access_token: Duration,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SmtpConfig {
    pub smtp_host: String,
    pub smtp_port: u16,
    pub smtp_user: String,
    pub smtp_pass: String,
    pub smtp_from: String,
}

#[derive(Debug, Clone)]
pub struct Config {
    pub database: DatabaseConfig,
    pub jwt: JwtConfig,
    pub smtp: SmtpConfig,
}

impl Config {
    pub fn from_env() -> Self {
        dotenv().ok();

        Self {
            database: DatabaseConfig {
                database_url: get("DATABASE_URL"),
            },

            jwt: JwtConfig {
                jwt_secret: get("JWT_SECRET"),
                refresh_token: parse_duration(&get("REFRESH_TOKEN")),

                access_token: parse_duration(&get("ACCESS_TOKEN")),
            },
            smtp: SmtpConfig {
                smtp_host: get("SMTP_HOST"),
                smtp_port: get("SMTP_PORT").parse().expect("Invalid SMTP_PORT"),
                smtp_user: get("SMTP_USER"),
                smtp_pass: get("SMTP_PASS"),
                smtp_from: get("SMTP_FROM"),
            },
        }
    }
}

fn get(key: &str) -> String {
    env::var(key).unwrap_or_else(|_| panic!("Missing ENV var: {}", key))
}

/// Convert strings like "15m", "2h", "30s", "7d" to chrono::Duration
fn parse_duration(s: &str) -> Duration {
    let unit = s.chars().last().unwrap();
    let value: i64 = s[..s.len() - 1].parse().expect("Invalid duration numeric value");

    match unit {
        's' => Duration::seconds(value),
        'm' => Duration::minutes(value),
        'h' => Duration::hours(value),
        'd' => Duration::days(value),
        _ => panic!("Invalid duration unit: {}", s),
    }
}

