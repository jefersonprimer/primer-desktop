use anyhow::Result;
use argon2::{
    password_hash::{
        rand_core::OsRng,
        PasswordHash, PasswordHasher as _, PasswordVerifier, SaltString
    },
    Argon2
};

pub trait PasswordHasher: Send + Sync {
    fn hash(&self, password: &str) -> Result<String>;
    fn verify(&self, hash: &str, password: &str) -> Result<bool>;
}

pub struct Argon2PasswordHasher;

impl Argon2PasswordHasher {
    pub fn new() -> Self {
        Self
    }
}

impl PasswordHasher for Argon2PasswordHasher {
    fn hash(&self, password: &str) -> Result<String> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2.hash_password(password.as_bytes(), &salt)
            .map_err(|e| anyhow::anyhow!("Failed to hash password: {}", e))?;
        Ok(password_hash.to_string())
    }

    fn verify(&self, hash: &str, password: &str) -> Result<bool> {
        let parsed_hash = PasswordHash::new(hash)
            .map_err(|e| anyhow::anyhow!("Invalid password hash: {}", e))?;
        let argon2 = Argon2::default();
        match argon2.verify_password(password.as_bytes(), &parsed_hash) {
            Ok(_) => Ok(true),
            Err(argon2::password_hash::Error::Password) => Ok(false),
            Err(e) => Err(anyhow::anyhow!("Failed to verify password: {}", e)),
        }
    }
}