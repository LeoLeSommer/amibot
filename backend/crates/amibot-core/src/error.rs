use thiserror::Error;

#[derive(Debug, Error, PartialEq, Eq)]
pub enum AmibotError {
    #[error("invalid {kind} identifier: {value}")]
    InvalidId { kind: &'static str, value: String },
    #[error("module {0} is already registered")]
    DuplicateModule(String),
    #[error("capability {capability} is already provided by {module}")]
    DuplicateCapability { capability: String, module: String },
    #[error("duplicate contribution {contribution} in module {module}")]
    DuplicateContribution {
        module: String,
        contribution: String,
    },
    #[error("module {module} declares an invalid UI contribution: {reason}")]
    InvalidContribution { module: String, reason: String },
    #[error("module {module} declares dependency {dependency} more than once")]
    DuplicateDependency { module: String, dependency: String },
    #[error("module {module} depends on itself")]
    SelfDependency { module: String },
    #[error("module {module} requires missing dependency {dependency}")]
    MissingDependency { module: String, dependency: String },
    #[error("module {module} requires disabled dependency {dependency}")]
    DisabledDependency { module: String, dependency: String },
    #[error("module {module} requires core {requirement}, current core is {current}")]
    CoreIncompatible {
        module: String,
        requirement: String,
        current: String,
    },
    #[error("module dependency cycle detected: {0}")]
    DependencyCycle(String),
}

pub type AmibotResult<T> = Result<T, AmibotError>;
