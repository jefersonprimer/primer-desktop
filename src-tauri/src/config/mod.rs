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
    pub enabled: bool,
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

        let smtp_host = get_optional("SMTP_HOST");
        let smtp_port = get_optional("SMTP_PORT").and_then(|v| v.parse::<u16>().ok());
        let smtp_user = get_optional("SMTP_USER");
        let smtp_pass = get_optional("SMTP_PASS");
        let smtp_from = get_optional("SMTP_FROM");

        let smtp_enabled = smtp_host.is_some()
            && smtp_port.is_some()
            && smtp_user.is_some()
            && smtp_pass.is_some()
            && smtp_from.is_some();

        if !smtp_enabled {
            eprintln!("[Config] SMTP disabled (missing SMTP_* env vars); email sending will be a no-op.");
        }

        Self {
            database: DatabaseConfig {
                database_url: env::var("DATABASE_URL").unwrap_or_else(|_| "postgres://localhost/unused".to_string()),
            },

            jwt: JwtConfig {
                jwt_secret: env::var("JWT_SECRET").unwrap_or_else(|_| "not_needed_on_desktop".to_string()),
                refresh_token: parse_duration(&env::var("REFRESH_TOKEN").unwrap_or_else(|_| "720h".to_string())),
                access_token: parse_duration(&env::var("ACCESS_TOKEN").unwrap_or_else(|_| "60m".to_string())),
            },
            smtp: SmtpConfig {
                enabled: smtp_enabled,
                smtp_host: smtp_host.unwrap_or_else(|| "localhost".to_string()),
                smtp_port: smtp_port.unwrap_or(25),
                smtp_user: smtp_user.unwrap_or_default(),
                smtp_pass: smtp_pass.unwrap_or_default(),
                smtp_from: smtp_from.unwrap_or_else(|| "noreply@localhost".to_string()),
            },
        }
    }
}


fn get_optional(key: &str) -> Option<String> {
    env::var(key).ok().and_then(|v| {
        if v.trim().is_empty() {
            None
        } else {
            Some(v)
        }
    })
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
