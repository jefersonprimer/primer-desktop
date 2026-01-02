use anyhow::{Result, anyhow};
use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct NotionClient {
    client: reqwest::Client,
    base_url: String,
    token_url: String,
}

#[derive(Debug, Serialize)]
struct TokenExchangeRequest {
    grant_type: String,
    code: String,
    redirect_uri: String,
}

#[derive(Debug, Deserialize)]
pub struct TokenExchangeResponse {
    pub access_token: String,
    pub bot_id: String,
    pub workspace_id: String,
    pub workspace_name: Option<String>,
    pub workspace_icon: Option<String>,
    pub owner: Option<Owner>,
    pub duplicated_template_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Owner {
    #[serde(rename = "type")]
    pub owner_type: String,
}

#[derive(Debug, Serialize)]
#[allow(dead_code)]
struct CreatePageRequest {
    parent: Parent,
    properties: serde_json::Value,
    children: Vec<serde_json::Value>,
}

#[derive(Debug, Serialize)]
#[serde(untagged)]
#[allow(dead_code)]
enum Parent {
    Page { page_id: String },
    Database { database_id: String },
}

#[derive(Debug, Deserialize)]
pub struct SearchResponse {
    pub results: Vec<SearchResult>,
}

#[derive(Debug, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub object: String,
    pub created_time: String,
    pub last_edited_time: String,
    pub url: String,
    pub properties: Option<serde_json::Value>,
    // Add other fields as needed, e.g. title extraction logic might be needed
}

impl NotionClient {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
            base_url: "https://api.notion.com/v1".to_string(),
            token_url: std::env::var("NOTION_TOKEN_URL")
                .unwrap_or_else(|_| "https://api.notion.com/v1/oauth/token".to_string()),
        }
    }

    pub async fn search(
        &self,
        access_token: &str,
        query: Option<&str>,
    ) -> Result<Vec<SearchResult>> {
        let mut body = serde_json::json!({
            "filter": {
                "value": "page",
                "property": "object"
            },
            "sort": {
                "direction": "descending",
                "timestamp": "last_edited_time"
            }
        });

        if let Some(q) = query {
             body.as_object_mut().unwrap().insert("query".to_string(), serde_json::json!(q));
        }

        let response = self
            .client
            .post(format!("{}/search", self.base_url))
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Notion-Version", "2022-06-28")
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow!("Notion API search error: {}", error_text));
        }

        let search_response = response.json::<SearchResponse>().await?;
        Ok(search_response.results)
    }

    pub async fn exchange_token(
        &self,
        client_id: &str,
        client_secret: &str,
        code: &str,
        redirect_uri: &str,
    ) -> Result<TokenExchangeResponse> {
        let auth = general_purpose::STANDARD.encode(format!("{}:{}", client_id, client_secret));
        
        let response = self
            .client
            .post(&self.token_url)
            .header("Authorization", format!("Basic {}", auth))
            .header("Content-Type", "application/json")
            .json(&TokenExchangeRequest {
                grant_type: "authorization_code".to_string(),
                code: code.to_string(),
                redirect_uri: redirect_uri.to_string(),
            })
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow!("Notion API error: {}", error_text));
        }

        let token_response = response.json::<TokenExchangeResponse>().await?;
        Ok(token_response)
    }

    pub async fn create_page(
        &self,
        access_token: &str,
        parent_id: &str,
        title: &str,
        content: &str,
    ) -> Result<String> {
        // Construct the basic page structure
        // Note: This is a simplified version. In a real app we might want structured content.
        let body = serde_json::json!({
            "parent": { "page_id": parent_id },
            "properties": {
                "title": {
                    "title": [{ "text": { "content": title } }]
                }
            },
            "children": [
                 {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{ "text": { "content": content } }]
                    }
                }
            ]
        });

        let response = self
            .client
            .post(format!("{}/pages", self.base_url))
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Notion-Version", "2022-06-28")
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await?;

         if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow!("Failed to create Notion page: {}", error_text));
        }

        let json: serde_json::Value = response.json().await?;
        let page_id = json["id"].as_str().ok_or(anyhow!("No page ID returned"))?;
        
        Ok(page_id.to_string())
    }

    pub async fn archive_page(
        &self,
        access_token: &str,
        page_id: &str,
    ) -> Result<()> {
        let body = serde_json::json!({
            "archived": true
        });

        let response = self
            .client
            .patch(format!("{}/pages/{}", self.base_url, page_id))
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Notion-Version", "2022-06-28")
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow!("Failed to archive Notion page: {}", error_text));
        }

        Ok(())
    }

    pub async fn update_page(
        &self,
        access_token: &str,
        page_id: &str,
        title: &str,
    ) -> Result<()> {
        // Update only the title property
        let body = serde_json::json!({
            "properties": {
                "title": {
                    "title": [{ "text": { "content": title } }]
                }
            }
        });

        let response = self
            .client
            .patch(format!("{}/pages/{}", self.base_url, page_id))
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Notion-Version", "2022-06-28")
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow!("Failed to update Notion page: {}", error_text));
        }

        Ok(())
    }

    /// Get all text blocks from a page as a single string
    pub async fn get_page_content(
        &self,
        access_token: &str,
        page_id: &str,
    ) -> Result<String> {
        let response = self
            .client
            .get(format!("{}/blocks/{}/children", self.base_url, page_id))
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Notion-Version", "2022-06-28")
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow!("Failed to get page blocks: {}", error_text));
        }

        let json: serde_json::Value = response.json().await?;
        let empty_vec = vec![];
        let results = json["results"].as_array().unwrap_or(&empty_vec);

        // Extract text from all paragraph blocks
        let mut content = String::new();
        for block in results {
            if let Some(block_type) = block["type"].as_str() {
                if block_type == "paragraph" {
                    if let Some(rich_text) = block["paragraph"]["rich_text"].as_array() {
                        for text_obj in rich_text {
                            if let Some(plain_text) = text_obj["plain_text"].as_str() {
                                content.push_str(plain_text);
                            }
                        }
                        content.push('\n');
                    }
                }
            }
        }

        Ok(content.trim().to_string())
    }

    /// Get all block IDs for a page (to delete them before updating)
    async fn get_block_ids(
        &self,
        access_token: &str,
        page_id: &str,
    ) -> Result<Vec<String>> {
        let response = self
            .client
            .get(format!("{}/blocks/{}/children", self.base_url, page_id))
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Notion-Version", "2022-06-28")
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow!("Failed to get page blocks: {}", error_text));
        }

        let json: serde_json::Value = response.json().await?;
        let empty_vec = vec![];
        let results = json["results"].as_array().unwrap_or(&empty_vec);

        let ids: Vec<String> = results
            .iter()
            .filter_map(|block| block["id"].as_str().map(|s| s.to_string()))
            .collect();

        Ok(ids)
    }

    /// Delete a block by ID
    async fn delete_block(
        &self,
        access_token: &str,
        block_id: &str,
    ) -> Result<()> {
        let response = self
            .client
            .delete(format!("{}/blocks/{}", self.base_url, block_id))
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Notion-Version", "2022-06-28")
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow!("Failed to delete block: {}", error_text));
        }

        Ok(())
    }

    /// Update page content by replacing all blocks with new content
    pub async fn update_page_content(
        &self,
        access_token: &str,
        page_id: &str,
        content: &str,
    ) -> Result<()> {
        // First, get and delete all existing blocks
        let block_ids = self.get_block_ids(access_token, page_id).await?;
        for block_id in block_ids {
            self.delete_block(access_token, &block_id).await?;
        }

        // Then, add new paragraph blocks for each line
        let paragraphs: Vec<&str> = content.lines().collect();
        let children: Vec<serde_json::Value> = paragraphs
            .iter()
            .map(|line| {
                serde_json::json!({
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{ "text": { "content": *line } }]
                    }
                })
            })
            .collect();

        if children.is_empty() {
            return Ok(());
        }

        let body = serde_json::json!({
            "children": children
        });

        let response = self
            .client
            .patch(format!("{}/blocks/{}/children", self.base_url, page_id))
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Notion-Version", "2022-06-28")
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow!("Failed to update page content: {}", error_text));
        }

        Ok(())
    }
}

