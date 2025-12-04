use anyhow::Result;
use jsonwebtoken::{encode, Header, EncodingKey};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{Utc, Duration};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // user_id
    pub exp: usize,
}

pub trait TokenGenerator: Send + Sync {

    fn generate_token(&self, user_id: Uuid) -> Result<String>;

    fn generate_reset_token(&self, user_id: Uuid) -> Result<String>;

    fn decode_token(&self, token: &str) -> Result<Claims>;

}



pub struct JwtTokenGenerator {
    secret: String,
    access_token_ttl: Duration,
    one_time_token_duration: Duration,
}

impl JwtTokenGenerator {
    pub fn new(secret: String, access_token_ttl: Duration, one_time_token_duration: Duration) -> Self {
        Self { secret, access_token_ttl, one_time_token_duration }
    }
}

impl TokenGenerator for JwtTokenGenerator {
    fn generate_token(&self, user_id: Uuid) -> Result<String> {
        let expiration = Utc::now()
            .checked_add_signed(self.access_token_ttl)
            .expect("valid timestamp")
            .timestamp();

        let claims = Claims {
            sub: user_id.to_string(),
            exp: expiration as usize,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.secret.as_bytes()),
        )
        .map_err(|e| anyhow::anyhow!("Failed to generate token: {}", e))
    }

    fn generate_reset_token(&self, user_id: Uuid) -> Result<String> {
        let expiration = Utc::now()
            .checked_add_signed(self.one_time_token_duration)
            .expect("valid timestamp")
            .timestamp();

        let claims = Claims {
            sub: user_id.to_string(),
            exp: expiration as usize,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.secret.as_bytes()),
        )
        .map_err(|e| anyhow::anyhow!("Failed to generate reset token: {}", e))
    }



    fn decode_token(&self, token: &str) -> Result<Claims> {

        let token_data = jsonwebtoken::decode::<Claims>(

            token,

            &jsonwebtoken::DecodingKey::from_secret(self.secret.as_bytes()),

            &jsonwebtoken::Validation::default(),

        ).map_err(|e| anyhow::anyhow!("Failed to decode token: {}", e))?;

        Ok(token_data.claims)

    }

}
