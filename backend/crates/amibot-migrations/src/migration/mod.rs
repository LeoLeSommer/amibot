pub use sea_orm_migration::prelude::*;

mod m20261125_000001_create_module_activation;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![Box::new(
            m20261125_000001_create_module_activation::Migration,
        )]
    }
}
