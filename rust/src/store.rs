use std::sync::RwLock;

use chrono::Utc;
use uuid::Uuid;

use crate::models::{CreateTask, Task, TaskStatus, UpdateTask};

/// In-memory store. Data lives for as long as the server process does —
/// it resets on every restart or redeploy. No database, no env vars.
pub struct TaskStore {
    tasks: RwLock<Vec<Task>>,
}

impl TaskStore {
    pub fn new() -> Self {
        let store = Self {
            tasks: RwLock::new(Vec::new()),
        };
        for (title, description, status) in [
            (
                "Read the axum docs",
                Some("Routers, extractors, middleware."),
                TaskStatus::Done,
            ),
            ("Design the task API", None, TaskStatus::InProgress),
            ("Add a database", None, TaskStatus::Open),
        ] {
            store.create(CreateTask {
                title: title.into(),
                description: description.map(Into::into),
                status: Some(status),
            });
        }
        store
    }

    pub fn create(&self, dto: CreateTask) -> Task {
        let now = Utc::now();
        let task = Task {
            id: Uuid::new_v4().to_string(),
            title: dto.title,
            description: dto.description,
            status: dto.status.unwrap_or(TaskStatus::Open),
            created_at: now,
            updated_at: now,
        };
        self.tasks.write().unwrap().push(task.clone());
        task
    }

    /// Newest first, optionally filtered by status and a title/description search.
    pub fn list(&self, status: Option<TaskStatus>, q: Option<&str>) -> Vec<Task> {
        let needle = q.map(str::to_lowercase);
        let mut selected: Vec<Task> = self
            .tasks
            .read()
            .unwrap()
            .iter()
            .filter(|task| {
                if let Some(status) = status {
                    if task.status != status {
                        return false;
                    }
                }
                if let Some(needle) = &needle {
                    let haystack = format!(
                        "{} {}",
                        task.title,
                        task.description.as_deref().unwrap_or("")
                    )
                    .to_lowercase();
                    if !haystack.contains(needle) {
                        return false;
                    }
                }
                true
            })
            .cloned()
            .collect();
        selected.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        selected
    }

    pub fn get(&self, id: &str) -> Option<Task> {
        self.tasks
            .read()
            .unwrap()
            .iter()
            .find(|task| task.id == id)
            .cloned()
    }

    pub fn update(&self, id: &str, dto: UpdateTask) -> Option<Task> {
        let mut tasks = self.tasks.write().unwrap();
        let task = tasks.iter_mut().find(|task| task.id == id)?;
        if let Some(title) = dto.title {
            task.title = title;
        }
        if let Some(description) = dto.description {
            task.description = Some(description);
        }
        if let Some(status) = dto.status {
            task.status = status;
        }
        task.updated_at = Utc::now();
        Some(task.clone())
    }

    pub fn remove(&self, id: &str) -> bool {
        let mut tasks = self.tasks.write().unwrap();
        let before = tasks.len();
        tasks.retain(|task| task.id != id);
        tasks.len() != before
    }
}

impl Default for TaskStore {
    fn default() -> Self {
        Self::new()
    }
}
