use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;
use anyhow::{Result, anyhow};
use crate::domain::user::{
    entity::user::User,
    repository::user_repository::UserRepository,
};

pub struct SqlUserRepository {
    pool: PgPool,
}

impl SqlUserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl UserRepository for SqlUserRepository {
    async fn create(&self, user: User) -> Result<User> {
        sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (id, email, password_hash, google_id, full_name, profile_picture, plan, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, email, password_hash, google_id, full_name, profile_picture, plan, created_at, updated_at
            "#
        )
        .bind(user.id)
        .bind(user.email.clone())
        .bind(user.password_hash.clone())
        .bind(user.google_id.clone())
        .bind(user.full_name.clone())
        .bind(user.profile_picture.clone())
        .bind(user.plan.clone())
        .bind(user.created_at)
        .bind(user.updated_at)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to create user: {}", e))
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>> {
        let rec = sqlx::query_as::<_, User>(
            r#"
            SELECT id, email, password_hash, google_id, full_name, profile_picture, plan, created_at, updated_at
            FROM users
            WHERE id = $1
            "#
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to find user by id: {}", e))?;

        Ok(rec)
    }

    async fn find_by_email(&self, email: &str) -> Result<Option<User>> {
        let rec = sqlx::query_as::<_, User>(
            r#"
            SELECT id, email, password_hash, google_id, full_name, profile_picture, plan, created_at, updated_at
            FROM users
            WHERE email = $1
            "#
        )
        .bind(email)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to find user by email: {}", e))?;

        Ok(rec)
    }

    async fn find_by_google_id(&self, google_id: &str) -> Result<Option<User>> {
        let rec = sqlx::query_as::<_, User>(
            r#"
            SELECT id, email, password_hash, google_id, full_name, profile_picture, plan, created_at, updated_at
            FROM users
            WHERE google_id = $1
            "#
        )
        .bind(google_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to find user by google_id: {}", e))?;

        Ok(rec)
    }

    async fn update(&self, user: User) -> Result<User> {
        sqlx::query_as::<_, User>(
            r#"
            UPDATE users
            SET email = $2, password_hash = $3, google_id = $4, full_name = $5, profile_picture = $6, plan = $7, updated_at = $8
            WHERE id = $1
            RETURNING id, email, password_hash, google_id, full_name, profile_picture, plan, created_at, updated_at
            "#
        )
        .bind(user.id)
        .bind(user.email.clone())
        .bind(user.password_hash.clone())
        .bind(user.google_id.clone())
        .bind(user.full_name.clone())
        .bind(user.profile_picture.clone())
        .bind(user.plan.clone())
        .bind(user.updated_at)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to update user: {}", e))
    }

    async fn delete(&self, id: Uuid) -> Result<()> {
        sqlx::query(
            r#"
            DELETE FROM users
            WHERE id = $1
            "#
        )
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to delete user: {}", e))?;

        Ok(())
    }
}

