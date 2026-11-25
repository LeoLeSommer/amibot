use std::time::Duration;

use amibot_core::ActivationEntry;
use amibot_schema::entity::module_activation;
use sea_orm::{ConnectOptions, Database, DatabaseConnection, DbErr, EntityTrait};

pub async fn connect(database_url: &str) -> Result<DatabaseConnection, DbErr> {
    let mut options = ConnectOptions::new(database_url.to_owned());
    options
        .max_connections(10)
        .min_connections(1)
        .connect_timeout(Duration::from_secs(10))
        .acquire_timeout(Duration::from_secs(10))
        .sqlx_logging(false);

    Database::connect(options).await
}

pub async fn ping(db: &DatabaseConnection) -> Result<(), DbErr> {
    db.ping().await
}

/// Loads every activation row. A missing row means the module is enabled; the
/// caller applies that policy when building `ActivationState`.
pub async fn load_module_activations(
    db: &DatabaseConnection,
) -> Result<Vec<ActivationEntry>, DbErr> {
    let rows = module_activation::Entity::find().all(db).await?;

    Ok(rows
        .into_iter()
        .map(|row| ActivationEntry::new(row.module_id, row.enabled))
        .collect())
}
