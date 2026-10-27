use std::sync::Arc;

use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::routing::get;
use axum::{Json, Router};
use tower_http::trace::TraceLayer;

use crate::error::{ApiError, ApiJson};
use crate::models::{CreateTask, Task, TaskFilter, TaskStatus, UpdateTask};
use crate::store::TaskStore;

type SharedStore = Arc<TaskStore>;

const TITLE_MAX: usize = 120;
const DESCRIPTION_MAX: usize = 2000;

pub fn router(store: SharedStore) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/tasks", get(list_tasks).post(create_task))
        .route(
            "/tasks/{id}",
            get(get_task).patch(update_task).delete(delete_task),
        )
        // Request logs, the morgan analog.
        .layer(TraceLayer::new_for_http())
        .with_state(store)
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok" }))
}

async fn list_tasks(
    State(store): State<SharedStore>,
    Query(filter): Query<TaskFilter>,
) -> Result<Json<Vec<Task>>, ApiError> {
    let status = match filter.status.as_deref() {
        None | Some("") => None,
        Some(value) => Some(TaskStatus::parse(value).ok_or_else(|| {
            ApiError::bad_request(format!(
                "unknown status '{value}' (expected open, in_progress, or done)"
            ))
        })?),
    };
    Ok(Json(store.list(status, filter.q.as_deref())))
}

async fn get_task(
    State(store): State<SharedStore>,
    Path(id): Path<String>,
) -> Result<Json<Task>, ApiError> {
    store
        .get(&id)
        .map(Json)
        .ok_or_else(|| ApiError::not_found(&id))
}

async fn create_task(
    State(store): State<SharedStore>,
    ApiJson(dto): ApiJson<CreateTask>,
) -> Result<(StatusCode, Json<Task>), ApiError> {
    dto.validate()?;
    Ok((StatusCode::CREATED, Json(store.create(dto))))
}

async fn update_task(
    State(store): State<SharedStore>,
    Path(id): Path<String>,
    ApiJson(dto): ApiJson<UpdateTask>,
) -> Result<Json<Task>, ApiError> {
    if let Some(title) = &dto.title {
        validate_title(title)?;
    }
    if let Some(description) = &dto.description {
        validate_description(description)?;
    }
    store
        .update(&id, dto)
        .map(Json)
        .ok_or_else(|| ApiError::not_found(&id))
}

async fn delete_task(
    State(store): State<SharedStore>,
    Path(id): Path<String>,
) -> Result<StatusCode, ApiError> {
    if store.remove(&id) {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(ApiError::not_found(&id))
    }
}

impl CreateTask {
    fn validate(&self) -> Result<(), ApiError> {
        validate_title(&self.title)?;
        if let Some(description) = &self.description {
            validate_description(description)?;
        }
        Ok(())
    }
}

fn validate_title(title: &str) -> Result<(), ApiError> {
    if title.trim().is_empty() {
        return Err(ApiError::bad_request("title should not be empty"));
    }
    if title.len() > TITLE_MAX {
        return Err(ApiError::bad_request(format!(
            "title must be at most {TITLE_MAX} characters"
        )));
    }
    Ok(())
}

fn validate_description(description: &str) -> Result<(), ApiError> {
    if description.len() > DESCRIPTION_MAX {
        return Err(ApiError::bad_request(format!(
            "description must be at most {DESCRIPTION_MAX} characters"
        )));
    }
    Ok(())
}
